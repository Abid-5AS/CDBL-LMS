Form Label	UI Control	DB Field (type)	Example	Validation / Notes
Name	Read-only (from profile)	employee.name (string)	“Md. Arif Hossain”	Pulled from Users collection
Designation	Read-only	employee.designation (string)	“Assistant Manager”	—
Department	Read-only	employee.departmentId (ObjectId)	ref departments	For routing
Leave requested for (No. of days)	Auto	days (number)	4	Calculated as inclusive calendar days
Leave Period	Date range	startDate/endDate (Date)	2025-07-14 → 2025-07-17	Start ≤ End
Contact Address	Textarea	contactAddress (string)	“House# 22/A…”	Optional
Telephone No.	Text	contactPhone (string)	“017…”	Optional (pattern)
Reason for Leave	Textarea	reason (string)	“Surgery for sister”	Required
Substitute Employee	User search	substitute (ObjectId)	ref users	Optional
Substitute Signature	N/A	(implicitly digital)	—	Omitted
Leave Date (substitute row)	Date	substituteFrom/substituteTo (Date)	—	Optional
HR Use: Type of Leave	Select	type (enum)	EL, CL, ML, …	Required
Due / Availed / Balance	Read-only chips	balance (computed)	—	Not stored; computed snapshot kept in balanceSnapshot?: { el, cl, ml }
Attachments	Uploader	attachments[]	files	Required when ML>3, Quarantine
Medical certificate flag	Checkbox (auto when rule hits)	medicalCertificate (boolean)	true	Auto-set
Status/Approvals	System	status (enum: draft/pending/approved/rejected/cancelled)	pending	—
Workflow trail	System	approvals[]	see below	Tracks each step
Audit	System	createdBy, createdAt, updatedAt	—	Auto

LeaveSchema (suggested fields aligned to above)

{
  employee: {
    id: ObjectId, // ref: users
    name: String,
    designation: String,
    departmentId: ObjectId // ref: departments
  },
  type: { type: String, enum: ['EL','CL','ML','EOL_WP','EOL_WOP','MAT','PAT','STUDY','DISABILITY','QUAR'] },
  startDate: Date,
  endDate: Date,
  days: Number, // inclusive calendar-day count
  reason: String,
  contactAddress: String,
  contactPhone: String,
  substitute: ObjectId, // ref users
  substituteFrom: Date,
  substituteTo: Date,

  // Compliance knobs
  medicalCertificate: { type: Boolean, default: false },
  quarantineCertificate: { type: Boolean, default: false },

  // Snapshot of balances at time of submit (for audit)
  balanceSnapshot: {
    el: Number, cl: Number, ml: Number
  },

  // Workflow
  status: { type: String, enum: ['draft','pending','approved','rejected','cancelled'], default: 'pending' },
  approvals: [{
    role: { type: String, enum: ['HR_ADMIN','DEPT_HEAD','HR_SENIOR','CEO'] },
    userId: ObjectId, // ref users
    action: { type: String, enum: ['approved','rejected','returned'] },
    note: String,
    actedAt: Date
  }],

  attachments: [{
    kind: { type: String, enum: ['MEDICAL_CERT','PRESCRIPTION','QUARANTINE_CERT','OTHER'] },
    url: String,
    fileName: String
  }],

  // Overstay / return-to-duty
  actualReturnDate: Date,
  overstay: { type: Boolean, default: false },

  createdBy: ObjectId,
  createdAt: Date,
  updatedAt: Date
}

Validation Rules (UI + API)
	•	type required; startDate/endDate required.
	•	days = (endDate - startDate) + 1 (calendar).
	•	CL: days <= 3 AND sumYear(CL) + days <= 10.
	•	ML: sumYear(ML) + days <= 14 AND if days > 3 ⇒ attachments must include MEDICAL_CERT (and prescription).
	•	EL: elBalance >= days.
	•	Quarantine: attachments must include QUARANTINE_CERT; days <= 21 (≤30 with HR_SENIOR override).
	•	Submission lead time: if type !== ML and startDate < today + 5 working days ⇒ block (HR override flag available).
