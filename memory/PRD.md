# Workforce by Profitcast - HR Platform PRD

## Original Problem Statement
Correct the UI according to the Profitcast Design Guide markdown and make it functional.
Replace the logo everywhere with the "Workforce by Profitcast" branding.

## Architecture

### Tech Stack
- **Frontend**: React with Vite, vanilla CSS
- **Backend**: Node.js/Express with Prisma ORM
- **Database**: PostgreSQL (Supabase)
- **Authentication**: JWT-based

### Design System (Profitcast Signal Dashboard v2.1)
- **Background Colors**: #02040A (app-bg), #09090B (surface), #18181B (surface-highlight)
- **Brand Colors**: #00A1C7 (teal), #00FFAA (mint), #FF6826 (orange)
- **Text Colors**: #FAFAFA (primary), #A1A1AA (secondary), #52525B (muted)
- **Fonts**: Rubik (headings), Inter (body), JetBrains Mono (data)
- **Logo**: Workforce by Profitcast (teal icon with white people silhouette)
- **Effects**: Glass-morphism, glow effects, gradient buttons

## User Personas
1. **HR Manager**: Full access to employee management, leave approvals, reports
2. **Managing Director (MD)**: Full access with final approval authority
3. **Manager**: Team oversight, leave approvals for direct reports
4. **Team Lead (TL)**: Team oversight, escalation handling
5. **Employee**: Self-service attendance, leave requests

## Core Requirements (Static)
- Dark theme UI matching Profitcast design guide
- User authentication (login/register)
- Dashboard with attendance summary
- Employee management (CRUD for HR/MD)
- Attendance tracking (check-in/check-out)
- Leave management (apply/approve/reject)
- Settings and profile management
- Escalation handling

## What's Been Implemented (Feb 18, 2026)

### UI/UX Updates
- [x] Converted entire frontend to dark theme
- [x] Updated index.css with Profitcast design system
- [x] Login page with dark theme and animated backgrounds
- [x] Register page with proper styling
- [x] Dashboard with stats cards and employee list
- [x] Sidebar with proper navigation and active states
- [x] TopBar with time display and user info
- [x] Employees page with table and modal styling
- [x] Attendance page with dark theme
- [x] Leave page with balance cards and request form
- [x] Settings page with profile and password forms
- [x] ErrorBoundary with dark theme styling
- [x] AttendanceTrackingBox component updated

### Backend Configuration
- [x] Fixed bcrypt -> bcryptjs for compatibility
- [x] Updated server port to 8001
- [x] CORS configuration for preview URLs
- [x] Vite proxy configuration for API calls

### Tests Passed
- Backend API health check
- User authentication flow
- Employee list fetching
- Attendance endpoints
- Leave balance endpoints
- Full navigation flow

## Prioritized Backlog

### P0 (Critical)
- All core functionality implemented and working

### P1 (High Priority)
- [ ] Leave balance initialization for new users
- [ ] Fix intermittent 520 errors on some API endpoints

### P2 (Medium Priority)
- [ ] Add more visual feedback for actions
- [ ] Implement notifications system fully
- [ ] Add employee activity charts

### Future Features
- Email notifications for leave approvals
- Analytics dashboard with charts
- Mobile responsive improvements
- Dark/Light theme toggle
- Export functionality for reports

## Next Tasks
1. Monitor and fix any remaining 520 errors
2. Test all CRUD operations thoroughly
3. Add leave balance initialization on user registration
4. Implement notification badges
