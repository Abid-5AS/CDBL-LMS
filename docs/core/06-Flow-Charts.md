# CDBL Leave Management System - Flow Charts

This document contains visual flow charts for all major workflows in the system, using Mermaid diagrams.

---

## 1. Leave Application Flow

```mermaid
flowchart TD
    A[Employee Opens Form] --> B{Select Leave Type}
    B --> C[Enter Date Range]
    C --> D{Date Validation}
    D -->|Invalid| E[Show Error]
    E --> C
    D -->|Valid| F[Enter Reason]
    F --> G{Reason Valid?}
    G -->|No| H[Show Error]
    H --> F
    G -->|Yes| I{Type = MEDICAL > 3 days?}
    I -->|Yes| J[Upload Certificate]
    I -->|No| K[Check Balance]
    J --> L{File Valid?}
    L -->|No| M[Show Error]
    M --> J
    L -->|Yes| K
    K --> N{Balance Available?}
    N -->|No| O[Show Error]
    O --> C
    N -->|Yes| P{Policy Validations}
    P -->|Fail| Q[Show Policy Error]
    Q --> C
    P -->|Pass| R{Has Warnings?}
    R -->|Yes| S[Show Warnings]
    S --> T[User Confirms]
    T --> U[Submit Request]
    R -->|No| U
    U --> V[API Validation]
    V --> W{Validation Pass?}
    W -->|No| X[Return Error]
    X --> C
    W -->|Yes| Y[Create LeaveRequest]
    Y --> Z[Status: SUBMITTED]
    Z --> AA[Redirect to My Leaves]
```

---

## 2. Approval Workflow State Machine

```mermaid
stateDiagram-v2
    [*] --> DRAFT: Employee Creates
    DRAFT --> SUBMITTED: Employee Submits
    SUBMITTED --> PENDING: Auto (to HR_ADMIN)
    PENDING --> PENDING: HR_ADMIN Forwards to DEPT_HEAD
    PENDING --> PENDING: DEPT_HEAD Forwards to HR_HEAD
    PENDING --> PENDING: HR_HEAD Forwards to CEO
    PENDING --> APPROVED: HR_HEAD or CEO Approves
    PENDING --> REJECTED: HR_HEAD or CEO Rejects
    PENDING --> CANCELLED: Employee Cancels
    APPROVED --> [*]
    REJECTED --> [*]
    CANCELLED --> [*]
    
    note right of DRAFT
        Employee can edit
        or delete draft
    end note
    
    note right of PENDING
        Multiple approval steps
        can occur in sequence
    end note
```

---

## 3. Approval Chain Flow

```mermaid
flowchart LR
    A[Employee Submits] --> B[HR_ADMIN]
    B -->|Forward| C[DEPT_HEAD]
    B -->|Forward| D[HR_HEAD]
    B -->|Forward| E[CEO]
    C -->|Forward| D
    C -->|Forward| E
    D -->|Approve/Reject| F[Final Decision]
    D -->|Forward| E
    E -->|Approve/Reject| F
    
    style A fill:#e1f5ff
    style B fill:#fff4e1
    style C fill:#fff4e1
    style D fill:#ffe1e1
    style E fill:#ffe1e1
    style F fill:#e1ffe1
```

---

## 4. Authentication Flow

```mermaid
sequenceDiagram
    participant U as User
    participant C as Client
    participant A as API
    participant D as Database
    
    U->>C: Enter Email/Password
    C->>A: POST /api/login
    A->>D: Validate Credentials
    D-->>A: User Data
    A->>A: Generate JWT
    A-->>C: Set HTTP-only Cookies
    C->>C: Store User Info in Cookies
    C->>C: Redirect to Dashboard
    C->>A: GET /api/auth/me (validate)
    A->>A: Verify JWT
    A-->>C: User Data
    C->>C: Update UI
```

---

## 5. Balance Calculation Flow

