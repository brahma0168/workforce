# Signal by Profitcast - PRD & Implementation Status

## Original Problem Statement
Build Signal by Profitcast/ProjectFlow/Workforce - a comprehensive internal operations platform for Profitcast Growth Marketing Agency with:
- HRM Module: Employees, attendance, leave management, escalations
- PMS Module: Projects with 16 service templates, tasks with Kanban board
- Native Credential Vault: AES-256-GCM encrypted passwords
- Notifications system
- Issues Tracker with workflow
- Automation Engine
- Calendar with multiple views
- 6-level RBAC system

## User Personas
1. **Employee (Level 1)**: View own tasks, attendance, leaves, vault (personal only)
2. **Team Lead (Level 2)**: Manage team, approve leaves, create tasks
3. **Manager (Level 3)**: Full PMS access, project management, vault folders
4. **HR Manager (Level 4)**: Full HRM access, departments, employees, escalations
5. **Managing Director (Level 5)**: Organization-wide access, automation logs, audit
6. **Super Admin (Level 6)**: System-wide access, user management, all permissions

## Core Requirements (Static)
- Dark-mode only design
- Profitcast branding (Teal #00A1C7, Mint #00FFAA, Orange #FF6826)
- JWT authentication (24h access, 7d refresh)
- MongoDB database
- React frontend with shadcn/ui
- FastAPI backend

## What's Been Implemented (March 2, 2026)

### Backend (FastAPI + MongoDB)
- ✅ Authentication: Register, login, logout, token refresh, JWT with RBAC
- ✅ HRM: Departments, employees, attendance (check-in/out), leave management, escalations
- ✅ PMS: Projects with 16 service templates, auto-task generation, Kanban tasks
- ✅ Vault: Folders (4 types), credentials with AES-256-GCM encryption, access requests, audit logs
- ✅ Notifications: CRUD, mark read, unread count
- ✅ Issues: Full CRUD, comments, activity log, status workflow
- ✅ Automation: Rules, templates, triggers, actions
- ✅ Calendar: Events, holidays, RSVP, team/org views
- ✅ Dashboard: Role-specific overview with stats

### Frontend (React + shadcn/ui)
- ✅ Login page (matching design screenshot exactly)
- ✅ Dashboard with Account Health view, platform cards
- ✅ Sidebar navigation with all modules
- ✅ Employees page with CRUD, user creation
- ✅ Projects page with cards, create modal
- ✅ Project detail with Kanban board
- ✅ Tasks page with table view
- ✅ Vault page with folder-credential layout
- ✅ Attendance page with check-in/out
- ✅ Leaves page with balance display
- ✅ Issues page with detail panel
- ✅ Calendar page with month view
- ✅ Notifications page
- ✅ Settings page

## Prioritized Backlog

### P0 - Critical (Next Sprint)
- [ ] Automation rule execution engine
- [ ] Leave approval workflow for managers
- [ ] Project status change workflow

### P1 - High Priority
- [ ] Employee offboarding flow completion
- [ ] Vault credential expiry notifications
- [ ] Task due date reminders
- [ ] Calendar week/day/agenda views
- [ ] Issue SLA tracking

### P2 - Medium Priority
- [ ] Attendance late/overtime calculations refinement
- [ ] Bulk task operations
- [ ] Report generation
- [ ] Leave calendar integration
- [ ] Issue templates

## Technical Notes
- Vault encryption uses AES-256-GCM with auto-generated master key
- All MongoDB queries exclude `_id` to prevent serialization issues
- Calendar events linked to leave/task/milestone sources
- Automation templates pre-defined for common workflows

## Test User
- Username: `admin`
- Password: `Admin@123`
- Role: Super Admin

## API Endpoints
- Base URL: `/api`
- Auth: `/api/auth/*`
- HRM: `/api/hrm/*`
- PMS: `/api/pms/*`
- Vault: `/api/vault/*`
- Notifications: `/api/notifications/*`
- Issues: `/api/issues/*`
- Automation: `/api/automation/*`
- Calendar: `/api/calendar/*`
- Dashboard: `/api/dashboard/*`
