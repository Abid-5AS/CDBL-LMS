# Non-Functional & Security

Security
- Private network only; session cookie: httpOnly, secure in prod; CSRF via per-route POST checks.
- Rate-limit auth & mutate endpoints.
- Input validation with Zod at API boundary.
- Least privilege DB user for app; separate admin user for ops.

Logging & Audit
- Every approval/reject/override -> `audit_logs`.
- Request ID per API; error logs include route + userId (no PII duplication).

Backups & Data Retention
- MongoDB nightly dumps (retain 30 days).
- File uploads stored on local server share with mirrored backup.

Performance
- Indexes as in `Data_Models.md`.
- Cursor-based pagination for listing leaves.

Ops
- Year-end jobs: CL lapse, EL carry, summary emails.
- Clock/timezone: Asia/Dhaka; all persisted as UTC ISO.
- Policy versioning: every leave stores `policyVersion`. Future changes remain auditable and do not retroactively alter decisions.
