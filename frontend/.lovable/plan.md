
# Nitro Finance — Implementation Plan

## Overview
A modern corporate expense and subscription management platform with a clean, professional UI. The system will include authentication, role-based access, expense tracking, validation workflows, and alerting — all connected to a FastAPI backend (with mock data support for development).

---

## Phase 1: Foundation & Authentication

### 1.1 Project Setup & Design System
- Configure Tailwind with the Nitro color palette (teal #1AB8B4, neutrals, status colors)
- Set up Inter font from Google Fonts
- Create base component styles (cards, buttons, inputs, badges, tables)
- Configure API service layer with mock data toggle

### 1.2 Authentication
- **Login Page**: Centered card with Nitro branding, email/password fields
- JWT token handling (localStorage + axios interceptors)
- Protected route wrapper that checks authentication
- Automatic redirect to login on 401 errors

### 1.3 App Layout
- **Sidebar**: Collapsible navigation with role-based menu items
- **Header**: User info, avatar, logout button
- **Content Area**: Gray background with proper spacing
- Responsive: Sidebar becomes drawer on mobile

---

## Phase 2: Core User Features

### 2.1 Dashboard
- **Metric Cards**: Total expenses, pending validations, unread alerts, active expenses
- **Recent Expenses**: Mini table showing last 5 entries
- **Recent Alerts**: List of latest alerts with status badges

### 2.2 Expenses Management
- **List View**: Filterable table (company, department, status)
- **Status Badges**: Color-coded (draft, in_review, active, cancelled, etc.)
- **Create/Edit Form**: Multi-section form with all expense fields
- **Actions**: View details, edit, request cancellation

### 2.3 Validations (Leaders & Admins)
- **Pending List**: Cards or table showing expenses awaiting validation
- **Month Filter**: Select validation period
- **Actions**: Approve/Reject buttons with confirmation
- **Empty State**: Friendly message when no validations pending

### 2.4 Alerts
- **Alert List**: Filterable by status (all, pending, read)
- **Alert Types**: Visual distinction by type (renewal, validation, overdue)
- **Mark as Read**: Single-click action with feedback

---

## Phase 3: Admin Features

### 3.1 Companies CRUD
- List with status and actions
- Create/Edit modal with name field

### 3.2 Departments CRUD
- List with company filter
- Create/Edit with company selection

### 3.3 Categories CRUD
- Simple name-based CRUD
- Status toggle (active/inactive)

### 3.4 Users Management
- User list with role badges and department info
- Create/Edit form with role selection and department multi-select
- Password field only on creation

---

## Technical Implementation

### API Layer
- **Mock Service**: Realistic fake data for standalone development
- **API Service**: Axios-based client with auth interceptors
- **Config Toggle**: Environment variable to switch between mock/real API
- React Query for caching, loading states, and error handling

### State Management
- Auth context for user session
- React Query for server state
- Local state for UI interactions

### Form Handling
- React Hook Form for form management
- Zod schemas for validation
- Consistent error display patterns

### UX Details
- Toast notifications for all actions
- Skeleton loaders during data fetching
- Loading spinners on buttons during actions
- Friendly error messages with retry options
- Empty states with helpful CTAs

---

## Deliverables Summary

| Page | Features |
|------|----------|
| Login | Email/password auth, JWT handling |
| Dashboard | 4 metric cards, recent expenses, recent alerts |
| Expenses | List, filters, CRUD, status management |
| Validations | Pending list, approve/reject workflow |
| Alerts | List, filter, mark as read |
| Companies | Admin CRUD |
| Departments | Admin CRUD with company filter |
| Categories | Admin CRUD |
| Users | Admin CRUD with role/department management |

The app will be fully responsive, with the sidebar becoming a drawer on mobile and tables transforming into card layouts.
