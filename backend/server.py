from fastapi import FastAPI, APIRouter, HTTPException, Depends, status, Query
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict, EmailStr
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime, timezone, timedelta
from dateutil.relativedelta import relativedelta
import jwt
import bcrypt
from Crypto.Cipher import AES
from Crypto.Random import get_random_bytes
import base64
import secrets

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# JWT Configuration
JWT_SECRET = os.environ.get('JWT_SECRET', secrets.token_hex(32))
JWT_REFRESH_SECRET = os.environ.get('JWT_REFRESH_SECRET', secrets.token_hex(32))
JWT_ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_HOURS = 24
REFRESH_TOKEN_EXPIRE_DAYS = 7

# Vault Encryption Key
VAULT_MASTER_KEY = os.environ.get('VAULT_MASTER_KEY', secrets.token_hex(16))  # 32 hex chars = 16 bytes

# Create the main app
app = FastAPI(title="Signal by Profitcast API", version="2.1")

# Create routers
api_router = APIRouter(prefix="/api")
auth_router = APIRouter(prefix="/auth", tags=["Authentication"])
hrm_router = APIRouter(prefix="/hrm", tags=["HRM"])
pms_router = APIRouter(prefix="/pms", tags=["PMS"])
vault_router = APIRouter(prefix="/vault", tags=["Vault"])
notifications_router = APIRouter(prefix="/notifications", tags=["Notifications"])
issues_router = APIRouter(prefix="/issues", tags=["Issues"])
automation_router = APIRouter(prefix="/automation", tags=["Automation"])
calendar_router = APIRouter(prefix="/calendar", tags=["Calendar"])

security = HTTPBearer()

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# ==================== ENUMS ====================
ROLE_LEVELS = {
    "employee": 1,
    "team_lead": 2,
    "manager": 3,
    "hr_manager": 4,
    "managing_director": 5,
    "super_admin": 6
}

LEAVE_TYPES = ["sick", "casual", "earned", "compensatory", "maternity", "paternity", "loss_of_pay"]
TASK_STATUS = ["todo", "in_progress", "in_review", "completed"]
PROJECT_STATUS = ["onboarding", "active", "in_progress", "on_hold", "completed", "archived"]
ISSUE_TYPES = ["project", "operational", "client", "technical", "compliance"]
ISSUE_STATUS = ["open", "acknowledged", "in_progress", "blocked", "in_review", "resolved", "closed", "re_opened"]
ESCALATION_PRIORITY = ["critical", "high", "medium", "low"]
ESCALATION_STATUS = ["open", "in_progress", "resolved", "closed"]

# ==================== MODELS ====================
class UserCreate(BaseModel):
    username: str
    email: EmailStr
    password: str
    role: str = "employee"
    first_name: str
    last_name: str
    department_id: Optional[str] = None

class UserLogin(BaseModel):
    username: str
    password: str

class UserResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    username: str
    email: str
    role: str
    role_level: int
    first_name: str
    last_name: str
    department_id: Optional[str] = None
    is_active: bool = True
    created_at: str

class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    user: UserResponse

class RefreshTokenRequest(BaseModel):
    refresh_token: str

# Department Models
class DepartmentCreate(BaseModel):
    name: str
    description: Optional[str] = None
    head_id: Optional[str] = None

class DepartmentResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    name: str
    description: Optional[str] = None
    head_id: Optional[str] = None
    created_at: str

# Employee Models
class EmployeeCreate(BaseModel):
    user_id: str
    employee_code: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    date_of_birth: Optional[str] = None
    date_of_joining: str
    designation: str
    department_id: str
    reporting_manager_id: Optional[str] = None
    employment_type: str = "full_time"  # full_time, part_time, contract, intern
    status: str = "active"  # active, on_leave, resigned, terminated

class EmployeeResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    user_id: str
    employee_code: str
    phone: Optional[str] = None
    address: Optional[str] = None
    date_of_birth: Optional[str] = None
    date_of_joining: str
    designation: str
    department_id: str
    reporting_manager_id: Optional[str] = None
    employment_type: str
    status: str
    created_at: str

# Attendance Models
class AttendanceCheckIn(BaseModel):
    note: Optional[str] = None

class AttendanceCheckOut(BaseModel):
    note: Optional[str] = None

class AttendanceResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    employee_id: str
    date: str
    entries: List[Dict[str, Any]]  # [{check_in, check_out, note}]
    is_late: bool = False
    has_overtime: bool = False
    total_hours: float = 0
    created_at: str

# Leave Models
class LeaveCreate(BaseModel):
    leave_type: str
    start_date: str
    end_date: str
    reason: str
    half_day: bool = False

class LeaveResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    employee_id: str
    leave_type: str
    start_date: str
    end_date: str
    reason: str
    half_day: bool
    status: str  # pending, approved, rejected, cancelled
    approved_by: Optional[str] = None
    created_at: str

class LeaveBalanceResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    employee_id: str
    balances: Dict[str, float]
    year: int

# Escalation Models
class EscalationCreate(BaseModel):
    title: str
    description: str
    priority: str = "medium"
    category: Optional[str] = None

class EscalationResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    employee_id: str
    title: str
    description: str
    priority: str
    status: str
    category: Optional[str] = None
    assigned_to: Optional[str] = None
    resolved_at: Optional[str] = None
    created_at: str

# Project Models
class ProjectCreate(BaseModel):
    name: str
    client_name: str
    description: Optional[str] = None
    budget: int = 0  # In paise
    start_date: str
    end_date: Optional[str] = None
    services: List[str] = []
    team_members: List[str] = []
    tags: List[str] = []

class ProjectResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    name: str
    client_name: str
    description: Optional[str] = None
    budget: int
    start_date: str
    end_date: Optional[str] = None
    status: str
    services: List[str]
    team_members: List[str]
    tags: List[str]
    progress: float = 0
    created_by: str
    created_at: str

# Task Models
class TaskCreate(BaseModel):
    project_id: str
    title: str
    description: Optional[str] = None
    priority: str = "medium"
    assigned_to: Optional[str] = None
    due_date: Optional[str] = None
    estimated_hours: float = 0
    service_type: Optional[str] = None

class TaskUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    status: Optional[str] = None
    priority: Optional[str] = None
    assigned_to: Optional[str] = None
    due_date: Optional[str] = None
    actual_hours: Optional[float] = None

class TaskResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    project_id: str
    title: str
    description: Optional[str] = None
    status: str
    priority: str
    assigned_to: Optional[str] = None
    due_date: Optional[str] = None
    estimated_hours: float
    actual_hours: float = 0
    service_type: Optional[str] = None
    created_by: str
    created_at: str

# Vault Models
class VaultFolderCreate(BaseModel):
    name: str
    folder_type: str  # client, internal, project, personal
    project_id: Optional[str] = None
    description: Optional[str] = None

class VaultFolderResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    name: str
    folder_type: str
    project_id: Optional[str] = None
    description: Optional[str] = None
    created_by: str
    created_at: str

class VaultCredentialCreate(BaseModel):
    folder_id: str
    name: str
    username: Optional[str] = None
    password: str
    url: Optional[str] = None
    notes: Optional[str] = None
    expiry_date: Optional[str] = None

class VaultCredentialResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    folder_id: str
    name: str
    username: Optional[str] = None
    url: Optional[str] = None
    notes: Optional[str] = None
    expiry_date: Optional[str] = None
    created_by: str
    created_at: str
    # Password is masked, never returned directly

class VaultCredentialReveal(BaseModel):
    password: str

class VaultAccessRequestCreate(BaseModel):
    credential_id: str
    reason: str

class VaultAccessRequestResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    credential_id: str
    requested_by: str
    reason: str
    status: str  # pending, approved, denied
    resolved_by: Optional[str] = None
    resolved_at: Optional[str] = None
    created_at: str

# Notification Models
class NotificationResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    user_id: str
    title: str
    message: str
    type: str  # hrm, pms, vault, issue, automation, calendar
    source_type: Optional[str] = None
    source_id: Optional[str] = None
    is_read: bool = False
    created_at: str

# Issue Models
class IssueCreate(BaseModel):
    title: str
    description: str
    issue_type: str
    priority: str = "medium"
    project_id: Optional[str] = None
    assigned_to: Optional[str] = None
    due_date: Optional[str] = None
    tags: List[str] = []

class IssueResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    title: str
    description: str
    issue_type: str
    priority: str
    status: str
    project_id: Optional[str] = None
    reported_by: str
    assigned_to: Optional[str] = None
    due_date: Optional[str] = None
    tags: List[str]
    resolution_note: Optional[str] = None
    created_at: str

class IssueCommentCreate(BaseModel):
    content: str

class IssueCommentResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    issue_id: str
    user_id: str
    content: str
    created_at: str

# Automation Models
class AutomationRuleCreate(BaseModel):
    name: str
    description: Optional[str] = None
    trigger_type: str
    trigger_config: Dict[str, Any] = {}
    conditions: List[Dict[str, Any]] = []
    actions: List[Dict[str, Any]] = []
    is_active: bool = True

class AutomationRuleResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    name: str
    description: Optional[str] = None
    trigger_type: str
    trigger_config: Dict[str, Any]
    conditions: List[Dict[str, Any]]
    actions: List[Dict[str, Any]]
    is_active: bool
    created_by: str
    created_at: str

# Calendar Models
class CalendarEventCreate(BaseModel):
    title: str
    description: Optional[str] = None
    start_at: str
    end_at: Optional[str] = None
    all_day: bool = False
    location: Optional[str] = None
    is_private: bool = False
    event_type: str = "personal"  # personal, meeting, task, leave, milestone, holiday
    participants: List[str] = []
    recurrence_rule: Optional[Dict[str, Any]] = None
    reminder_minutes: List[int] = []

class CalendarEventResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    title: str
    description: Optional[str] = None
    start_at: str
    end_at: Optional[str] = None
    all_day: bool
    location: Optional[str] = None
    is_private: bool
    event_type: str
    source_type: Optional[str] = None
    source_id: Optional[str] = None
    creator_id: str
    participants: List[str]
    created_at: str

# ==================== UTILITY FUNCTIONS ====================
def encrypt_password(password: str) -> tuple:
    """Encrypt password using AES-256-GCM"""
    key = bytes.fromhex(VAULT_MASTER_KEY)
    iv = get_random_bytes(12)
    cipher = AES.new(key, AES.MODE_GCM, nonce=iv)
    ciphertext, tag = cipher.encrypt_and_digest(password.encode())
    encrypted = base64.b64encode(ciphertext + tag).decode()
    iv_encoded = base64.b64encode(iv).decode()
    return encrypted, iv_encoded

def decrypt_password(encrypted: str, iv_encoded: str) -> str:
    """Decrypt password using AES-256-GCM"""
    key = bytes.fromhex(VAULT_MASTER_KEY)
    iv = base64.b64decode(iv_encoded)
    data = base64.b64decode(encrypted)
    ciphertext, tag = data[:-16], data[-16:]
    cipher = AES.new(key, AES.MODE_GCM, nonce=iv)
    return cipher.decrypt_and_verify(ciphertext, tag).decode()

def hash_password(password: str) -> str:
    """Hash password using bcrypt"""
    return bcrypt.hashpw(password.encode(), bcrypt.gensalt(12)).decode()

def verify_password(password: str, hashed: str) -> bool:
    """Verify password against bcrypt hash"""
    return bcrypt.checkpw(password.encode(), hashed.encode())

