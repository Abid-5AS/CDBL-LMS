# CDBL Leave Management System - Project Goals & Objectives

## Purpose & Vision

The CDBL Leave Management System is a comprehensive web-based application designed to digitize and automate the leave management process for Central Depository Bangladesh Limited (CDBL). The system aims to replace manual, paper-based leave request workflows with a modern, efficient, and compliant digital solution.

### Vision Statement

To provide a streamlined, transparent, and policy-compliant leave management platform that enhances employee experience while ensuring accurate tracking, proper approvals, and audit compliance.

---

## Business Objectives

### Primary Objectives

1. **Digital Transformation**

   - Eliminate paper-based leave applications
   - Reduce manual processing time and errors
   - Enable real-time leave status tracking
   - Provide self-service capabilities for employees

2. **Policy Compliance**

   - Enforce CDBL HR Leave Policy (v1.1) automatically
   - Ensure consistent application of leave rules across the organization
   - Maintain audit trails for all leave transactions
   - Track policy versioning for historical compliance

3. **Operational Efficiency**

   - Reduce HR administrative burden
   - Automate approval workflows with multi-level authorization
   - Streamline leave balance calculations and accruals
   - Enable proactive leave planning and management

4. **Data Accuracy & Reporting**

   - Maintain accurate leave balances per employee
   - Generate comprehensive leave analytics and reports
   - Support data-driven decision making for HR
   - Enable compliance reporting and audits

5. **User Experience**
   - Provide intuitive, accessible interface for all user roles
   - Enable mobile-responsive access
   - Offer clear visibility into leave balances and history
   - Support offline/companion app capabilities (future)

---

## Target Users

### Primary User Groups

#### 1. Employees

- **Role**: `EMPLOYEE`
- **Needs**:
  - Easy leave application process
  - Real-time visibility of leave balances
  - Transparent approval status tracking
  - Access to leave history and policies
- **Estimated**: Majority of system users (all CDBL employees)

#### 2. Department Heads / Managers

- **Role**: `DEPT_HEAD`
- **Needs**:
  - Team leave oversight
  - Forward leave requests for approval
  - View team member leave history
  - Department-level analytics
- **Estimated**: 20-30 department heads/managers

#### 3. HR Administrators

- **Role**: `HR_ADMIN`
- **Needs**:
  - Complete leave request management
  - Employee data management
  - Holiday calendar management
  - Approval workflow control
  - Audit log access
- **Estimated**: 3-5 HR staff members

#### 4. HR Head

- **Role**: `HR_HEAD`
- **Needs**:
  - Final approval authority
  - Organization-wide leave analytics
  - Policy compliance monitoring
  - Strategic oversight
- **Estimated**: 1-2 senior HR executives

#### 5. Chief Executive Officer / Managing Director

- **Role**: `CEO`
- **Needs**:
  - Executive dashboard with KPIs
  - Organization-wide analytics
  - Final approval for sensitive cases
  - Strategic insights
- **Estimated**: 1 executive user

---

## Success Criteria

### Quantitative Metrics

1. **Adoption Rate**

   - 100% employee adoption within 3 months
   - All leave requests processed through system (0% manual)
   - 95%+ user satisfaction rating

2. **Efficiency Gains**

   - 70% reduction in HR processing time per leave request
   - 80% reduction in leave-related queries to HR
   - 50% reduction in leave balance calculation errors

3. **System Performance**

   - <2 second average page load time
   - 99.5% uptime availability
   - Zero data loss incidents
   - <0.1% error rate in leave calculations

4. **Policy Compliance**
   - 100% enforcement of leave policy rules
   - Zero unauthorized leave approvals
   - Complete audit trail for all transactions
   - 100% accuracy in leave balance tracking

### Qualitative Metrics

1. **User Satisfaction**

   - Positive feedback from all user roles
   - Reduced friction in leave application process
   - Improved transparency and trust
   - Enhanced employee experience

2. **HR Department Impact**

   - Reduced administrative burden
   - Improved strategic focus on HR activities
   - Better data for decision making
   - Streamlined compliance reporting