```mermaid
flowchart TD
    A[Leave Request Submitted] --> B{Leave Type}
    B -->|EL| C[Get EL Balance]
    B -->|CL| D[Get CL Balance]
    B -->|ML| E[Get ML Balance]
    
    C --> F{Balance Available?}
    D --> G{Annual Cap OK?}
    E --> H{Annual Cap OK?}
    
    F -->|No| I[Error: Insufficient Balance]
    F -->|Yes| J{Carry Cap OK?}
    J -->|No| K[Error: Carry Cap Exceeded]
    J -->|Yes| L[Allow Request]
    
    G -->|No| M[Error: Annual Cap Exceeded]
    G -->|Yes| N{Consecutive Limit OK?}
    N -->|No| O[Error: Consecutive Limit]
    N -->|Yes| L
    
    H -->|No| P[Error: Annual Cap Exceeded]
    H -->|Yes| L
    
    L --> Q[Create LeaveRequest]
    Q --> R[Status: SUBMITTED]
    
    style I fill:#ffcccc
    style K fill:#ffcccc
    style M fill:#ffcccc
    style O fill:#ffcccc
    style P fill:#ffcccc
    style L fill:#ccffcc
```

---

## 6. Policy Validation Flow

```mermaid
flowchart TD
    A[Leave Request Data] --> B[Schema Validation]
    B -->|Fail| C[Return Schema Error]
    B -->|Pass| D{Date Validation}
    D -->|Invalid| E[Return Date Error]
    D -->|Valid| F{Type = EARNED?}
    F -->|Yes| G{15 Days Notice?}
    G -->|No| H[Return Notice Error]
    G -->|Yes| I{Type = CASUAL?}
    F -->|No| I
    I -->|Yes| J{≤3 Consecutive?}
    J -->|No| K[Return Consecutive Error]
    J -->|Yes| L{Type = MEDICAL?}
    I -->|No| L
    L -->|Yes| M{>3 Days?}
    M -->|Yes| N{Certificate Provided?}
    N -->|No| O[Return Certificate Error]
    N -->|Yes| P[Continue]
    M -->|No| P
    L -->|No| P
    P --> Q{Backdated?}
    Q -->|Yes| R{Backdate Allowed?}
    R -->|No| S[Return Backdate Error]
    R -->|Yes| T{Within Window?}
    T -->|No| U[Return Window Error]
    T -->|Yes| V[Continue]
    Q -->|No| V
    V --> W[Check Annual Caps]
    W --> X{Cap Exceeded?}
    X -->|Yes| Y[Return Cap Error]
    X -->|No| Z[Check Balance]
    Z --> AA[Validation Complete]
```

---

## 7. Cancellation Flow

```mermaid
flowchart TD
    A[Employee Requests Cancel] --> B{Status Check}
    B -->|Not PENDING/SUBMITTED| C[Error: Cannot Cancel]
    B -->|PENDING/SUBMITTED| D{Was Approved?}
    D -->|Yes| E[Restore Balance]
    E --> F[Update Status: CANCELLED]
    D -->|No| F
    F --> G[Create Audit Log]
    G --> H[Notify Approvers]
    H --> I[Cancel Complete]
    
    style C fill:#ffcccc
    style I fill:#ccffcc
```

---

## 8. File Upload Flow

```mermaid
flowchart TD
    A[User Selects File] --> B{File Type Valid?}
    B -->|No| C[Error: Unsupported Type]
    B -->|Yes| D{File Size OK?}
    D -->|No| E[Error: File Too Large]
    D -->|Yes| F[Generate UUID]
    F --> G[Sanitize Filename]
    G --> H[Save to public/uploads/]
    H --> I{Save Success?}
    I -->|No| J[Error: Upload Failed]
    I -->|Yes| K[Store URL in DB]
    K --> L[Upload Complete]
    
    style C fill:#ffcccc
    style E fill:#ffcccc
    style J fill:#ffcccc
    style L fill:#ccffcc
```

