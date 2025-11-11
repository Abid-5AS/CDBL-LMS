# CDBL Leave Management System - Technical Documentation

**Version:** 2.0
**Last Updated:** January 2025
**Project Status:** Production Ready
**Organization:** CDBL (Central Depository Bangladesh Limited)

---

## Document Index

This folder contains comprehensive technical documentation for the CDBL Leave Management System (LMS), a production-grade enterprise application designed for large-scale deployment.

### Core Documentation

| Document | Description | Audience |
|----------|-------------|----------|
| [01-Project-Goals.md](./01-Project-Goals.md) | Executive summary, business objectives, and success metrics | Management, Stakeholders |
| [02-Technical-Documentation.md](./02-Technical-Documentation.md) | Complete technical architecture and implementation details | Developers, Architects |
| [03-Database-Schema.md](./03-Database-Schema.md) | Database design, ERD, and data models | Database Admins, Backend Developers |
| [04-User-Roles-and-Permissions.md](./04-User-Roles-and-Permissions.md) | RBAC implementation and permission matrix | Security Team, Developers |
| [05-System-Functionality.md](./05-System-Functionality.md) | Feature specifications and user workflows | Product Managers, QA |
| [06-Flow-Charts.md](./06-Flow-Charts.md) | Process flows and approval workflows | All Teams |
| [07-Development-Phases.md](./07-Development-Phases.md) | Project timeline, milestones, and deliverables | Project Managers |

### Specialized Documentation

| Document | Description | Audience |
|----------|-------------|----------|
| [API-Documentation.md](./api/API-Documentation.md) | RESTful API endpoints and specifications | Frontend/Backend Developers |
| [2FA-Setup-Guide.md](./deployment/2FA-Setup-Guide.md) | Two-factor authentication configuration | DevOps, System Admins |
| [UI-UX-Enhancements.md](./ui-ux/UI-UX-Enhancements.md) | Design system and UX improvements | Designers, Frontend Developers |
| [Testing-Strategy.md](./testing/Testing-Strategy.md) | QA procedures and test cases | QA Engineers |
| [Release-Notes.md](./releases/Release-Notes.md) | Version history and changelog | All Teams |
| [Deployment-Guide.md](./deployment/Deployment-Guide.md) | Production deployment procedures | DevOps Engineers |

---

## Quick Start for Developers

```bash
# Clone repository
git clone <repository-url>

# Install dependencies
pnpm install

# Set up environment
cp .env.example .env

# Run database migrations
npx prisma migrate dev

# Start development server
pnpm dev
```

---

## Technology Stack

- **Frontend:** Next.js 16 (App Router), React 19, TypeScript 5.9
- **Backend:** Next.js API Routes, Prisma ORM
- **Database:** MySQL 8.0+
- **Authentication:** JWT with HTTP-only cookies, 2FA via email
- **UI Framework:** Tailwind CSS 4.x, shadcn/ui, Framer Motion
- **State Management:** SWR for server state, Zustand for client state

---

## Key Features

✅ **Multi-Role Access Control** - 6 distinct user roles with granular permissions
✅ **Advanced Leave Management** - 10+ leave types with policy enforcement
✅ **Multi-Step Approval Workflow** - Configurable approval chains
✅ **Two-Factor Authentication** - Email-based OTP security
✅ **Real-Time Balance Tracking** - Accrual and balance calculations
✅ **Comprehensive Reporting** - Analytics and audit trails
✅ **Mobile Responsive** - Optimized for all screen sizes
✅ **Dark Mode Support** - System-wide theme switching

---

## Recent Enhancements (v2.0)

### Employee Dashboard UX Overhaul
- ✅ Fixed Balance Page with detailed API integration
- ✅ Added Balance navigation link
- ✅ Enhanced Apply Leave form with complete balance visibility
- ✅ Implemented Next Scheduled Leave KPI
- ✅ Created proactive Action Center with 4 alert types
- ✅ Added approval stage tracking to Pending Requests

### UI/UX Improvements
- ✅ Removed redundant cards from My Leaves page
- ✅ Fixed navbar text wrapping issues
- ✅ Corrected Upcoming Holidays display logic
- ✅ Simplified Company Holidays navigation and filters

### Security Enhancements
- ✅ Implemented 2FA with email OTP (6-digit, 10-min expiry)
- ✅ Added IP tracking for authentication attempts
- ✅ Enhanced audit logging for security events

---

## Support & Contact

For technical questions or issues:
- **Email:** tech-support@cdbl.com
- **Internal Ticket System:** [JIRA Link]
- **Documentation Issues:** Create a GitHub issue

---

## License & Confidentiality

This documentation is proprietary and confidential. Unauthorized distribution is prohibited.

**© 2025 Central Depository Bangladesh Limited. All Rights Reserved.**
