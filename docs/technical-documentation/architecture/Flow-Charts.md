# CDBL Leave Management System - Flow Charts

**Version:** 2.0
**Last Updated:** January 2025
**Status:** Production Ready

This document contains visual flow charts for all major workflows in the system, using Mermaid diagrams. Version 2.0 includes updated authentication flow with 2-Factor Authentication (2FA).

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
    SUBMITTED --> PENDING: Auto (to first approver)
    PENDING --> PENDING: Forward in chain
    PENDING --> RETURNED: Approver returns for modification
    PENDING --> APPROVED: Final Approver Approves
    PENDING --> REJECTED: Final Approver or HR_ADMIN Rejects
    PENDING --> CANCELLED: Employee Cancels (non-approved only)
    SUBMITTED --> CANCELLED: Employee Cancels
    APPROVED --> CANCELLATION_REQUESTED: Employee Requests Cancellation
    CANCELLATION_REQUESTED --> CANCELLED: Admin Approves Cancellation
    CANCELLATION_REQUESTED --> APPROVED: Admin Denies Cancellation
    APPROVED --> RECALLED: Admin Recalls Employee
    APPROVED --> OVERSTAY_PENDING: End Date Passed, No Return
    RETURNED --> PENDING: Employee Resubmits
    APPROVED --> [*]
    REJECTED --> [*]
    CANCELLED --> [*]
    RECALLED --> [*]
    OVERSTAY_PENDING --> [*]

    note right of DRAFT
        Employee can edit
        or delete draft
    end note

    note right of PENDING
        DEFAULT chain: HR_ADMIN→DEPT_HEAD→HR_HEAD→CEO
        CASUAL chain: DEPT_HEAD only
        CEO is final approver for DEFAULT
        DEPT_HEAD is final approver for CASUAL
    end note

    note right of APPROVED
        Balance deducted
        Employee can request cancellation
        Admin can recall or cancel
    end note

    note right of CANCELLATION_REQUESTED
        Employee requested cancellation
        Awaits admin review
    end note
```

---

## 3. Approval Chain Flow

### DEFAULT Chain (EL, ML, and most leave types)

```mermaid
flowchart LR
    A[Employee Submits] --> B[Step 1: HR_ADMIN]
    B -->|Forward Only| C[Step 2: DEPT_HEAD]
    C -->|Forward Only| D[Step 3: HR_HEAD]
    D -->|Forward Only| E[Step 4: CEO]
    E -->|Approve/Reject| F[Final Decision]

    B -.->|Can Reject| G[REJECTED]

    style A fill:#e1f5ff
    style B fill:#fff4e1
    style C fill:#fff4e1
    style D fill:#fff4e1
    style E fill:#ffe1e1
    style F fill:#ccffcc
    style G fill:#ffcccc
```

**Notes:**
- Chain must be followed **sequentially** - no skipping steps
- HR_ADMIN, DEPT_HEAD, HR_HEAD can only **FORWARD** to next role or **RETURN** for modification
- Only **CEO** (final approver) can **APPROVE**
- HR_ADMIN can **REJECT** as operational role; other intermediate roles cannot
- CEO can reject at any step when forwarded to them

### CASUAL Leave Chain

```mermaid
flowchart LR
    A[Employee Submits] --> B[Step 1: DEPT_HEAD]
    B -->|Approve/Reject| C[Final Decision]

    style A fill:#e1f5ff
    style B fill:#ffe1e1
    style C fill:#e1ffe1
```

**Notes:**
- CASUAL leave uses **shortened chain** per Policy 6.10 exception
- DEPT_HEAD is the **final approver** for CASUAL leave
- HR_ADMIN is not in the CASUAL chain
- DEPT_HEAD can **APPROVE** or **REJECT** directly

---

## 4. Authentication Flow (with 2FA) ✨ Updated in v2.0

```mermaid
sequenceDiagram
    participant U as User
    participant C as Client
    participant A as API
    participant D as Database
    participant E as Email Service

    U->>C: Enter Email/Password
    C->>A: POST /api/login
    A->>D: Validate Credentials
    D-->>A: User Data

    alt Credentials Valid
        A->>A: Generate OTP Code (6-digit)
        A->>D: Store OTP (10 min expiry)
        A->>E: Send OTP Email
        E-->>U: Email with OTP Code
        A-->>C: {requiresOtp: true, userId}
        C->>C: Show OTP Input Form

        U->>C: Enter OTP Code
        C->>A: POST /api/auth/verify-otp
        A->>D: Verify OTP Code

        alt OTP Valid
            A->>D: Mark OTP as Verified
            A->>A: Generate JWT Token
            A-->>C: Set HTTP-only Cookies
            C->>C: Redirect to Dashboard
            C->>A: GET /api/auth/me
            A->>A: Verify JWT
            A-->>C: User Data
            C->>C: Update UI
        else OTP Invalid
            A-->>C: {error: "Invalid OTP"}
            C->>C: Show Error (3 attempts max)
        end

    else Credentials Invalid
        A-->>C: {error: "Invalid credentials"}
        C->>C: Show Error
    end
