# Data Models (MongoDB / Mongoose)

## users
- _id: ObjectId
- employeeId: string (unique, required)
- name: string
- email: string (unique, required)
- designation: string
- departmentId: ObjectId (ref: departments)
- roles: string[] (enum: EMPLOYEE, DEPT_HEAD, HR_ADMIN, HR_SENIOR, CEO, SYS_ADMIN)
- status: string (active|inactive)
- createdAt, updatedAt

## departments
- _id: ObjectId
- name: string (unique)
- code: string (unique)
- headUserId: ObjectId (ref: users)
- approvalFlow?: string[]  // optional override, e.g. ["HR_ADMIN","DEPT_HEAD","HR_SENIOR","CEO"]
- createdAt, updatedAt

## leaves  (model: Leave, schema: LeaveSchema)
- See /docs/Form_Field_Map.md (full field list)
- createdAt, updatedAt (timestamps)

## policy_settings
- _id: ObjectId
- year: number
- weekendsCountAsLeave: boolean
- require5DayNoticeExceptML: boolean
- cl: { annualCap: number, consecutiveCap: number, lapsesEndOfYear: boolean }
- ml: { annualCap: number, certificateThresholdDays: number }
- el: { monthlyAccrual: number, maxCarry: number }
- quarantine: { standardCap: number, exceptionalCap: number, requireCertificate: boolean }
- paternity: { days: number, maxOccasions: number, minMonthsBetween: number }
- approvalsFlow: string[] // default flow
- createdBy: ObjectId (ref: users)
- createdAt, updatedAt

## audit_logs
- _id: ObjectId
- entity: string ("leave" | "user" | "policy" | ...)
- entityId: ObjectId
- action: string ("create"|"update"|"approve"|"reject"|"override"|"login"|"logout")
- actorId: ObjectId (ref: users)
- payload: object // diff or snapshot
- createdAt

## sessions (if you pick NextAuth/iron-session later)
- per library format; store session token/userId/expiry/etc.

Indexes (recommend):
- users: { email:1 }, { employeeId:1 }, { departmentId:1 }
- leaves: { 'employee.id':1, startDate:1 }, { status:1 }, { type:1 }, { createdAt:-1 }
- audit_logs: { entity:1, entityId:1, createdAt:-1 }
- policy_settings: { year:1 }