3. **Management Benefits**
   - Real-time visibility into organization leave patterns
   - Data-driven insights for resource planning
   - Improved policy adherence
   - Enhanced audit readiness

---

## Policy Compliance Requirements

### CDBL HR Policy Adherence

The system must strictly enforce the CDBL Leave Policy as documented in the HR Policy & Procedures Manual (pages 32-41), including:

1. **Leave Type Rules**

   - Earned Leave (EL): 20 days/year, 2 days/month accrual, 60-day carry-forward limit
   - Casual Leave (CL): 10 days/year, max 3 consecutive days, no carry-forward
   - Medical Leave (ML): 14 days/year, certificate required for >3 days

2. **Application Requirements**

   - 15 days advance notice for Earned Leave (hard requirement)
   - 5 days advance notice for Casual Leave (soft warning)
   - Medical leave same-day submission allowed
   - Medical certificate mandatory for ML >3 days

3. **Approval Workflow**

   - Multi-level approval chain: HR_ADMIN → DEPT_HEAD → HR_HEAD → CEO
   - Sequential approval steps (no skipping)
   - Audit trail for all decisions

4. **Balance Management**

   - Accurate accrual tracking (EL: 2 days/month)
   - Carry-forward enforcement (EL: 60 days max)
   - Annual cap enforcement (CL: 10 days, ML: 14 days)
   - Real-time balance calculations

5. **Date & Holiday Rules**

   - Weekends (Fri/Sat) and holidays count toward leave
   - Start/end dates cannot be weekends or holidays
   - Casual leave cannot touch holidays/weekends

6. **Backdating Rules**
   - EL/ML: Allowed up to 30 days (configurable)
   - CL: Not allowed (hard block)
   - Organization settings control backdate permissions

### Regulatory Compliance

- **Data Privacy**: Secure handling of employee personal data
- **Audit Requirements**: Complete audit logs for compliance reviews
- **Access Control**: Role-based access with principle of least privilege
- **Data Retention**: Appropriate retention policies for leave records

---

## Scope Boundaries

### In Scope (Current Version)

- Core leave application and approval workflow
- Leave balance tracking and management
- Holiday calendar management
- Employee profile management
- Multi-role dashboard and analytics
- Audit logging and compliance
- Policy enforcement engine

### Out of Scope (Future Phases)

- Payroll integration (manual processing)
- Email notifications (planned)
- Mobile native apps (companion app separate)
- Advanced reporting dashboards (basic included)
- Leave encashment processing (manual)
- Integration with attendance systems
- Multi-organization support

---

## Project Constraints

### Technical Constraints

- Must run on existing CDBL infrastructure
- MySQL database compatibility requirement
- Next.js 16+ framework requirement
- Browser compatibility (modern browsers)
- Network access restrictions (internal network)

### Business Constraints

- Must comply with CDBL HR Policy without modification
- Cannot change approval hierarchy without policy update
- Must maintain audit trails for compliance
- Limited customization of leave types (policy-defined)

### Resource Constraints

- Development timeline: MVP completed, enhancements ongoing
- Limited HR training time allocation
- Phased rollout to minimize disruption

---

## Success Indicators

### Immediate (0-3 months)

- ✅ System deployed and accessible
- ✅ All employees onboarded
- ✅ 80%+ leave requests processed through system
- ✅ Zero critical policy violations

### Short-term (3-6 months)

- ✅ 100% adoption rate
- ✅ Measurable efficiency gains
- ✅ Positive user feedback
- ✅ Reduced HR processing time

### Long-term (6-12 months)

- ✅ Full ROI realization
- ✅ Enhanced analytics adoption
- ✅ Policy compliance excellence
- ✅ Foundation for future enhancements

---

## Related Documentation

- **Policy Reference**: [Leave Policy Logic Reference](./Policy%20Logic/README.md)
- **Technical Details**: [Technical Documentation](./02-Technical-Documentation.md)
- **User Guide**: [User Roles & Permissions](./04-User-Roles-and-Permissions.md)
- **HR Policy Manual**: [LeavePolicy_CDBL.md](./References/LeavePolicy_CDBL.md)

---

**Document Version**: 1.0  
**Last Updated**: Current  
**Next Review**: Quarterly
