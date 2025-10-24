# Seed Data (Dev only)

`policy_settings`: default for current year.  
`departments`: `{ _id, name: "Application Dev & VAS", code: "AD-VAS", headUserId: <user> }`  
`users`:
- emp (EMPLOYEE) in AD-VAS
- head (DEPT_HEAD) for AD-VAS
- hr1 (HR_ADMIN)
- hr2 (HR_SENIOR)
- ceo (CEO)

Passwords or login stubs as per your current mock login.

- Default balances (example):
  - EL: 20 + prior carry (capped at 60)
  - CL: 10
  - ML: 14
- Note: EL carry-forward job runs yearly; for dev seeds set `carry=10` to simulate.