```

---

## 4a. 2FA OTP Verification Flow ✨ NEW in v2.0

```mermaid
flowchart TD
    A[User Enters Email/Password] --> B{Credentials Valid?}
    B -->|No| C[Error: Invalid Credentials]
    B -->|Yes| D[Generate 6-Digit OTP]
    D --> E[Store OTP in Database]
    E --> F[Set Expiry: Now + 10 min]
    F --> G[Send Email via SMTP]
    G --> H{Email Sent?}
    H -->|No| I[Error: Email Failed]
    H -->|Yes| J[Show OTP Input Form]

    J --> K[User Enters OTP]
    K --> L{OTP Exists?}
    L -->|No| M[Error: Invalid OTP]
    L -->|Yes| N{OTP Expired?}
    N -->|Yes| O[Error: OTP Expired]
    N -->|No| P{Code Matches?}
    P -->|No| Q{Attempts < 3?}
    Q -->|Yes| R[Increment Attempts]
    R --> M
    Q -->|No| S[Error: Max Attempts]
    P -->|Yes| T{Already Verified?}
    T -->|Yes| U[Error: OTP Already Used]
    T -->|No| V[Mark OTP as Verified]
    V --> W[Generate JWT Token]
    W --> X[Set HTTP-only Cookies]
    X --> Y[Redirect to Dashboard]

    J --> Z[Resend OTP Button]
    Z --> AA{Rate Limit OK?}
    AA -->|No| AB[Error: Too Many Requests]
    AA -->|Yes| AC{Last OTP > 60s ago?}
    AC -->|No| AD[Error: Wait 60 seconds]
    AC -->|Yes| D

    style C fill:#ffcccc
    style I fill:#ffcccc
    style M fill:#ffcccc
    style O fill:#ffcccc
    style S fill:#ffcccc
    style U fill:#ffcccc
    style AB fill:#ffcccc
    style AD fill:#ffcccc
    style Y fill:#ccffcc
```

**Key Features:**
- **OTP Generation**: 6-digit random code
- **Expiration**: 10-minute validity window
- **Attempt Limiting**: Maximum 3 verification attempts per code
- **Rate Limiting**: Maximum 3 OTP requests per hour
- **Resend Cooldown**: 60-second cooldown between resend requests
- **Single-Use**: OTP can only be verified once
- **IP Tracking**: IP address logged for security audit

**Security Measures:**
- Database-backed (not in-memory) for reliability
- Automatic expiry enforcement
- Brute force protection via attempt limiting
- Rate limiting to prevent spam
- IP address logging for audit trail
- Single-use verification to prevent replay attacks

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
    F -->|Yes| G{≥5 Working Days Notice?}
    G -->|No| H[Return Notice Error]
    G -->|Yes| I{Type = CASUAL?}
    F -->|No| I
    I -->|Yes| J{≤3 Consecutive?}
    J -->|No| K[Return Consecutive Error]
    J -->|Yes| L{Touches Holiday/Weekend?}
    L -->|Yes| M[Return Holiday Touch Error]
    L -->|No| N{Type = MEDICAL?}
    I -->|No| N
    N -->|Yes| O{>3 Days?}
    O -->|Yes| P{Certificate Provided?}
    P -->|No| Q[Return Certificate Error]
    P -->|Yes| R[Continue]
    O -->|No| R
    N -->|No| R
    R --> S{Backdated?}
    S -->|Yes| T{Backdate Allowed?}
    T -->|No| U[Return Backdate Error]
    T -->|Yes| V{Within Window?}
    V -->|No| W[Return Window Error]
    V -->|Yes| X[Continue]
    S -->|No| X
    X --> Y[Check Annual Caps]
    Y --> Z{Cap Exceeded?}
    Z -->|Yes| AA[Return Cap Error]
    Z -->|No| AB[Check Balance]
    AB --> AC[Validation Complete]
```