---

## 9. Error Handling Flow

```mermaid
flowchart TD
    A[API Request] --> B{Authentication?}
    B -->|No| C[401 Unauthorized]
    B -->|Yes| D{Authorization?}
    D -->|No| E[403 Forbidden]
    D -->|Yes| F[Execute Business Logic]
    F --> G{Validation Error?}
    G -->|Yes| H[400 Bad Request]
    H --> I[Return Error Details]
    G -->|No| J{Business Rule Error?}
    J -->|Yes| H
    J -->|No| K{Resource Found?}
    K -->|No| L[404 Not Found]
    K -->|Yes| M{Server Error?}
    M -->|Yes| N[500 Server Error]
    M -->|No| O[200 Success]
    O --> P[Return Data]
    
    style C fill:#ffcccc
    style E fill:#ffcccc
    style H fill:#ffcccc
    style L fill:#ffcccc
    style N fill:#ffcccc
    style P fill:#ccffcc
```

---

## 10. Date Validation Flow

```mermaid
flowchart TD
    A[User Selects Dates] --> B{Start ≤ End?}
    B -->|No| C[Error: Invalid Range]
    B -->|Yes| D{Start = Weekend/Holiday?}
    D -->|Yes| E[Error: Cannot Start on Non-Working Day]
    D -->|No| F{End = Weekend/Holiday?}
    F -->|Yes| G[Error: Cannot End on Non-Working Day]
    F -->|No| H{Type = CASUAL?}
    H -->|Yes| I{Touches Holiday/Weekend?}
    I -->|Yes| J[Error: CL Cannot Touch Holiday]
    I -->|No| K[Calculate Working Days]
    H -->|No| K
    K --> L{Days > 0?}
    L -->|No| M[Error: Invalid Range]
    L -->|Yes| N[Check Policy Rules]
    N --> O[Validation Complete]
    
    style C fill:#ffcccc
    style E fill:#ffcccc
    style G fill:#ffcccc
    style J fill:#ffcccc
    style M fill:#ffcccc
    style O fill:#ccffcc
```

---

## 11. Holiday Detection Flow

```mermaid
flowchart TD
    A[Date Check] --> B{Is Weekend?}
    B -->|Yes| C[Non-Working Day]
    B -->|No| D{Query Holiday Table}
    D --> E{Holiday Found?}
    E -->|Yes| C
    E -->|No| F[Working Day]
    
    C --> G{Used for Leave?}
    G -->|Yes| H[Counts Toward Balance]
    G -->|No| I[Blocks Start/End Date]
    
    style C fill:#fff4e1
    style F fill:#e1ffe1
    style H fill:#e1f5ff
    style I fill:#ffcccc
```

---

## 12. Role-Based Access Flow

```mermaid
flowchart TD
    A[User Action] --> B{Authenticated?}
    B -->|No| C[Redirect to Login]
    B -->|Yes| D{Check Role}
    D --> E{Has Permission?}
    E -->|No| F[403 Forbidden]
    E -->|Yes| G{Resource Owner?}
    G -->|No| H{Can View Resource?}
    H -->|No| F
    H -->|Yes| I[Allow Action]
    G -->|Yes| I
    I --> J[Execute Action]
    
    style C fill:#ffcccc
    style F fill:#ffcccc
    style I fill:#ccffcc
```

---

## Related Documentation

- **Approval Workflow**: [Policy Logic - Approval Workflow](./Policy%20Logic/06-Approval-Workflow-and-Chain.md)
- **Leave Application**: [Policy Logic - Application Rules](./Policy%20Logic/02-Leave-Application-Rules-and-Validation.md)
- **System Functionality**: [System Functionality](./05-System-Functionality.md)

---

**Document Version**: 1.0  
**Last Updated**: Current  
**Total Flow Charts**: 12 diagrams

