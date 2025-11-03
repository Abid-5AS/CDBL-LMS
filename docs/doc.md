# Documentation Index - Updated Structure

> **Last Updated**: Current  
> **Documentation Version**: v1.0

This directory contains comprehensive documentation for the CDBL Leave Management System, organized into clear categories.

---

## 📚 Main Documentation (Start Here)

See **[README.md](./README.md)** for the complete master documentation index with navigation to all documents.

### Core Documents (Numbered 01-07)
1. **[Project Goals](./01-Project-Goals.md)** - Purpose, objectives, success criteria
2. **[Technical Documentation](./02-Technical-Documentation.md)** - Tech stack, setup, architecture
3. **[Database Schema](./03-Database-Schema.md)** - Complete database documentation with ER diagrams
4. **[User Roles & Permissions](./04-User-Roles-and-Permissions.md)** - Complete RBAC documentation (5 roles)
5. **[System Functionality](./05-System-Functionality.md)** - Feature list by module
6. **[Flow Charts](./06-Flow-Charts.md)** - Visual workflow diagrams
7. **[Development Phases](./07-Development-Phases.md)** - Development timeline

---

## 📋 Policy & Logic

**Location**: `Policy Logic/` directory

Comprehensive policy rules extraction (12 documents):
- Leave types, entitlements, accrual
- Application rules and validation
- Holiday and weekend handling
- Approval workflow (4-step chain)
- System messages and error handling
- [Complete Index](./Policy%20Logic/README.md)

---

## 🔌 API Documentation

**Location**: `API/` directory

- **[API Contracts](./API/API_Contracts.md)** - Complete API endpoint documentation (30+ endpoints)

---

## 📚 Reference Documentation

**Location**: `References/` directory

- **[Data Models](./References/Data_Models.md)** - Updated database models (8 models, 5 roles)
- **[RBAC](./References/RBAC.md)** - Updated roles & permissions (5 roles)
- **[Workflow Spec](./References/Workflow_Spec.md)** - Updated workflow state machine (4-step approval chain)

### Legacy Reference Files (Root docs/)
- `LeavePolicy_CDBL.md` - HR Policy manual summary
- `Policy_Implementation_Map.md` - Policy clause mapping (needs minor update for 5 roles)
- `Form_Field_Map.md` - Form field specifications
- `Policy_Settings.md` - Policy configuration
- `Validation_Rules.md` - Validation specifications
- `NonFunctional.md` - Non-functional requirements
- `TestPlan.md` - Testing strategy
- `Seed_Data.md` - Seed data documentation

---

## 🗂️ Documentation Organization

### New Structure (Recommended)
- **Core docs** (01-07): Main documentation files
- **API/**: API documentation
- **Policy Logic/**: Policy rules (12 documents)
- **References/**: Updated reference materials

### Migration Notes
- Old `API_Contracts.md` → Moved to `API/API_Contracts.md` (comprehensive update)
- Old `Data_Models.md` → Moved to `References/Data_Models.md` (updated with 5 roles)
- Old `RBAC.md` → Moved to `References/RBAC.md` (updated with 5 roles)
- Old `Workflow_Spec.md` → Moved to `References/Workflow_Spec.md` (updated with 4-step chain)

---

## ✅ Documentation Status

### Up to Date ✅
- All core documentation (01-07)
- API contracts
- Database schema
- User roles (5 roles)
- Workflow specification (4-step chain)
- Policy logic documentation

### Needs Minor Updates ⚠️
- `Policy_Implementation_Map.md` - Update role references from 2 to 5 roles
- `Form_Field_Map.md` - Verify field mappings match current implementation
- `Validation_Rules.md` - Review and ensure matches current validation logic

### Legacy/Reference (OK to Keep)
- `LeavePolicy_CDBL.md` - HR policy reference
- `Policy_Settings.md` - Settings reference
- `NonFunctional.md` - Requirements reference
- `TestPlan.md` - Testing reference
- `Seed_Data.md` - Seed data reference

---

## 🔗 Quick Links

- **Master Index**: [README.md](./README.md)
- **API Reference**: [API/API_Contracts.md](./API/API_Contracts.md)
- **Database Schema**: [03-Database-Schema.md](./03-Database-Schema.md)
- **User Roles**: [04-User-Roles-and-Permissions.md](./04-User-Roles-and-Permissions.md)
- **Policy Rules**: [Policy Logic/README.md](./Policy%20Logic/README.md)

---

**For the complete navigation and all documentation, see [README.md](./README.md)**