def create_access_token(user_id: str, role: str, role_level: int) -> str:
    """Create JWT access token"""
    payload = {
        "sub": user_id,
        "role": role,
        "role_level": role_level,
        "exp": datetime.now(timezone.utc) + timedelta(hours=ACCESS_TOKEN_EXPIRE_HOURS),
        "type": "access"
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

def create_refresh_token(user_id: str) -> str:
    """Create JWT refresh token"""
    payload = {
        "sub": user_id,
        "exp": datetime.now(timezone.utc) + timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS),
        "type": "refresh"
    }
    return jwt.encode(payload, JWT_REFRESH_SECRET, algorithm=JWT_ALGORITHM)

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> dict:
    """Verify JWT and return current user"""
    try:
        payload = jwt.decode(credentials.credentials, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        if payload.get("type") != "access":
            raise HTTPException(status_code=401, detail="Invalid token type")
        user = await db.users.find_one({"id": payload["sub"]}, {"_id": 0})
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        if not user.get("is_active", True):
            raise HTTPException(status_code=401, detail="User account is disabled")
        return user
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token has expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

def require_role(min_level: int):
    """Decorator to require minimum role level"""
    async def dependency(current_user: dict = Depends(get_current_user)):
        if current_user.get("role_level", 1) < min_level:
            raise HTTPException(status_code=403, detail="Insufficient permissions")
        return current_user
    return dependency

async def generate_employee_code() -> str:
    """Generate unique employee code: PF-YYYY-###"""
    year = datetime.now().year
    count = await db.employees.count_documents({"employee_code": {"$regex": f"^PF-{year}-"}})
    return f"PF-{year}-{str(count + 1).zfill(3)}"

async def create_notification(user_id: str, title: str, message: str, notif_type: str, source_type: str = None, source_id: str = None):
    """Create a notification for a user"""
    notification = {
        "id": str(uuid.uuid4()),
        "user_id": user_id,
        "title": title,
        "message": message,
        "type": notif_type,
        "source_type": source_type,
        "source_id": source_id,
        "is_read": False,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.notifications.insert_one(notification)
    return notification

# ==================== AUTH ROUTES ====================
@auth_router.post("/register", response_model=UserResponse)
async def register(user: UserCreate):
    """Register a new user (Super Admin only in production)"""
    existing = await db.users.find_one({"$or": [{"username": user.username}, {"email": user.email}]})
    if existing:
        raise HTTPException(status_code=400, detail="Username or email already exists")
    
    user_doc = {
        "id": str(uuid.uuid4()),
        "username": user.username,
        "email": user.email,
        "password_hash": hash_password(user.password),
        "role": user.role,
        "role_level": ROLE_LEVELS.get(user.role, 1),
        "first_name": user.first_name,
        "last_name": user.last_name,
        "department_id": user.department_id,
        "is_active": True,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.users.insert_one(user_doc)
    del user_doc["password_hash"]
    return user_doc

@auth_router.post("/login", response_model=TokenResponse)
async def login(credentials: UserLogin):
    """Login and get JWT tokens"""
    user = await db.users.find_one({"username": credentials.username}, {"_id": 0})
    if not user or not verify_password(credentials.password, user.get("password_hash", "")):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    if not user.get("is_active", True):
        raise HTTPException(status_code=401, detail="Account is disabled")
    
    access_token = create_access_token(user["id"], user["role"], user["role_level"])
    refresh_token = create_refresh_token(user["id"])
    
    # Store refresh token
    await db.refresh_tokens.insert_one({
        "token": refresh_token,
        "user_id": user["id"],
        "created_at": datetime.now(timezone.utc).isoformat()
    })
    
    user_response = {k: v for k, v in user.items() if k != "password_hash"}
    return TokenResponse(access_token=access_token, refresh_token=refresh_token, user=UserResponse(**user_response))

@auth_router.post("/refresh", response_model=TokenResponse)
async def refresh_token(request: RefreshTokenRequest):
    """Refresh access token"""
    try:
        payload = jwt.decode(request.refresh_token, JWT_REFRESH_SECRET, algorithms=[JWT_ALGORITHM])
        if payload.get("type") != "refresh":
            raise HTTPException(status_code=401, detail="Invalid token type")
        
        # Verify token exists in DB
        stored = await db.refresh_tokens.find_one({"token": request.refresh_token})
        if not stored:
            raise HTTPException(status_code=401, detail="Token has been revoked")
        
        user = await db.users.find_one({"id": payload["sub"]}, {"_id": 0})
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        
        access_token = create_access_token(user["id"], user["role"], user["role_level"])
        new_refresh_token = create_refresh_token(user["id"])
        
        # Rotate refresh token
        await db.refresh_tokens.delete_one({"token": request.refresh_token})
        await db.refresh_tokens.insert_one({
            "token": new_refresh_token,
            "user_id": user["id"],
            "created_at": datetime.now(timezone.utc).isoformat()
        })
        
        user_response = {k: v for k, v in user.items() if k != "password_hash"}
        return TokenResponse(access_token=access_token, refresh_token=new_refresh_token, user=UserResponse(**user_response))
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Refresh token has expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid refresh token")

@auth_router.post("/logout")
async def logout(current_user: dict = Depends(get_current_user)):
    """Logout and invalidate refresh tokens"""
    await db.refresh_tokens.delete_many({"user_id": current_user["id"]})
    return {"message": "Logged out successfully"}

@auth_router.get("/me", response_model=UserResponse)
async def get_me(current_user: dict = Depends(get_current_user)):
    """Get current user profile"""
    return current_user

# ==================== HRM ROUTES ====================
# Departments
@hrm_router.post("/departments", response_model=DepartmentResponse)
async def create_department(dept: DepartmentCreate, current_user: dict = Depends(require_role(4))):
    """Create a department (HR Manager+)"""
    dept_doc = {
        "id": str(uuid.uuid4()),
        "name": dept.name,
        "description": dept.description,
        "head_id": dept.head_id,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.departments.insert_one(dept_doc)
    return dept_doc

@hrm_router.get("/departments", response_model=List[DepartmentResponse])
async def list_departments(current_user: dict = Depends(get_current_user)):
    """List all departments"""
    departments = await db.departments.find({}, {"_id": 0}).to_list(100)
    return departments

# Employees
@hrm_router.post("/employees", response_model=EmployeeResponse)
async def create_employee(emp: EmployeeCreate, current_user: dict = Depends(require_role(4))):
    """Create an employee record (HR Manager+)"""
    employee_code = emp.employee_code or await generate_employee_code()
    emp_doc = {
        "id": str(uuid.uuid4()),
        "user_id": emp.user_id,
        "employee_code": employee_code,
        "phone": emp.phone,
        "address": emp.address,
        "date_of_birth": emp.date_of_birth,
        "date_of_joining": emp.date_of_joining,
        "designation": emp.designation,
        "department_id": emp.department_id,
        "reporting_manager_id": emp.reporting_manager_id,
        "employment_type": emp.employment_type,
        "status": emp.status,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.employees.insert_one(emp_doc)
    
    # Initialize leave balances
    year = datetime.now().year
    leave_balances = {
        "employee_id": emp_doc["id"],
        "year": year,
        "balances": {lt: 12.0 if lt in ["casual", "sick", "earned"] else 0.0 for lt in LEAVE_TYPES}
    }
    await db.leave_balances.insert_one(leave_balances)
    
    # Create personal vault folder
    vault_folder = {
        "id": str(uuid.uuid4()),
        "name": f"Personal - {employee_code}",
        "folder_type": "personal",
        "project_id": None,
        "description": "Personal credentials folder",
        "owner_id": emp.user_id,
        "created_by": current_user["id"],
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.vault_folders.insert_one(vault_folder)
    
    # Create notification
    await create_notification(emp.user_id, "Welcome to Profitcast!", "Your employee profile has been created.", "hrm", "employee", emp_doc["id"])
    
    return emp_doc

@hrm_router.get("/employees", response_model=List[EmployeeResponse])
async def list_employees(
    department_id: Optional[str] = None,
    status: Optional[str] = None,
    current_user: dict = Depends(require_role(2))
):
    """List employees (Team Lead+ can see team, HR+ can see all)"""
    query = {"deleted_at": {"$exists": False}}
    if department_id:
        query["department_id"] = department_id
    if status:
        query["status"] = status
    
    employees = await db.employees.find(query, {"_id": 0}).to_list(1000)
    return employees

@hrm_router.get("/employees/{employee_id}", response_model=EmployeeResponse)
async def get_employee(employee_id: str, current_user: dict = Depends(get_current_user)):
    """Get employee details"""
    employee = await db.employees.find_one({"id": employee_id, "deleted_at": {"$exists": False}}, {"_id": 0})
    if not employee:
        raise HTTPException(status_code=404, detail="Employee not found")
    return employee

@hrm_router.put("/employees/{employee_id}", response_model=EmployeeResponse)
async def update_employee(employee_id: str, emp: EmployeeCreate, current_user: dict = Depends(require_role(4))):
    """Update employee (HR Manager+)"""
    result = await db.employees.find_one_and_update(
        {"id": employee_id, "deleted_at": {"$exists": False}},
        {"$set": {
            "phone": emp.phone,
            "address": emp.address,
            "date_of_birth": emp.date_of_birth,
            "designation": emp.designation,
            "department_id": emp.department_id,
            "reporting_manager_id": emp.reporting_manager_id,
            "employment_type": emp.employment_type,
            "status": emp.status,
            "updated_at": datetime.now(timezone.utc).isoformat()
        }},
        return_document=True,
        projection={"_id": 0}
    )
    if not result:
        raise HTTPException(status_code=404, detail="Employee not found")
    return result

@hrm_router.post("/employees/{employee_id}/offboard")
async def offboard_employee(employee_id: str, current_user: dict = Depends(require_role(4))):
    """Offboard an employee - revoke vault access, reassign tasks (HR Manager+)"""
    employee = await db.employees.find_one({"id": employee_id}, {"_id": 0})
    if not employee:
        raise HTTPException(status_code=404, detail="Employee not found")
    
    # Soft delete employee
    await db.employees.update_one(
        {"id": employee_id},
        {"$set": {"status": "terminated", "deleted_at": datetime.now(timezone.utc).isoformat()}}
    )
    
    # Deactivate user
    await db.users.update_one({"id": employee["user_id"]}, {"$set": {"is_active": False}})
    
    # Revoke all vault access
    await db.vault_access.delete_many({"user_id": employee["user_id"]})
    
    # Log vault audit
    await db.vault_audit_logs.insert_one({
        "id": str(uuid.uuid4()),
        "user_id": current_user["id"],
        "action": "bulk_revoke",
        "target_user_id": employee["user_id"],
        "details": "Employee offboarded - all vault access revoked",
        "created_at": datetime.now(timezone.utc).isoformat()
    })
    
    # Reassign open tasks
    await db.tasks.update_many(
        {"assigned_to": employee["user_id"], "status": {"$ne": "completed"}},
        {"$set": {"assigned_to": None, "updated_at": datetime.now(timezone.utc).isoformat()}}
    )
    
    return {"message": "Employee offboarded successfully"}

# Attendance
@hrm_router.post("/attendance/checkin", response_model=AttendanceResponse)
async def check_in(checkin: AttendanceCheckIn, current_user: dict = Depends(get_current_user)):
    """Check in for attendance"""
    employee = await db.employees.find_one({"user_id": current_user["id"]}, {"_id": 0})
    if not employee:
        raise HTTPException(status_code=404, detail="Employee record not found")
    
    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    now = datetime.now(timezone.utc)
    
    # Check if late (after 09:15)
    is_late = now.hour > 9 or (now.hour == 9 and now.minute > 15)
    
    attendance = await db.attendance.find_one({"employee_id": employee["id"], "date": today}, {"_id": 0})
    
    entry = {"check_in": now.isoformat(), "check_out": None, "note": checkin.note}
    
    if attendance:
        # Add new entry
        await db.attendance.update_one(
            {"id": attendance["id"]},
            {"$push": {"entries": entry}}
        )
        attendance["entries"].append(entry)
    else:
        # Create new attendance record
        attendance = {
            "id": str(uuid.uuid4()),
            "employee_id": employee["id"],
            "date": today,
            "entries": [entry],
            "is_late": is_late,
            "has_overtime": False,
            "total_hours": 0,
            "created_at": now.isoformat()
        }
        await db.attendance.insert_one(attendance)
    
    return attendance

@hrm_router.post("/attendance/checkout", response_model=AttendanceResponse)
async def check_out(checkout: AttendanceCheckOut, current_user: dict = Depends(get_current_user)):
    """Check out for attendance"""
    employee = await db.employees.find_one({"user_id": current_user["id"]}, {"_id": 0})
    if not employee:
        raise HTTPException(status_code=404, detail="Employee record not found")
    
    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    now = datetime.now(timezone.utc)
    
    attendance = await db.attendance.find_one({"employee_id": employee["id"], "date": today}, {"_id": 0})
    if not attendance:
        raise HTTPException(status_code=400, detail="No check-in found for today")
    
    entries = attendance["entries"]
    if not entries or entries[-1].get("check_out"):
        raise HTTPException(status_code=400, detail="No open check-in to close")
    
    entries[-1]["check_out"] = now.isoformat()
    entries[-1]["note"] = checkout.note or entries[-1].get("note")
    
    # Calculate total hours
    total_hours = 0
    for entry in entries:
        if entry.get("check_in") and entry.get("check_out"):
            ci = datetime.fromisoformat(entry["check_in"])
            co = datetime.fromisoformat(entry["check_out"])
            total_hours += (co - ci).total_seconds() / 3600
    
    # Check overtime (after 18:45)
    has_overtime = now.hour > 18 or (now.hour == 18 and now.minute > 45)
    
    await db.attendance.update_one(
        {"id": attendance["id"]},
        {"$set": {"entries": entries, "total_hours": round(total_hours, 2), "has_overtime": has_overtime}}
    )
    
    attendance["entries"] = entries
    attendance["total_hours"] = round(total_hours, 2)
    attendance["has_overtime"] = has_overtime
    return attendance

@hrm_router.get("/attendance/my", response_model=List[AttendanceResponse])
async def get_my_attendance(
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    """Get my attendance records"""
    employee = await db.employees.find_one({"user_id": current_user["id"]}, {"_id": 0})
    if not employee:
        raise HTTPException(status_code=404, detail="Employee record not found")
    
    query = {"employee_id": employee["id"]}
    if start_date:
        query["date"] = {"$gte": start_date}
    if end_date:
        if "date" in query:
            query["date"]["$lte"] = end_date
        else:
            query["date"] = {"$lte": end_date}
    
    attendance = await db.attendance.find(query, {"_id": 0}).sort("date", -1).to_list(100)
    return attendance

@hrm_router.get("/attendance/team", response_model=List[AttendanceResponse])
async def get_team_attendance(
    date: Optional[str] = None,
    current_user: dict = Depends(require_role(2))
):
    """Get team attendance (Team Lead+)"""
    query = {}
    if date:
        query["date"] = date
    else:
        query["date"] = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    
    attendance = await db.attendance.find(query, {"_id": 0}).to_list(1000)
    return attendance

# Leave Management
@hrm_router.get("/leaves/balance", response_model=LeaveBalanceResponse)
async def get_leave_balance(current_user: dict = Depends(get_current_user)):
    """Get my leave balance"""
    employee = await db.employees.find_one({"user_id": current_user["id"]}, {"_id": 0})
    if not employee:
        raise HTTPException(status_code=404, detail="Employee record not found")
    
    year = datetime.now().year
    balance = await db.leave_balances.find_one({"employee_id": employee["id"], "year": year}, {"_id": 0})
    if not balance:
        # Initialize balances
        balance = {
            "employee_id": employee["id"],
            "year": year,
            "balances": {lt: 12.0 if lt in ["casual", "sick", "earned"] else 0.0 for lt in LEAVE_TYPES}
        }
        await db.leave_balances.insert_one(balance)
    return balance

@hrm_router.post("/leaves", response_model=LeaveResponse)
async def create_leave_request(leave: LeaveCreate, current_user: dict = Depends(get_current_user)):
    """Create a leave request"""
    employee = await db.employees.find_one({"user_id": current_user["id"]}, {"_id": 0})
    if not employee:
        raise HTTPException(status_code=404, detail="Employee record not found")
    
    leave_doc = {
        "id": str(uuid.uuid4()),
        "employee_id": employee["id"],
        "leave_type": leave.leave_type,
        "start_date": leave.start_date,
        "end_date": leave.end_date,
        "reason": leave.reason,
        "half_day": leave.half_day,
        "status": "pending",
        "approved_by": None,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.leaves.insert_one(leave_doc)
    
    # Notify manager
    if employee.get("reporting_manager_id"):
        manager = await db.employees.find_one({"id": employee["reporting_manager_id"]}, {"_id": 0})
        if manager:
            await create_notification(
                manager["user_id"],
                "Leave Request",
                f"New leave request from {current_user['first_name']} {current_user['last_name']}",
                "hrm", "leave", leave_doc["id"]
            )
    
    return leave_doc

@hrm_router.get("/leaves/my", response_model=List[LeaveResponse])
async def get_my_leaves(current_user: dict = Depends(get_current_user)):
    """Get my leave requests"""
    employee = await db.employees.find_one({"user_id": current_user["id"]}, {"_id": 0})
    if not employee:
        raise HTTPException(status_code=404, detail="Employee record not found")
    
    leaves = await db.leaves.find({"employee_id": employee["id"]}, {"_id": 0}).sort("created_at", -1).to_list(100)
    return leaves

@hrm_router.get("/leaves", response_model=List[LeaveResponse])
async def list_leaves(
    status: Optional[str] = None,
    current_user: dict = Depends(require_role(2))
):
    """List leave requests (Team Lead+ for team, HR+ for all)"""
    query = {}
    if status:
        query["status"] = status
    
    leaves = await db.leaves.find(query, {"_id": 0}).sort("created_at", -1).to_list(1000)
    return leaves

@hrm_router.put("/leaves/{leave_id}/approve")
async def approve_leave(leave_id: str, current_user: dict = Depends(require_role(2))):
    """Approve a leave request (Team Lead+)"""
    leave = await db.leaves.find_one({"id": leave_id}, {"_id": 0})
    if not leave:
        raise HTTPException(status_code=404, detail="Leave request not found")
    
    if leave["status"] != "pending":
        raise HTTPException(status_code=400, detail="Leave is not pending")
    
    # Calculate days
    start = datetime.strptime(leave["start_date"], "%Y-%m-%d")
    end = datetime.strptime(leave["end_date"], "%Y-%m-%d")
    days = (end - start).days + 1
    if leave["half_day"]:
        days = 0.5
    
    # Deduct from balance
    year = datetime.now().year
    await db.leave_balances.update_one(
        {"employee_id": leave["employee_id"], "year": year},
        {"$inc": {f"balances.{leave['leave_type']}": -days}}
    )
    
    await db.leaves.update_one(
        {"id": leave_id},
        {"$set": {"status": "approved", "approved_by": current_user["id"], "updated_at": datetime.now(timezone.utc).isoformat()}}
    )
    
    # Notify employee
    employee = await db.employees.find_one({"id": leave["employee_id"]}, {"_id": 0})
    if employee:
        await create_notification(employee["user_id"], "Leave Approved", "Your leave request has been approved.", "hrm", "leave", leave_id)
    
    return {"message": "Leave approved"}

@hrm_router.put("/leaves/{leave_id}/reject")
async def reject_leave(leave_id: str, current_user: dict = Depends(require_role(2))):
    """Reject a leave request (Team Lead+)"""
    leave = await db.leaves.find_one({"id": leave_id}, {"_id": 0})
    if not leave:
        raise HTTPException(status_code=404, detail="Leave request not found")
    
    await db.leaves.update_one(
        {"id": leave_id},
        {"$set": {"status": "rejected", "approved_by": current_user["id"], "updated_at": datetime.now(timezone.utc).isoformat()}}
    )
    
    # Notify employee
    employee = await db.employees.find_one({"id": leave["employee_id"]}, {"_id": 0})
    if employee:
        await create_notification(employee["user_id"], "Leave Rejected", "Your leave request has been rejected.", "hrm", "leave", leave_id)
    
    return {"message": "Leave rejected"}

@hrm_router.put("/leaves/{leave_id}/cancel")
async def cancel_leave(leave_id: str, current_user: dict = Depends(get_current_user)):
    """Cancel my leave request"""
    employee = await db.employees.find_one({"user_id": current_user["id"]}, {"_id": 0})
    if not employee:
        raise HTTPException(status_code=404, detail="Employee record not found")
    
    leave = await db.leaves.find_one({"id": leave_id, "employee_id": employee["id"]}, {"_id": 0})
    if not leave:
        raise HTTPException(status_code=404, detail="Leave request not found")
    
    if leave["status"] not in ["pending", "approved"]:
        raise HTTPException(status_code=400, detail="Cannot cancel this leave")
    
    # Restore balance if was approved
    if leave["status"] == "approved":
        start = datetime.strptime(leave["start_date"], "%Y-%m-%d")
        end = datetime.strptime(leave["end_date"], "%Y-%m-%d")
        days = (end - start).days + 1
        if leave["half_day"]:
            days = 0.5
        
        year = datetime.now().year
        await db.leave_balances.update_one(
            {"employee_id": leave["employee_id"], "year": year},
            {"$inc": {f"balances.{leave['leave_type']}": days}}
        )
    
    await db.leaves.update_one({"id": leave_id}, {"$set": {"status": "cancelled", "updated_at": datetime.now(timezone.utc).isoformat()}})
    return {"message": "Leave cancelled"}

# Escalations
@hrm_router.post("/escalations", response_model=EscalationResponse)
async def create_escalation(esc: EscalationCreate, current_user: dict = Depends(get_current_user)):
    """Create an escalation"""
    employee = await db.employees.find_one({"user_id": current_user["id"]}, {"_id": 0})
    if not employee:
        raise HTTPException(status_code=404, detail="Employee record not found")
    
    esc_doc = {
        "id": str(uuid.uuid4()),
        "employee_id": employee["id"],
        "title": esc.title,
        "description": esc.description,
        "priority": esc.priority,
        "status": "open",
        "category": esc.category,
        "assigned_to": employee.get("reporting_manager_id"),
        "resolved_at": None,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.escalations.insert_one(esc_doc)
    
    # Notify manager
    if employee.get("reporting_manager_id"):
        manager = await db.employees.find_one({"id": employee["reporting_manager_id"]}, {"_id": 0})
        if manager:
            await create_notification(manager["user_id"], "New Escalation", f"Escalation: {esc.title}", "hrm", "escalation", esc_doc["id"])
    
    return esc_doc

@hrm_router.get("/escalations/my", response_model=List[EscalationResponse])
async def get_my_escalations(current_user: dict = Depends(get_current_user)):
    """Get my escalations"""
    employee = await db.employees.find_one({"user_id": current_user["id"]}, {"_id": 0})
    if not employee:
        return []
    
    escalations = await db.escalations.find({"employee_id": employee["id"]}, {"_id": 0}).sort("created_at", -1).to_list(100)
    return escalations

@hrm_router.get("/escalations/assigned", response_model=List[EscalationResponse])
async def get_assigned_escalations(current_user: dict = Depends(require_role(2))):
    """Get escalations assigned to me (Team Lead+)"""
    employee = await db.employees.find_one({"user_id": current_user["id"]}, {"_id": 0})
    if not employee:
        return []
    
    escalations = await db.escalations.find({"assigned_to": employee["id"]}, {"_id": 0}).sort("created_at", -1).to_list(100)
    return escalations

@hrm_router.get("/escalations", response_model=List[EscalationResponse])
async def list_escalations(current_user: dict = Depends(require_role(4))):
    """List all escalations (HR Manager+)"""
    escalations = await db.escalations.find({}, {"_id": 0}).sort("created_at", -1).to_list(1000)
    return escalations

@hrm_router.put("/escalations/{escalation_id}/status")
async def update_escalation_status(escalation_id: str, status: str, current_user: dict = Depends(require_role(2))):
    """Update escalation status (Team Lead+)"""
    if status not in ESCALATION_STATUS:
        raise HTTPException(status_code=400, detail="Invalid status")
    
    update_data = {"status": status, "updated_at": datetime.now(timezone.utc).isoformat()}
    if status in ["resolved", "closed"]:
        update_data["resolved_at"] = datetime.now(timezone.utc).isoformat()
    
    result = await db.escalations.find_one_and_update(
        {"id": escalation_id},
        {"$set": update_data},
        return_document=True,
        projection={"_id": 0}
    )
    if not result:
        raise HTTPException(status_code=404, detail="Escalation not found")
    
    # Notify employee
    employee = await db.employees.find_one({"id": result["employee_id"]}, {"_id": 0})
    if employee:
        await create_notification(employee["user_id"], "Escalation Updated", f"Your escalation status changed to {status}", "hrm", "escalation", escalation_id)
    
    return result

# ==================== PMS ROUTES ====================
# Service Templates
SERVICE_TEMPLATES = {
    "gmb": {"name": "Google My Business", "tasks": ["Claim GMB", "Optimize profile", "Add photos", "Setup posts", "Monitor reviews", "Add products/services", "Setup messaging", "Create FAQ", "Add attributes", "Setup booking", "Weekly update"]},
    "meta_ads": {"name": "Meta Ads", "tasks": ["Account setup", "Pixel installation", "Audience creation", "Campaign structure", "Ad creative", "A/B testing", "Budget optimization", "Conversion tracking", "Retargeting setup", "Lookalike audiences", "Daily monitoring", "Weekly reporting", "Monthly review", "Creative refresh", "Performance analysis"]},
    "google_ads": {"name": "Google Ads", "tasks": ["Account setup", "Keyword research", "Campaign structure", "Ad copy creation", "Extension setup", "Conversion tracking", "Weekly optimization"]},
    "seo": {"name": "SEO", "tasks": ["Site audit", "Keyword research", "On-page optimization", "Technical SEO", "Content strategy", "Link building", "Local SEO", "Monthly reporting", "Competitor analysis"]},
    "amazon_ads": {"name": "Amazon Ads", "tasks": ["Account setup", "Product targeting", "Keyword targeting", "Campaign structure", "Bid optimization", "A+ content", "Monthly review"]},
    "amazon_seo": {"name": "Amazon SEO", "tasks": ["Listing audit", "Keyword research", "Title optimization", "Bullet points", "Description", "Backend keywords", "Image optimization"]},
    "linkedin_ads": {"name": "LinkedIn Ads", "tasks": ["Account setup", "Audience targeting", "Campaign creation", "Ad creative", "Lead gen forms", "Conversion tracking", "Weekly optimization"]},
    "graphic_design": {"name": "Graphic Design", "tasks": ["Brand guidelines", "Social templates", "Ad creatives", "Presentation", "Infographics", "Video thumbnails", "Email templates"]},
    "smm": {"name": "Social Media Management", "tasks": ["Content calendar", "Content creation", "Scheduling", "Community management", "Engagement", "Analytics", "Monthly reporting"]},
    "web_development": {"name": "Web Development", "tasks": ["Requirements", "Wireframes", "Design mockup", "Development", "Testing", "Launch", "Training", "Maintenance"]},
    "email_marketing": {"name": "Email Marketing", "tasks": ["List setup", "Template design", "Automation flows", "Campaign creation", "A/B testing", "Monthly reporting"]},
    "whatsapp_marketing": {"name": "WhatsApp Marketing", "tasks": ["Business setup", "Template approval", "Contact import", "Campaign creation", "Automation", "Analytics"]},
    "video_marketing": {"name": "Video Marketing", "tasks": ["Script writing", "Storyboard", "Production", "Editing", "Thumbnails", "Distribution", "Analytics"]},
    "personal_branding": {"name": "Personal Branding", "tasks": ["Profile audit", "Content strategy", "LinkedIn optimization", "Content creation", "Engagement strategy", "Network building", "Monthly review"]},
    "influencer_outreach": {"name": "Influencer Outreach", "tasks": ["Research", "Outreach", "Negotiation", "Campaign brief", "Content approval", "Performance tracking"]},
    "personal_assistance": {"name": "Personal Assistance", "tasks": ["Calendar management", "Email management", "Research", "Documentation", "Coordination", "Reporting"]}
}

@pms_router.get("/services")
async def list_services():
    """List available service templates"""
    return SERVICE_TEMPLATES

@pms_router.post("/projects", response_model=ProjectResponse)
async def create_project(project: ProjectCreate, current_user: dict = Depends(require_role(3))):
    """Create a project with auto-generated tasks (Manager+)"""
    project_doc = {
        "id": str(uuid.uuid4()),
        "name": project.name,
        "client_name": project.client_name,
        "description": project.description,
        "budget": project.budget,
        "start_date": project.start_date,
        "end_date": project.end_date,
        "status": "onboarding",
        "services": project.services,
        "team_members": project.team_members,
        "tags": project.tags,
        "progress": 0,
        "created_by": current_user["id"],
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.projects.insert_one(project_doc)
    
    # Auto-generate tasks for selected services
    for service_key in project.services:
        if service_key in SERVICE_TEMPLATES:
            template = SERVICE_TEMPLATES[service_key]
            for task_name in template["tasks"]:
                task = {
                    "id": str(uuid.uuid4()),
                    "project_id": project_doc["id"],
                    "title": task_name,
                    "description": f"Auto-generated task for {template['name']}",
                    "status": "todo",
                    "priority": "medium",
                    "assigned_to": None,
                    "due_date": None,
                    "estimated_hours": 2,
                    "actual_hours": 0,
                    "service_type": service_key,
                    "created_by": current_user["id"],
                    "created_at": datetime.now(timezone.utc).isoformat()
                }
                await db.tasks.insert_one(task)
    
    # Create project vault folder
    vault_folder = {
        "id": str(uuid.uuid4()),
        "name": f"Project - {project.name}",
        "folder_type": "project",
        "project_id": project_doc["id"],
        "description": f"Credentials for {project.client_name}",
        "created_by": current_user["id"],
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.vault_folders.insert_one(vault_folder)
    
    # Grant vault access to team members
    for member_id in project.team_members:
        access = {
            "id": str(uuid.uuid4()),
            "user_id": member_id,
            "folder_id": vault_folder["id"],
            "granted_by": current_user["id"],
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        await db.vault_access.insert_one(access)
        
        # Notify team member
        await create_notification(member_id, "Added to Project", f"You've been added to project: {project.name}", "pms", "project", project_doc["id"])
    
    return project_doc

@pms_router.get("/projects", response_model=List[ProjectResponse])
async def list_projects(
    status: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    """List projects (Employee sees assigned, Manager+ sees all)"""
    query = {}
    if status:
        query["status"] = status
    
    if current_user["role_level"] < 3:
        query["team_members"] = current_user["id"]
    
    projects = await db.projects.find(query, {"_id": 0}).sort("created_at", -1).to_list(100)
    
    # Calculate progress for each project
    for project in projects:
        total_tasks = await db.tasks.count_documents({"project_id": project["id"]})
        completed_tasks = await db.tasks.count_documents({"project_id": project["id"], "status": "completed"})
        project["progress"] = round((completed_tasks / total_tasks * 100) if total_tasks > 0 else 0, 1)
    
    return projects

@pms_router.get("/projects/{project_id}", response_model=ProjectResponse)
async def get_project(project_id: str, current_user: dict = Depends(get_current_user)):
    """Get project details"""
    project = await db.projects.find_one({"id": project_id}, {"_id": 0})
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    # Check access
    if current_user["role_level"] < 3 and current_user["id"] not in project.get("team_members", []):
        raise HTTPException(status_code=403, detail="Access denied")
    
    # Calculate progress
    total_tasks = await db.tasks.count_documents({"project_id": project_id})
    completed_tasks = await db.tasks.count_documents({"project_id": project_id, "status": "completed"})
    project["progress"] = round((completed_tasks / total_tasks * 100) if total_tasks > 0 else 0, 1)
    
    return project

@pms_router.put("/projects/{project_id}", response_model=ProjectResponse)
async def update_project(project_id: str, project: ProjectCreate, current_user: dict = Depends(require_role(3))):
    """Update a project (Manager+)"""
    existing = await db.projects.find_one({"id": project_id}, {"_id": 0})
    if not existing:
        raise HTTPException(status_code=404, detail="Project not found")
    
    # Check for new team members
    new_members = set(project.team_members) - set(existing.get("team_members", []))
    removed_members = set(existing.get("team_members", [])) - set(project.team_members)
    
    result = await db.projects.find_one_and_update(
        {"id": project_id},
        {"$set": {
            "name": project.name,
            "client_name": project.client_name,
            "description": project.description,
            "budget": project.budget,
            "start_date": project.start_date,
            "end_date": project.end_date,
            "services": project.services,
            "team_members": project.team_members,
            "tags": project.tags,
            "updated_at": datetime.now(timezone.utc).isoformat()
        }},
        return_document=True,
        projection={"_id": 0}
    )
    
    # Handle vault access for new/removed members
    vault_folder = await db.vault_folders.find_one({"project_id": project_id}, {"_id": 0})
    if vault_folder:
        for member_id in new_members:
            access = {
                "id": str(uuid.uuid4()),
                "user_id": member_id,
                "folder_id": vault_folder["id"],
                "granted_by": current_user["id"],
                "created_at": datetime.now(timezone.utc).isoformat()
            }
            await db.vault_access.insert_one(access)
            await create_notification(member_id, "Added to Project", f"You've been added to project: {project.name}", "pms", "project", project_id)
        
        for member_id in removed_members:
            await db.vault_access.delete_many({"user_id": member_id, "folder_id": vault_folder["id"]})
            await create_notification(member_id, "Removed from Project", f"You've been removed from project: {project.name}", "pms", "project", project_id)
    
    return result

@pms_router.put("/projects/{project_id}/status")
async def update_project_status(project_id: str, status: str, current_user: dict = Depends(require_role(3))):
    """Update project status (Manager+)"""
    if status not in PROJECT_STATUS:
        raise HTTPException(status_code=400, detail="Invalid status")
    
    result = await db.projects.find_one_and_update(
        {"id": project_id},
        {"$set": {"status": status, "updated_at": datetime.now(timezone.utc).isoformat()}},
        return_document=True,
        projection={"_id": 0}
    )
    if not result:
        raise HTTPException(status_code=404, detail="Project not found")
    
    # Notify team members
    for member_id in result.get("team_members", []):
        await create_notification(member_id, "Project Status Changed", f"Project '{result['name']}' status changed to {status}", "pms", "project", project_id)
    
    return result

# Tasks
@pms_router.post("/tasks", response_model=TaskResponse)
async def create_task(task: TaskCreate, current_user: dict = Depends(require_role(2))):
    """Create a task (Team Lead+)"""
    task_doc = {
        "id": str(uuid.uuid4()),
        "project_id": task.project_id,
        "title": task.title,
        "description": task.description,
        "status": "todo",
        "priority": task.priority,
        "assigned_to": task.assigned_to,
        "due_date": task.due_date,
        "estimated_hours": task.estimated_hours,
        "actual_hours": 0,
        "service_type": task.service_type,
        "created_by": current_user["id"],
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.tasks.insert_one(task_doc)
    
    # Notify assignee
    if task.assigned_to:
        await create_notification(task.assigned_to, "Task Assigned", f"You've been assigned: {task.title}", "pms", "task", task_doc["id"])
    
    return task_doc

@pms_router.get("/tasks", response_model=List[TaskResponse])
async def list_tasks(
    project_id: Optional[str] = None,
    status: Optional[str] = None,
    assigned_to: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    """List tasks"""
    query = {}
    if project_id:
        query["project_id"] = project_id
    if status:
        query["status"] = status
    if assigned_to:
        query["assigned_to"] = assigned_to
    
    # Employees only see their assigned tasks
    if current_user["role_level"] < 2:
        query["assigned_to"] = current_user["id"]
    
    tasks = await db.tasks.find(query, {"_id": 0}).sort("created_at", -1).to_list(1000)
    return tasks

@pms_router.get("/tasks/my", response_model=List[TaskResponse])
async def get_my_tasks(current_user: dict = Depends(get_current_user)):
    """Get my assigned tasks"""
    tasks = await db.tasks.find({"assigned_to": current_user["id"]}, {"_id": 0}).sort("created_at", -1).to_list(100)
    return tasks

@pms_router.get("/tasks/{task_id}", response_model=TaskResponse)
async def get_task(task_id: str, current_user: dict = Depends(get_current_user)):
    """Get task details"""
    task = await db.tasks.find_one({"id": task_id}, {"_id": 0})
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    return task

@pms_router.put("/tasks/{task_id}", response_model=TaskResponse)
async def update_task(task_id: str, task_update: TaskUpdate, current_user: dict = Depends(get_current_user)):
    """Update a task"""
    task = await db.tasks.find_one({"id": task_id}, {"_id": 0})
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    
    # Employees can only update their own tasks
    if current_user["role_level"] < 2 and task.get("assigned_to") != current_user["id"]:
        raise HTTPException(status_code=403, detail="Can only update your own tasks")
    
    update_data = {k: v for k, v in task_update.model_dump().items() if v is not None}
    update_data["updated_at"] = datetime.now(timezone.utc).isoformat()
    
    result = await db.tasks.find_one_and_update(
        {"id": task_id},
        {"$set": update_data},
        return_document=True,
        projection={"_id": 0}
    )
    
    # Notify on status change
    if task_update.status and task_update.status != task.get("status"):
        if task.get("assigned_to") and task["assigned_to"] != current_user["id"]:
            await create_notification(task["assigned_to"], "Task Updated", f"Task '{result['title']}' status changed to {task_update.status}", "pms", "task", task_id)
    
    return result

@pms_router.put("/tasks/{task_id}/assign")
async def assign_task(task_id: str, user_id: str, current_user: dict = Depends(require_role(2))):
    """Assign a task to a user (Team Lead+)"""
    result = await db.tasks.find_one_and_update(
        {"id": task_id},
        {"$set": {"assigned_to": user_id, "updated_at": datetime.now(timezone.utc).isoformat()}},
        return_document=True,
        projection={"_id": 0}
    )
    if not result:
        raise HTTPException(status_code=404, detail="Task not found")
    
    # Notify assignee
    await create_notification(user_id, "Task Assigned", f"You've been assigned: {result['title']}", "pms", "task", task_id)
    
    return result

@pms_router.delete("/tasks/{task_id}")
async def delete_task(task_id: str, current_user: dict = Depends(require_role(3))):
    """Delete a task (Manager+)"""
    result = await db.tasks.delete_one({"id": task_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Task not found")
    return {"message": "Task deleted"}

# ==================== VAULT ROUTES ====================
@vault_router.post("/folders", response_model=VaultFolderResponse)
async def create_vault_folder(folder: VaultFolderCreate, current_user: dict = Depends(require_role(3))):
    """Create a vault folder (Manager+)"""
    folder_doc = {
        "id": str(uuid.uuid4()),
        "name": folder.name,
        "folder_type": folder.folder_type,
        "project_id": folder.project_id,
        "description": folder.description,
        "created_by": current_user["id"],
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.vault_folders.insert_one(folder_doc)
    return folder_doc

@vault_router.get("/folders", response_model=List[VaultFolderResponse])
async def list_vault_folders(current_user: dict = Depends(get_current_user)):
    """List accessible vault folders"""
    # Super Admin sees all
    if current_user["role_level"] >= 6:
        folders = await db.vault_folders.find({}, {"_id": 0}).to_list(100)
        return folders
    
    # Get folders user has access to
    access_records = await db.vault_access.find({"user_id": current_user["id"]}, {"_id": 0}).to_list(100)
    folder_ids = [a["folder_id"] for a in access_records]
    
    # Also include personal folders
    query = {"$or": [
        {"id": {"$in": folder_ids}},
        {"owner_id": current_user["id"]},
        {"created_by": current_user["id"]}
    ]}
    
    folders = await db.vault_folders.find(query, {"_id": 0}).to_list(100)
    return folders

@vault_router.post("/credentials", response_model=VaultCredentialResponse)
async def create_credential(cred: VaultCredentialCreate, current_user: dict = Depends(require_role(3))):
    """Create a vault credential (Manager+)"""
    # Encrypt password
    encrypted_password, encryption_iv = encrypt_password(cred.password)
    
    cred_doc = {
        "id": str(uuid.uuid4()),
        "folder_id": cred.folder_id,
        "name": cred.name,
        "username": cred.username,
        "encrypted_password": encrypted_password,
        "encryption_iv": encryption_iv,
        "url": cred.url,
        "notes": cred.notes,
        "expiry_date": cred.expiry_date,
        "created_by": current_user["id"],
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.vault_credentials.insert_one(cred_doc)
    
    # Log audit
    await db.vault_audit_logs.insert_one({
        "id": str(uuid.uuid4()),
        "user_id": current_user["id"],
        "action": "create",
        "credential_id": cred_doc["id"],
        "details": f"Created credential: {cred.name}",
        "created_at": datetime.now(timezone.utc).isoformat()
    })
    
    # Return without password
    return {k: v for k, v in cred_doc.items() if k not in ["encrypted_password", "encryption_iv"]}

@vault_router.get("/folders/{folder_id}/credentials", response_model=List[VaultCredentialResponse])
async def list_folder_credentials(folder_id: str, current_user: dict = Depends(get_current_user)):
    """List credentials in a folder (masked)"""
    # Check access
    folder = await db.vault_folders.find_one({"id": folder_id}, {"_id": 0})
    if not folder:
        raise HTTPException(status_code=404, detail="Folder not found")
    
    has_access = current_user["role_level"] >= 6 or folder.get("owner_id") == current_user["id"] or folder.get("created_by") == current_user["id"]
    if not has_access:
        access = await db.vault_access.find_one({"user_id": current_user["id"], "folder_id": folder_id})
        if not access:
            raise HTTPException(status_code=403, detail="Access denied")
    
    credentials = await db.vault_credentials.find({"folder_id": folder_id}, {"_id": 0, "encrypted_password": 0, "encryption_iv": 0}).to_list(100)
    return credentials

@vault_router.post("/credentials/{credential_id}/reveal", response_model=VaultCredentialReveal)
async def reveal_credential(credential_id: str, current_user: dict = Depends(get_current_user)):
    """Reveal credential password (logged)"""
    cred = await db.vault_credentials.find_one({"id": credential_id}, {"_id": 0})
    if not cred:
        raise HTTPException(status_code=404, detail="Credential not found")
    
    # Check access to folder
    folder = await db.vault_folders.find_one({"id": cred["folder_id"]}, {"_id": 0})
    has_access = current_user["role_level"] >= 6 or folder.get("owner_id") == current_user["id"] or folder.get("created_by") == current_user["id"]
    if not has_access:
        access = await db.vault_access.find_one({"user_id": current_user["id"], "folder_id": cred["folder_id"]})
        if not access:
            raise HTTPException(status_code=403, detail="Access denied")
    
    # Log reveal action
    await db.vault_audit_logs.insert_one({
        "id": str(uuid.uuid4()),
        "user_id": current_user["id"],
        "action": "reveal",
        "credential_id": credential_id,
        "details": f"Revealed password for: {cred['name']}",
        "created_at": datetime.now(timezone.utc).isoformat()
    })
    
    # Decrypt and return
    password = decrypt_password(cred["encrypted_password"], cred["encryption_iv"])
    return {"password": password}

@vault_router.post("/credentials/{credential_id}/copy")
async def copy_credential(credential_id: str, current_user: dict = Depends(get_current_user)):
    """Log credential copy action"""
    cred = await db.vault_credentials.find_one({"id": credential_id}, {"_id": 0})
    if not cred:
        raise HTTPException(status_code=404, detail="Credential not found")
    
    # Log copy action
    await db.vault_audit_logs.insert_one({
        "id": str(uuid.uuid4()),
        "user_id": current_user["id"],
        "action": "copy",
        "credential_id": credential_id,
        "details": f"Copied password for: {cred['name']}",
        "created_at": datetime.now(timezone.utc).isoformat()
    })
    
    return {"message": "Copy logged"}

@vault_router.put("/credentials/{credential_id}", response_model=VaultCredentialResponse)
async def update_credential(credential_id: str, cred: VaultCredentialCreate, current_user: dict = Depends(require_role(3))):
    """Update a credential (Manager+)"""
    encrypted_password, encryption_iv = encrypt_password(cred.password)
    
    result = await db.vault_credentials.find_one_and_update(
        {"id": credential_id},
        {"$set": {
            "name": cred.name,
            "username": cred.username,
            "encrypted_password": encrypted_password,
            "encryption_iv": encryption_iv,
            "url": cred.url,
            "notes": cred.notes,
            "expiry_date": cred.expiry_date,
            "updated_at": datetime.now(timezone.utc).isoformat()
        }},
        return_document=True,
        projection={"_id": 0, "encrypted_password": 0, "encryption_iv": 0}
    )
    if not result:
        raise HTTPException(status_code=404, detail="Credential not found")
    
    # Log audit
    await db.vault_audit_logs.insert_one({
        "id": str(uuid.uuid4()),
        "user_id": current_user["id"],
        "action": "edit",
        "credential_id": credential_id,
        "details": f"Updated credential: {cred.name}",
        "created_at": datetime.now(timezone.utc).isoformat()
    })
    
    return result

@vault_router.delete("/credentials/{credential_id}")
async def delete_credential(credential_id: str, current_user: dict = Depends(require_role(3))):
    """Delete a credential (Manager+)"""
    cred = await db.vault_credentials.find_one({"id": credential_id}, {"_id": 0})
    if not cred:
        raise HTTPException(status_code=404, detail="Credential not found")
    
    await db.vault_credentials.delete_one({"id": credential_id})
    
    # Log audit
    await db.vault_audit_logs.insert_one({
        "id": str(uuid.uuid4()),
        "user_id": current_user["id"],
        "action": "delete",
        "credential_id": credential_id,
        "details": f"Deleted credential: {cred['name']}",
        "created_at": datetime.now(timezone.utc).isoformat()
    })
    
    return {"message": "Credential deleted"}

# Access Requests
@vault_router.post("/access-requests", response_model=VaultAccessRequestResponse)
async def create_access_request(req: VaultAccessRequestCreate, current_user: dict = Depends(get_current_user)):
    """Request access to a credential"""
    cred = await db.vault_credentials.find_one({"id": req.credential_id}, {"_id": 0})
    if not cred:
        raise HTTPException(status_code=404, detail="Credential not found")
    
    request_doc = {
        "id": str(uuid.uuid4()),
        "credential_id": req.credential_id,
        "requested_by": current_user["id"],
        "reason": req.reason,
        "status": "pending",
        "resolved_by": None,
        "resolved_at": None,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.vault_access_requests.insert_one(request_doc)
    
    # Notify folder creator/owner
    folder = await db.vault_folders.find_one({"id": cred["folder_id"]}, {"_id": 0})
    if folder:
        notify_user = folder.get("created_by") or folder.get("owner_id")
        if notify_user:
            await create_notification(notify_user, "Vault Access Request", f"Access requested for: {cred['name']}", "vault", "access_request", request_doc["id"])
    
    return request_doc

@vault_router.get("/access-requests", response_model=List[VaultAccessRequestResponse])
async def list_access_requests(current_user: dict = Depends(get_current_user)):
    """List my access requests"""
    requests = await db.vault_access_requests.find({"requested_by": current_user["id"]}, {"_id": 0}).sort("created_at", -1).to_list(100)
    return requests

@vault_router.get("/access-requests/pending", response_model=List[VaultAccessRequestResponse])
async def list_pending_access_requests(current_user: dict = Depends(require_role(3))):
    """List pending access requests (Manager+)"""
    requests = await db.vault_access_requests.find({"status": "pending"}, {"_id": 0}).sort("created_at", -1).to_list(100)
    return requests

@vault_router.put("/access-requests/{request_id}/resolve")
async def resolve_access_request(request_id: str, approved: bool, current_user: dict = Depends(require_role(3))):
    """Approve or deny access request (Manager+)"""
    request = await db.vault_access_requests.find_one({"id": request_id}, {"_id": 0})
    if not request:
        raise HTTPException(status_code=404, detail="Request not found")
    
    status = "approved" if approved else "denied"
    await db.vault_access_requests.update_one(
        {"id": request_id},
        {"$set": {"status": status, "resolved_by": current_user["id"], "resolved_at": datetime.now(timezone.utc).isoformat()}}
    )
    
    # If approved, grant access to folder
    if approved:
        cred = await db.vault_credentials.find_one({"id": request["credential_id"]}, {"_id": 0})
        if cred:
            # Check if access already exists
            existing = await db.vault_access.find_one({"user_id": request["requested_by"], "folder_id": cred["folder_id"]})
            if not existing:
                access = {
                    "id": str(uuid.uuid4()),
                    "user_id": request["requested_by"],
                    "folder_id": cred["folder_id"],
                    "granted_by": current_user["id"],
                    "created_at": datetime.now(timezone.utc).isoformat()
                }
                await db.vault_access.insert_one(access)
    
    # Notify requester
    await create_notification(request["requested_by"], f"Access Request {status.title()}", f"Your vault access request has been {status}.", "vault", "access_request", request_id)
    
    return {"message": f"Request {status}"}

@vault_router.get("/audit-log")
async def get_vault_audit_log(
    limit: int = Query(100, le=1000),
    current_user: dict = Depends(require_role(5))
):
    """Get vault audit log (MD+)"""
    logs = await db.vault_audit_logs.find({}, {"_id": 0}).sort("created_at", -1).to_list(limit)
    return logs

# ==================== NOTIFICATIONS ROUTES ====================
@notifications_router.get("/", response_model=List[NotificationResponse])
async def list_notifications(
    unread_only: bool = False,
    limit: int = Query(50, le=100),
    current_user: dict = Depends(get_current_user)
):
    """List my notifications"""
    query = {"user_id": current_user["id"]}
    if unread_only:
        query["is_read"] = False
    
    notifications = await db.notifications.find(query, {"_id": 0}).sort("created_at", -1).to_list(limit)
    return notifications

@notifications_router.get("/unread-count")
async def get_unread_count(current_user: dict = Depends(get_current_user)):
    """Get unread notification count"""
    count = await db.notifications.count_documents({"user_id": current_user["id"], "is_read": False})
    return {"count": count}

@notifications_router.put("/{notification_id}/read")
async def mark_notification_read(notification_id: str, current_user: dict = Depends(get_current_user)):
    """Mark notification as read"""
    result = await db.notifications.update_one(
        {"id": notification_id, "user_id": current_user["id"]},
        {"$set": {"is_read": True}}
    )
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Notification not found")
    return {"message": "Marked as read"}

@notifications_router.put("/read-all")
async def mark_all_read(current_user: dict = Depends(get_current_user)):
    """Mark all notifications as read"""
    await db.notifications.update_many(
        {"user_id": current_user["id"], "is_read": False},
        {"$set": {"is_read": True}}
    )
    return {"message": "All marked as read"}

# ==================== ISSUES ROUTES ====================
@issues_router.post("/", response_model=IssueResponse)
async def create_issue(issue: IssueCreate, current_user: dict = Depends(get_current_user)):
    """Create an issue"""
    issue_doc = {
        "id": str(uuid.uuid4()),
        "title": issue.title,
        "description": issue.description,
        "issue_type": issue.issue_type,
        "priority": issue.priority,
        "status": "open",
        "project_id": issue.project_id,
        "reported_by": current_user["id"],
        "assigned_to": issue.assigned_to,
        "due_date": issue.due_date,
        "tags": issue.tags,
        "resolution_note": None,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.issues.insert_one(issue_doc)
    
    # Log activity
    await db.issue_activity_log.insert_one({
        "id": str(uuid.uuid4()),
        "issue_id": issue_doc["id"],
        "user_id": current_user["id"],
        "action": "created",
        "details": "Issue created",
        "created_at": datetime.now(timezone.utc).isoformat()
    })
    
    # Notify assignee
    if issue.assigned_to:
        await create_notification(issue.assigned_to, "Issue Assigned", f"You've been assigned issue: {issue.title}", "issue", "issue", issue_doc["id"])
    
    return issue_doc

@issues_router.get("/", response_model=List[IssueResponse])
async def list_issues(
    status: Optional[str] = None,
    issue_type: Optional[str] = None,
    project_id: Optional[str] = None,
    assigned_to: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    """List issues"""
    query = {}
    if status:
        query["status"] = status
    if issue_type:
        query["issue_type"] = issue_type
    if project_id:
        query["project_id"] = project_id
    if assigned_to:
        query["assigned_to"] = assigned_to
    
    issues = await db.issues.find(query, {"_id": 0}).sort("created_at", -1).to_list(1000)
    return issues

@issues_router.get("/{issue_id}", response_model=IssueResponse)
async def get_issue(issue_id: str, current_user: dict = Depends(get_current_user)):
    """Get issue details with comments and activity"""
    issue = await db.issues.find_one({"id": issue_id}, {"_id": 0})
    if not issue:
        raise HTTPException(status_code=404, detail="Issue not found")
    return issue

@issues_router.get("/{issue_id}/comments", response_model=List[IssueCommentResponse])
async def get_issue_comments(issue_id: str, current_user: dict = Depends(get_current_user)):
    """Get issue comments"""
    comments = await db.issue_comments.find({"issue_id": issue_id}, {"_id": 0}).sort("created_at", 1).to_list(100)
    return comments

@issues_router.get("/{issue_id}/activity")
async def get_issue_activity(issue_id: str, current_user: dict = Depends(get_current_user)):
    """Get issue activity log"""
    activity = await db.issue_activity_log.find({"issue_id": issue_id}, {"_id": 0}).sort("created_at", 1).to_list(100)
    return activity

@issues_router.put("/{issue_id}", response_model=IssueResponse)
async def update_issue(issue_id: str, issue: IssueCreate, current_user: dict = Depends(get_current_user)):
    """Update an issue"""
    result = await db.issues.find_one_and_update(
        {"id": issue_id},
        {"$set": {
            "title": issue.title,
            "description": issue.description,
            "issue_type": issue.issue_type,
            "priority": issue.priority,
            "project_id": issue.project_id,
            "assigned_to": issue.assigned_to,
            "due_date": issue.due_date,
            "tags": issue.tags,
            "updated_at": datetime.now(timezone.utc).isoformat()
        }},
        return_document=True,
        projection={"_id": 0}
    )
    if not result:
        raise HTTPException(status_code=404, detail="Issue not found")
    
    # Log activity
    await db.issue_activity_log.insert_one({
        "id": str(uuid.uuid4()),
        "issue_id": issue_id,
        "user_id": current_user["id"],
        "action": "updated",
        "details": "Issue details updated",
        "created_at": datetime.now(timezone.utc).isoformat()
    })
    
    return result

@issues_router.put("/{issue_id}/status")
async def update_issue_status(issue_id: str, status: str, resolution_note: Optional[str] = None, current_user: dict = Depends(get_current_user)):
    """Update issue status"""
    if status not in ISSUE_STATUS:
        raise HTTPException(status_code=400, detail="Invalid status")
    
    update_data = {"status": status, "updated_at": datetime.now(timezone.utc).isoformat()}
    if resolution_note:
        update_data["resolution_note"] = resolution_note
    
    result = await db.issues.find_one_and_update(
        {"id": issue_id},
        {"$set": update_data},
        return_document=True,
        projection={"_id": 0}
    )
    if not result:
        raise HTTPException(status_code=404, detail="Issue not found")
    
    # Log activity
    await db.issue_activity_log.insert_one({
        "id": str(uuid.uuid4()),
        "issue_id": issue_id,
        "user_id": current_user["id"],
        "action": "status_changed",
        "details": f"Status changed to {status}",
        "created_at": datetime.now(timezone.utc).isoformat()
    })
    
    # Notify reporter
    if result["reported_by"] != current_user["id"]:
        await create_notification(result["reported_by"], "Issue Updated", f"Issue '{result['title']}' status changed to {status}", "issue", "issue", issue_id)
    
    return result

@issues_router.post("/{issue_id}/comments", response_model=IssueCommentResponse)
async def add_issue_comment(issue_id: str, comment: IssueCommentCreate, current_user: dict = Depends(get_current_user)):
    """Add a comment to an issue"""
    issue = await db.issues.find_one({"id": issue_id}, {"_id": 0})
    if not issue:
        raise HTTPException(status_code=404, detail="Issue not found")
    
    comment_doc = {
        "id": str(uuid.uuid4()),
        "issue_id": issue_id,
        "user_id": current_user["id"],
        "content": comment.content,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.issue_comments.insert_one(comment_doc)
    
    # Log activity
    await db.issue_activity_log.insert_one({
        "id": str(uuid.uuid4()),
        "issue_id": issue_id,
        "user_id": current_user["id"],
        "action": "commented",
        "details": "Added a comment",
        "created_at": datetime.now(timezone.utc).isoformat()
    })
    
    return comment_doc

@issues_router.delete("/{issue_id}")
async def delete_issue(issue_id: str, current_user: dict = Depends(require_role(3))):
    """Delete an issue (Manager+)"""
    result = await db.issues.delete_one({"id": issue_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Issue not found")
    
    # Also delete comments and activity
    await db.issue_comments.delete_many({"issue_id": issue_id})
    await db.issue_activity_log.delete_many({"issue_id": issue_id})
    
    return {"message": "Issue deleted"}

# ==================== AUTOMATION ROUTES ====================
AUTOMATION_TRIGGERS = [
    "employee_created", "employee_offboarded",
    "leave_submitted", "leave_approved", "leave_rejected",
    "escalation_created", "escalation_overdue",
    "project_created", "project_status_changed",
    "task_assigned", "task_status_changed", "task_overdue",
    "issue_created", "issue_status_changed", "issue_overdue", "issue_sla_breached",
    "vault_access_requested", "credential_expiring"
]

AUTOMATION_ACTIONS = [
    "assign_to_user", "change_status", "create_task", "create_issue",
    "send_notification", "add_comment", "update_priority",
    "grant_vault_access", "revoke_vault_access", "set_due_date"
]

AUTOMATION_TEMPLATES = [
    {"id": "onboarding", "name": "New Employee Onboarding", "trigger_type": "employee_created", "actions": [{"type": "send_notification", "config": {"title": "Welcome!", "message": "Complete your onboarding tasks"}}]},
    {"id": "offboarding", "name": "Employee Offboarding", "trigger_type": "employee_offboarded", "actions": [{"type": "revoke_vault_access", "config": {}}]},
    {"id": "critical_issue", "name": "Critical Issue Auto-Escalate", "trigger_type": "issue_created", "conditions": [{"field": "priority", "operator": "equals", "value": "critical"}], "actions": [{"type": "send_notification", "config": {"to": "managers"}}]},
    {"id": "sla_breach", "name": "SLA Breach Alert", "trigger_type": "issue_sla_breached", "actions": [{"type": "send_notification", "config": {"to": "managers"}}, {"type": "update_priority", "config": {"priority": "critical"}}]},
    {"id": "task_overdue", "name": "Task Overdue Escalation", "trigger_type": "task_overdue", "actions": [{"type": "send_notification", "config": {"to": "team_lead"}}]},
    {"id": "vault_expiry", "name": "Vault Credential Expiry Reminder", "trigger_type": "credential_expiring", "actions": [{"type": "send_notification", "config": {"to": "owner"}}]},
    {"id": "project_complete", "name": "Project Completion Checklist", "trigger_type": "project_status_changed", "conditions": [{"field": "status", "operator": "equals", "value": "completed"}], "actions": [{"type": "create_task", "config": {"title": "Archive project files"}}]},
    {"id": "leave_coverage", "name": "Leave Coverage Auto-Notify", "trigger_type": "leave_approved", "actions": [{"type": "send_notification", "config": {"to": "team"}}]}
]

@automation_router.get("/triggers")
async def list_triggers():
    """List available automation triggers"""
    return AUTOMATION_TRIGGERS

@automation_router.get("/actions")
async def list_actions():
    """List available automation actions"""
    return AUTOMATION_ACTIONS

@automation_router.get("/templates")
async def list_templates(current_user: dict = Depends(require_role(3))):
    """List automation templates (Manager+)"""
    return AUTOMATION_TEMPLATES

@automation_router.post("/templates/{template_id}/enable")
async def enable_template(template_id: str, current_user: dict = Depends(require_role(3))):
    """Enable an automation template (Manager+)"""
    template = next((t for t in AUTOMATION_TEMPLATES if t["id"] == template_id), None)
    if not template:
        raise HTTPException(status_code=404, detail="Template not found")
    
    rule_doc = {
        "id": str(uuid.uuid4()),
        "name": template["name"],
        "description": f"Auto-created from template: {template_id}",
        "trigger_type": template["trigger_type"],
        "trigger_config": {},
        "conditions": template.get("conditions", []),
        "actions": template["actions"],
        "is_active": True,
        "created_by": current_user["id"],
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.automation_rules.insert_one(rule_doc)
    return rule_doc

@automation_router.post("/rules", response_model=AutomationRuleResponse)
async def create_automation_rule(rule: AutomationRuleCreate, current_user: dict = Depends(require_role(3))):
    """Create an automation rule (Manager+)"""
    if rule.trigger_type not in AUTOMATION_TRIGGERS:
        raise HTTPException(status_code=400, detail="Invalid trigger type")
    
    rule_doc = {
        "id": str(uuid.uuid4()),
        "name": rule.name,
        "description": rule.description,
        "trigger_type": rule.trigger_type,
        "trigger_config": rule.trigger_config,
        "conditions": rule.conditions,
        "actions": rule.actions,
        "is_active": rule.is_active,
        "created_by": current_user["id"],
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.automation_rules.insert_one(rule_doc)
    return rule_doc

@automation_router.get("/rules", response_model=List[AutomationRuleResponse])
async def list_automation_rules(current_user: dict = Depends(require_role(3))):
    """List automation rules (Manager+)"""
    rules = await db.automation_rules.find({}, {"_id": 0}).sort("created_at", -1).to_list(100)
    return rules

@automation_router.get("/rules/{rule_id}", response_model=AutomationRuleResponse)
async def get_automation_rule(rule_id: str, current_user: dict = Depends(require_role(3))):
    """Get automation rule details (Manager+)"""
    rule = await db.automation_rules.find_one({"id": rule_id}, {"_id": 0})
    if not rule:
        raise HTTPException(status_code=404, detail="Rule not found")
    return rule

@automation_router.put("/rules/{rule_id}", response_model=AutomationRuleResponse)
async def update_automation_rule(rule_id: str, rule: AutomationRuleCreate, current_user: dict = Depends(require_role(3))):
    """Update an automation rule (Manager+)"""
    result = await db.automation_rules.find_one_and_update(
        {"id": rule_id},
        {"$set": {
            "name": rule.name,
            "description": rule.description,
            "trigger_type": rule.trigger_type,
            "trigger_config": rule.trigger_config,
            "conditions": rule.conditions,
            "actions": rule.actions,
            "is_active": rule.is_active,
            "updated_at": datetime.now(timezone.utc).isoformat()
        }},
        return_document=True,
        projection={"_id": 0}
    )
    if not result:
        raise HTTPException(status_code=404, detail="Rule not found")
    return result

@automation_router.put("/rules/{rule_id}/toggle")
async def toggle_automation_rule(rule_id: str, current_user: dict = Depends(require_role(3))):
    """Toggle automation rule active state (Manager+)"""
    rule = await db.automation_rules.find_one({"id": rule_id}, {"_id": 0})
    if not rule:
        raise HTTPException(status_code=404, detail="Rule not found")
    
    new_state = not rule.get("is_active", True)
    await db.automation_rules.update_one({"id": rule_id}, {"$set": {"is_active": new_state, "updated_at": datetime.now(timezone.utc).isoformat()}})
    return {"is_active": new_state}

@automation_router.delete("/rules/{rule_id}")
async def delete_automation_rule(rule_id: str, current_user: dict = Depends(require_role(5))):
    """Delete an automation rule (MD+)"""
    result = await db.automation_rules.delete_one({"id": rule_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Rule not found")
    return {"message": "Rule deleted"}

@automation_router.get("/logs")
async def get_automation_logs(
    rule_id: Optional[str] = None,
    limit: int = Query(100, le=1000),
    current_user: dict = Depends(require_role(5))
):
    """Get automation execution logs (MD+)"""
    query = {}
    if rule_id:
        query["rule_id"] = rule_id
    
    logs = await db.automation_logs.find(query, {"_id": 0}).sort("created_at", -1).to_list(limit)
    return logs

# ==================== CALENDAR ROUTES ====================
@calendar_router.post("/events", response_model=CalendarEventResponse)
async def create_calendar_event(event: CalendarEventCreate, current_user: dict = Depends(get_current_user)):
    """Create a calendar event"""
    event_doc = {
        "id": str(uuid.uuid4()),
        "title": event.title,
        "description": event.description,
        "start_at": event.start_at,
        "end_at": event.end_at,
        "all_day": event.all_day,
        "location": event.location,
        "is_private": event.is_private,
        "event_type": event.event_type,
        "source_type": None,
        "source_id": None,
        "creator_id": current_user["id"],
        "participants": event.participants,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.calendar_events.insert_one(event_doc)
    
    # Create reminders
    for minutes in event.reminder_minutes:
        reminder = {
            "id": str(uuid.uuid4()),
            "event_id": event_doc["id"],
            "user_id": current_user["id"],
            "remind_at": (datetime.fromisoformat(event.start_at) - timedelta(minutes=minutes)).isoformat(),
            "minutes_before": minutes,
            "sent": False,
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        await db.calendar_reminders.insert_one(reminder)
    
    # Notify participants
    for participant_id in event.participants:
        if participant_id != current_user["id"]:
            await create_notification(participant_id, "Event Invitation", f"You're invited to: {event.title}", "calendar", "event", event_doc["id"])
    
    return event_doc

@calendar_router.get("/events", response_model=List[CalendarEventResponse])
async def list_calendar_events(
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    event_type: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    """List my calendar events"""
    query = {"$or": [
        {"creator_id": current_user["id"]},
        {"participants": current_user["id"]}
    ]}
    
    if start_date:
        query["start_at"] = {"$gte": start_date}
    if end_date:
        if "start_at" in query:
            query["start_at"]["$lte"] = end_date
        else:
            query["start_at"] = {"$lte": end_date}
    if event_type:
        query["event_type"] = event_type
    
    events = await db.calendar_events.find(query, {"_id": 0}).sort("start_at", 1).to_list(500)
    
    # Filter private events
    filtered = []
    for event in events:
        if event.get("is_private") and event["creator_id"] != current_user["id"]:
            # Return minimal info for private events
            filtered.append({
                "id": event["id"],
                "title": "Private Event",
                "start_at": event["start_at"],
                "end_at": event.get("end_at"),
                "all_day": event.get("all_day", False),
                "is_private": True,
                "event_type": event["event_type"],
                "creator_id": event["creator_id"],
                "participants": [],
                "created_at": event["created_at"]
            })
        else:
            filtered.append(event)
    
    return filtered

@calendar_router.get("/events/{event_id}", response_model=CalendarEventResponse)
async def get_calendar_event(event_id: str, current_user: dict = Depends(get_current_user)):
    """Get calendar event details"""
    event = await db.calendar_events.find_one({"id": event_id}, {"_id": 0})
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    
    # Check access to private events
    if event.get("is_private") and event["creator_id"] != current_user["id"] and current_user["id"] not in event.get("participants", []):
        raise HTTPException(status_code=403, detail="Access denied to private event")
    
    return event

@calendar_router.put("/events/{event_id}", response_model=CalendarEventResponse)
async def update_calendar_event(event_id: str, event: CalendarEventCreate, current_user: dict = Depends(get_current_user)):
    """Update a calendar event (creator only)"""
    existing = await db.calendar_events.find_one({"id": event_id}, {"_id": 0})
    if not existing:
        raise HTTPException(status_code=404, detail="Event not found")
    
    if existing["creator_id"] != current_user["id"] and current_user["role_level"] < 3:
        raise HTTPException(status_code=403, detail="Can only update your own events")
    
    result = await db.calendar_events.find_one_and_update(
        {"id": event_id},
        {"$set": {
            "title": event.title,
            "description": event.description,
            "start_at": event.start_at,
            "end_at": event.end_at,
            "all_day": event.all_day,
            "location": event.location,
            "is_private": event.is_private,
            "event_type": event.event_type,
            "participants": event.participants,
            "updated_at": datetime.now(timezone.utc).isoformat()
        }},
        return_document=True,
        projection={"_id": 0}
    )
    
    return result

@calendar_router.delete("/events/{event_id}")
async def delete_calendar_event(event_id: str, current_user: dict = Depends(get_current_user)):
    """Delete a calendar event (creator only)"""
    event = await db.calendar_events.find_one({"id": event_id}, {"_id": 0})
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    
    if event["creator_id"] != current_user["id"] and current_user["role_level"] < 3:
        raise HTTPException(status_code=403, detail="Can only delete your own events")
    
    await db.calendar_events.delete_one({"id": event_id})
    await db.calendar_reminders.delete_many({"event_id": event_id})
    
    return {"message": "Event deleted"}

@calendar_router.put("/events/{event_id}/rsvp")
async def rsvp_event(event_id: str, response: str, current_user: dict = Depends(get_current_user)):
    """RSVP to an event"""
    if response not in ["accepted", "declined", "tentative"]:
        raise HTTPException(status_code=400, detail="Invalid RSVP response")
    
    event = await db.calendar_events.find_one({"id": event_id}, {"_id": 0})
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    
    if current_user["id"] not in event.get("participants", []):
        raise HTTPException(status_code=403, detail="Not invited to this event")
    
    # Store RSVP
    await db.calendar_event_participants.update_one(
        {"event_id": event_id, "user_id": current_user["id"]},
        {"$set": {"rsvp_status": response, "responded_at": datetime.now(timezone.utc).isoformat()}},
        upsert=True
    )
    
    return {"message": f"RSVP set to {response}"}

@calendar_router.get("/team/events", response_model=List[CalendarEventResponse])
async def get_team_calendar(
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    current_user: dict = Depends(require_role(2))
):
    """Get team calendar events (Team Lead+)"""
    query = {"is_private": {"$ne": True}}
    
    if start_date:
        query["start_at"] = {"$gte": start_date}
    if end_date:
        if "start_at" in query:
            query["start_at"]["$lte"] = end_date
        else:
            query["start_at"] = {"$lte": end_date}
    
    events = await db.calendar_events.find(query, {"_id": 0}).sort("start_at", 1).to_list(500)
    return events

@calendar_router.get("/org/events", response_model=List[CalendarEventResponse])
async def get_org_calendar(
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    current_user: dict = Depends(require_role(5))
):
    """Get org-wide calendar events (MD+)"""
    query = {}
    
    if start_date:
        query["start_at"] = {"$gte": start_date}
    if end_date:
        if "start_at" in query:
            query["start_at"]["$lte"] = end_date
        else:
            query["start_at"] = {"$lte": end_date}
    
    events = await db.calendar_events.find(query, {"_id": 0}).sort("start_at", 1).to_list(1000)
    return events

@calendar_router.get("/holidays")
async def get_holidays(
    year: Optional[int] = None,
    current_user: dict = Depends(get_current_user)
):
    """Get company holidays"""
    query = {"event_type": "holiday"}
    if year:
        query["start_at"] = {"$regex": f"^{year}"}
    
    holidays = await db.calendar_events.find(query, {"_id": 0}).sort("start_at", 1).to_list(100)
    return holidays

@calendar_router.post("/holidays", response_model=CalendarEventResponse)
async def create_holiday(event: CalendarEventCreate, current_user: dict = Depends(require_role(4))):
    """Create a company holiday (HR Manager+)"""
    event_doc = {
        "id": str(uuid.uuid4()),
        "title": event.title,
        "description": event.description,
        "start_at": event.start_at,
        "end_at": event.end_at or event.start_at,
        "all_day": True,
        "location": None,
        "is_private": False,
        "event_type": "holiday",
        "source_type": None,
        "source_id": None,
        "creator_id": current_user["id"],
        "participants": [],
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.calendar_events.insert_one(event_doc)
    return event_doc

@calendar_router.delete("/holidays/{holiday_id}")
async def delete_holiday(holiday_id: str, current_user: dict = Depends(require_role(4))):
    """Delete a company holiday (HR Manager+)"""
    result = await db.calendar_events.delete_one({"id": holiday_id, "event_type": "holiday"})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Holiday not found")
    return {"message": "Holiday deleted"}

# ==================== DASHBOARD ROUTES ====================
@api_router.get("/dashboard/overview")
async def get_dashboard_overview(current_user: dict = Depends(get_current_user)):
    """Get role-specific dashboard data"""
    role_level = current_user["role_level"]
    data = {}
    
    # Basic stats for everyone
    employee = await db.employees.find_one({"user_id": current_user["id"]}, {"_id": 0})
    
    if role_level >= 1:  # Employee+
        # My tasks
        my_tasks = await db.tasks.count_documents({"assigned_to": current_user["id"]})
        my_tasks_completed = await db.tasks.count_documents({"assigned_to": current_user["id"], "status": "completed"})
        
        # Recent notifications
        notifications = await db.notifications.find({"user_id": current_user["id"], "is_read": False}, {"_id": 0}).to_list(5)
        
        data["my_tasks"] = {"total": my_tasks, "completed": my_tasks_completed}
        data["recent_notifications"] = notifications
        
        if employee:
            # Leave balance
            year = datetime.now().year
            balance = await db.leave_balances.find_one({"employee_id": employee["id"], "year": year}, {"_id": 0})
            data["leave_balance"] = balance
            
            # Attendance this month
            month_start = datetime.now().replace(day=1).strftime("%Y-%m-%d")
            attendance_count = await db.attendance.count_documents({"employee_id": employee["id"], "date": {"$gte": month_start}})
            data["attendance_this_month"] = attendance_count
    
    if role_level >= 2:  # Team Lead+
        # Team tasks
        team_tasks = await db.tasks.count_documents({"status": {"$ne": "completed"}})
        team_tasks_overdue = await db.tasks.count_documents({
            "status": {"$ne": "completed"},
            "due_date": {"$lt": datetime.now(timezone.utc).strftime("%Y-%m-%d")}
        })
        
        # Pending leave approvals
        pending_leaves = await db.leaves.count_documents({"status": "pending"})
        
        data["team_tasks"] = {"active": team_tasks, "overdue": team_tasks_overdue}
        data["pending_leave_approvals"] = pending_leaves
    
    if role_level >= 3:  # Manager+
        # Active projects
        active_projects = await db.projects.count_documents({"status": {"$in": ["active", "in_progress"]}})
        
        # Project list with progress
        projects = await db.projects.find({"status": {"$in": ["active", "in_progress"]}}, {"_id": 0}).to_list(10)
        for project in projects:
            total_tasks = await db.tasks.count_documents({"project_id": project["id"]})
            completed_tasks = await db.tasks.count_documents({"project_id": project["id"], "status": "completed"})
            project["progress"] = round((completed_tasks / total_tasks * 100) if total_tasks > 0 else 0, 1)
        
        data["active_projects"] = active_projects
        data["project_cards"] = projects
    
    if role_level >= 4:  # HR Manager+
        # Employee stats
        total_employees = await db.employees.count_documents({"status": "active", "deleted_at": {"$exists": False}})
        
        # By department
        dept_pipeline = [
            {"$match": {"status": "active", "deleted_at": {"$exists": False}}},
            {"$group": {"_id": "$department_id", "count": {"$sum": 1}}}
        ]
        dept_counts = await db.employees.aggregate(dept_pipeline).to_list(100)
        
        # Escalation backlog
        escalation_backlog = await db.escalations.count_documents({"status": {"$in": ["open", "in_progress"]}})
        
        data["total_employees"] = total_employees
        data["employees_by_department"] = dept_counts
        data["escalation_backlog"] = escalation_backlog
    
    if role_level >= 5:  # MD+
        # Org KPIs
        total_projects = await db.projects.count_documents({})
        total_issues = await db.issues.count_documents({"status": {"$ne": "closed"}})
        vault_requests_pending = await db.vault_access_requests.count_documents({"status": "pending"})
        
        data["org_kpis"] = {
            "total_projects": total_projects,
            "open_issues": total_issues,
            "vault_requests_pending": vault_requests_pending
        }
    
    if role_level >= 6:  # Super Admin
        # System health
        total_users = await db.users.count_documents({"is_active": True})
        audit_log_count = await db.vault_audit_logs.count_documents({})
        
        data["system_health"] = {
            "active_users": total_users,
            "vault_audit_entries": audit_log_count
        }
    
    return data

@api_router.get("/dashboard/stats")
async def get_stats(current_user: dict = Depends(get_current_user)):
    """Get quick stats for dashboard cards"""
    stats = {
        "users": await db.users.count_documents({"is_active": True}),
        "employees": await db.employees.count_documents({"status": "active", "deleted_at": {"$exists": False}}),
        "projects": await db.projects.count_documents({"status": {"$in": ["active", "in_progress"]}}),
        "tasks_pending": await db.tasks.count_documents({"status": {"$ne": "completed"}}),
        "issues_open": await db.issues.count_documents({"status": {"$nin": ["closed", "resolved"]}}),
        "vault_folders": await db.vault_folders.count_documents({}),
        "automation_rules": await db.automation_rules.count_documents({"is_active": True})
    }
    return stats

# ==================== USERS ROUTES ====================
@api_router.get("/users", response_model=List[UserResponse])
async def list_users(current_user: dict = Depends(require_role(4))):
    """List all users (HR Manager+)"""
    users = await db.users.find({"is_active": True}, {"_id": 0, "password_hash": 0}).to_list(1000)
    return users

@api_router.get("/users/{user_id}", response_model=UserResponse)
async def get_user(user_id: str, current_user: dict = Depends(get_current_user)):
    """Get user details"""
    user = await db.users.find_one({"id": user_id}, {"_id": 0, "password_hash": 0})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user

# ==================== HEALTH CHECK ====================
@api_router.get("/health")
async def health_check():
    """Health check endpoint"""
    try:
        await db.command("ping")
        return {"status": "healthy", "database": "connected", "version": "2.1"}
    except Exception as e:
        return {"status": "unhealthy", "database": "disconnected", "error": str(e)}

# Include all routers
api_router.include_router(auth_router)
api_router.include_router(hrm_router)
api_router.include_router(pms_router)
api_router.include_router(vault_router)
api_router.include_router(notifications_router)
api_router.include_router(issues_router)
api_router.include_router(automation_router)
api_router.include_router(calendar_router)

app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
