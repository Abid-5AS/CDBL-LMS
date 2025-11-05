# CDBL Leave Management System - Documentation Index

## 📚 Welcome to the Documentation

This is the master index for all documentation related to the CDBL Leave Management System. Use this page to navigate to the documentation you need.

**Last Updated**: Current  
**Documentation Version**: 1.0  
**Policy Version**: v1.1

---

## 🚀 Quick Start

### For New Developers
1. Start with [Project Goals](./01-Project-Goals.md) to understand the system's purpose
2. Read [Technical Documentation](./02-Technical-Documentation.md) for setup instructions
3. Review [Database Schema](./03-Database-Schema.md) to understand the data model
4. Check [System Functionality](./05-System-Functionality.md) for feature overview

### For HR Users
1. See [User Roles & Permissions](./04-User-Roles-and-Permissions.md) for role capabilities
2. Review [Flow Charts](./06-Flow-Charts.md) to understand workflows
3. Check [Policy Logic Reference](./Policy%20Logic/README.md) for policy rules

### For Managers
1. Review [Project Goals](./01-Project-Goals.md) for business objectives
2. See [Development Phases](./07-Development-Phases.md) for roadmap
3. Check [System Functionality](./05-System-Functionality.md) for features

---

## 📖 Core Documentation

### 1. [Project Goals & Objectives](./01-Project-Goals.md)
- Purpose and vision
- Business objectives
- Target users
- Success criteria
- Policy compliance requirements

### 2. [Technical Documentation](./02-Technical-Documentation.md)
- Technology stack
- Architecture overview
- Development environment setup
- Build and deployment
- Configuration details
- Performance and security

### 3. [Database Schema](./03-Database-Schema.md)
- Complete ER diagram (Mermaid)
- All 8 models with relationships
- 4 enums (Role, LeaveType, LeaveStatus, ApprovalDecision)
- Indexes and constraints
- Seed data structure

### 4. [User Roles & Permissions](./04-User-Roles-and-Permissions.md)
- Complete role hierarchy (5 roles)
- Permission matrix tables
- Role-based dashboards
- Access control implementation
- User personas and use cases

### 5. [System Functionality](./05-System-Functionality.md)
- Feature list organized by module (18 modules)
- 100+ individual features
- Implementation status
- Feature gaps and future plans

### 6. [Flow Charts](./06-Flow-Charts.md)
- Leave application flow
- Approval workflow state machine
- Authentication flow
- Balance calculation flow
- Policy validation flow
- 12 visual diagrams (Mermaid)

### 7. [Development Phases](./07-Development-Phases.md)
- Phase 1: MVP Core Features (✅ Completed)
- Phase 2: Enhanced Features (🚧 In Progress)
- Phase 3: Advanced Features (📋 Planned)
- Phase 4: Integration & Optimization (🔮 Future)
- Milestones and timeline

---

## 📋 Policy & Logic Documentation

### [Policy Logic Reference](./Policy%20Logic/README.md)

Comprehensive policy rules extracted from the codebase, organized into 12 detailed documents:

1. [Leave Types and Entitlements](./Policy%20Logic/01-Leave-Types-and-Entitlements.md)
2. [Leave Application Rules and Validation](./Policy%20Logic/02-Leave-Application-Rules-and-Validation.md)
3. [Holiday and Weekend Handling](./Policy%20Logic/03-Holiday-and-Weekend-Handling.md)
4. [Leave Balance and Accrual Logic](./Policy%20Logic/04-Leave-Balance-and-Accrual-Logic.md)
5. [File Upload and Medical Certificate Rules](./Policy%20Logic/05-File-Upload-and-Medical-Certificate-Rules.md)
6. [Approval Workflow and Chain](./Policy%20Logic/06-Approval-Workflow-and-Chain.md)
7. [Cancellation and Modification Rules](./Policy%20Logic/07-Cancellation-and-Modification-Rules.md)
8. [Date Time and Display Logic](./Policy%20Logic/08-Date-Time-and-Display-Logic.md)
9. [Role Based Behavior](./Policy%20Logic/09-Role-Based-Behavior.md)
10. [System Messages and Error Handling](./Policy%20Logic/10-System-Messages-and-Error-Handling.md)
11. [Miscellaneous Business Rules](./Policy%20Logic/11-Miscellaneous-Business-Rules.md)
12. [Source Mapping Index](./Policy%20Logic/12-Source-Mapping-Index.md)

---

## 🔌 API Documentation

### [API Contracts](./API/API_Contracts.md)

Complete API endpoint documentation:
- Authentication APIs (login, logout, me)
- Leave APIs (create, view, approve, reject, forward, cancel)
- Approval APIs
- Balance APIs
- Holiday APIs
- Employee APIs
- Dashboard APIs
- Admin APIs
- Compliance APIs

**Total Endpoints**: 30+ endpoints

---

## 📚 Reference Documentation

### Legacy & Reference Documents

Located in `docs/References/`:

- **[Data Models](./References/Data_Models.md)** - Updated database model reference
- **[RBAC](./References/RBAC.md)** - Updated roles & permissions reference
- **[Workflow Spec](./References/Workflow_Spec.md)** - Updated workflow state machine (4-step chain)
- **[Leave Policy CDBL](./References/LeavePolicy_CDBL.md)** - HR Policy manual summary
- **[Policy Implementation Map](./References/Policy_Implementation_Map.md)** - Policy clause mapping
- **[Form Field Map](./References/Form_Field_Map.md)** - Form field specifications
- **[Policy Settings](./References/Policy_Settings.md)** - Policy configuration
- **[Validation Rules](./References/Validation_Rules.md)** - Validation specifications
- **[NonFunctional](./References/NonFunctional.md)** - Non-functional requirements
- **[Test Plan](./References/TestPlan.md)** - Testing strategy
- **[Seed Data](./References/Seed_Data.md)** - Seed data documentation