**Note:** Earned Leave requires **≥5 working days** notice per Policy 6.11 (not 15 days). Casual Leave and Quarantine Leave are exempt from advance notice requirements.

---

## 7. Cancellation Flow

### Employee Self-Cancellation

```mermaid
flowchart TD
    A[Employee Requests Cancel] --> B{Status Check}
    B -->|SUBMITTED/PENDING| C[Direct Cancel]
    C --> D[Update Status: CANCELLED]
    D --> E[Create Audit Log]
    E --> F[Cancel Complete - No balance change]

    B -->|APPROVED| G[Create Cancellation Request]
    G --> H[Update Status: CANCELLATION_REQUESTED]
    H --> I[Notify Admin]
    I --> J[Awaits Admin Review]

    B -->|REJECTED/CANCELLED| K[Error: Cannot Cancel]

    style F fill:#ccffcc
    style J fill:#fff4e1
    style K fill:#ffcccc
```

### Admin Cancellation/Review

```mermaid
flowchart TD
    A[Admin Reviews Request] --> B{Request Type}

    B -->|CANCELLATION_REQUESTED| C[Review Employee Request]
    B -->|Direct Admin Cancel| D[Cancel APPROVED Leave]

    C --> E{Admin Decision}
    E -->|Approve Cancel| F[Restore Balance]
    E -->|Deny Cancel| G[Keep Status APPROVED]

    D --> F

    F --> H[Update Status: CANCELLED]
    H --> I[Decrement Balance.used]
    I --> J[Create Audit Log]
    J --> K[Notify Employee]
    K --> L[Cancel Complete]

    G --> M[Notify Employee - Cancellation Denied]

    style L fill:#ccffcc
    style M fill:#fff4e1
```

**Notes:**
- **Employee can self-cancel** SUBMITTED/PENDING requests → direct CANCELLED (no balance change)
- **Employee cannot self-cancel** APPROVED requests → must create CANCELLATION_REQUESTED
- **Admin roles** (HR_ADMIN, HR_HEAD, CEO) can cancel any APPROVED leave with balance restoration
- **Balance restoration** decrements `Balance.used` and updates `Balance.closing`
- Policy 6.8 and 6.9 allow management to cancel/recall leave for service exigencies

---

## 8. File Upload Flow

```mermaid
flowchart TD
    A[User Selects File] --> B{File Type Valid?}
    B -->|No| C[Error: Unsupported Type]
    B -->|Yes| D{File Size OK?}
    D -->|No| E[Error: File Too Large]
    D -->|Yes| F[Validate MIME Type]
    F --> G{MIME Type OK?}
    G -->|No| H[Error: Invalid File Content]
    G -->|Yes| I[Generate UUID]
    I --> J[Sanitize Filename]
    J --> K[Save to private/uploads/]
    K --> L{Save Success?}
    L -->|No| M[Error: Upload Failed]
    L -->|Yes| N[Store Path in DB]
    N --> O[Generate Signed URL]
    O --> P[Return Signed URL - 15 min expiry]
    P --> Q[Upload Complete]

    style C fill:#ffcccc
    style E fill:#ffcccc
    style H fill:#ffcccc
    style M fill:#ffcccc
    style Q fill:#ccffcc
```

**Notes:**
- Files stored in **private/uploads/** (not web-accessible)
- **Signed URLs** generated with 15-minute expiry using HMAC signatures
- **MIME type validation** using file-type library (prevents spoofed extensions)
- **Download endpoint:** `GET /api/files/signed/[filename]` with signature verification
- **Max file size:** 5 MB
- **Allowed types:** PDF, JPG, JPEG, PNG

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

**Document Version**: 2.0
**Last Updated**: January 2025
**Total Flow Charts**: 13 diagrams (12 from v1.0 + 1 new 2FA/OTP flow)
**New in v2.0**: Updated Authentication Flow with 2FA, New OTP Verification Flow Chart