---

## 📊 Documentation Statistics

### Core Documents
- **7 main documentation files**
- **12 policy logic documents**
- **30+ API endpoints documented**
- **8 database models**
- **5 user roles**
- **18 functional modules**
- **12 flow charts**

### Coverage
- ✅ Project goals and objectives
- ✅ Technical architecture
- ✅ Database schema (complete)
- ✅ User roles and permissions (complete)
- ✅ System functionality (complete)
- ✅ Policy rules (comprehensive)
- ✅ API contracts (complete)
- ✅ Workflow documentation (updated)
- ✅ Development roadmap

---

## 🔍 Finding Information

### By Topic

**Authentication & Security**
- [Technical Documentation](./02-Technical-Documentation.md) - Security section
- [API Contracts](./API/API_Contracts.md) - Authentication APIs
- [User Roles](./04-User-Roles-and-Permissions.md) - Access control

**Leave Management**
- [System Functionality](./05-System-Functionality.md) - Module 2
- [Policy Logic](./Policy%20Logic/README.md) - All 12 documents
- [Flow Charts](./06-Flow-Charts.md) - Application & approval flows

**Database**
- [Database Schema](./03-Database-Schema.md) - Complete schema
- [Data Models](./References/Data_Models.md) - Model reference

**API Development**
- [API Contracts](./API/API_Contracts.md) - Complete API reference
- [Technical Documentation](./02-Technical-Documentation.md) - Setup & architecture

**Policy & Business Rules**
- [Policy Logic Reference](./Policy%20Logic/README.md) - All policy rules
- [Policy Implementation Map](./References/Policy_Implementation_Map.md) - Policy mapping

---

## 🗺️ Documentation Map

```
docs/
├── README.md (this file)
├── 01-Project-Goals.md
├── 02-Technical-Documentation.md
├── 03-Database-Schema.md
├── 04-User-Roles-and-Permissions.md
├── 05-System-Functionality.md
├── 06-Flow-Charts.md
├── 07-Development-Phases.md
├── Policy Logic/
│   ├── README.md
│   ├── 01-Leave-Types-and-Entitlements.md
│   ├── 02-Leave-Application-Rules-and-Validation.md
│   ├── ... (12 total documents)
│   └── 12-Source-Mapping-Index.md
├── API/
│   └── API_Contracts.md
└── References/
    ├── Data_Models.md
    ├── RBAC.md
    ├── Workflow_Spec.md
    ├── LeavePolicy_CDBL.md
    └── ... (legacy documents)
```

---

## 🆕 What's New

### Latest Updates
- ✅ Complete database schema documentation with ER diagrams
- ✅ Updated API contracts (30+ endpoints)
- ✅ Updated workflow specification (4-step approval chain)
- ✅ Complete role matrix (5 roles)
- ✅ System functionality documentation (18 modules)
- ✅ Development phases and roadmap
- ✅ Master documentation index

### Recent Changes
- Updated all reference documentation to match current codebase
- Moved API documentation to `docs/API/` directory
- Organized legacy documents in `docs/References/`
- Created comprehensive flow charts (12 diagrams)
- Added complete permission matrices

---

## 🔗 External Resources

- **Project Repository**: See project root `README.md`
- **Demo Guide**: `README-DEMO.md` (project root)
- **Policy Manual**: [LeavePolicy_CDBL.md](./References/LeavePolicy_CDBL.md)

---

## 📝 Documentation Standards

### Version Information
All documents include version information at the bottom:
- Document version
- Last updated date
- Related documentation links

### Cross-References
Documents reference each other for related information:
- Related Documentation sections
- Links to code files where applicable
- Cross-references to policy documents

### Code Examples
- Code snippets from actual implementation
- File paths and line numbers where applicable
- Configuration examples

---

## 🤝 Contributing to Documentation

When updating documentation:

1. **Update Version**: Change version number and date
2. **Cross-Reference**: Add links to related documents
3. **Verify Accuracy**: Ensure documentation matches codebase
4. **Update Index**: Update this README if adding new documents

---

## 📞 Support

For questions about the documentation:
1. Check this index for the right document
2. Search within documents using Ctrl/Cmd+F
3. Review code files referenced in documents
4. Check source mapping in [Policy Logic - Source Mapping](./Policy%20Logic/12-Source-Mapping-Index.md)

---

## ✅ Documentation Completeness

### Completed ✅
- [x] Project goals and objectives
- [x] Technical documentation
- [x] Database schema (complete)
- [x] User roles and permissions
- [x] System functionality
- [x] Flow charts
- [x] Development phases
- [x] Policy logic (12 documents)
- [x] API contracts
- [x] Reference documentation (updated)

### Maintenance Needed
- [ ] Keep API contracts updated as endpoints change
- [ ] Update development phases as milestones complete
- [ ] Verify policy logic matches codebase after changes
- [ ] Update flow charts if workflows change

---

**Master Index Version**: 1.0  
**Last Updated**: Current  
**Total Documents**: 25+ documentation files  
**Maintained By**: Development Team

