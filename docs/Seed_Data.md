# Seed Data (Dev only)

`policy_settings`: default for current year.  
`users` (Prisma seed):
- Employee One (`employee1@demo.local`, EMPLOYEE, Engineering)
- Employee Two (`employee2@demo.local`, EMPLOYEE, Operations)
- HR Admin (`hr@demo.local`, HR_ADMIN, HR & Admin)

- Default balances (example):
  - EL: 20 + prior carry (capped at 60)
  - CL: 10
  - ML: 14
- Note: EL carry-forward job runs yearly; for dev seeds set `carry=10` to simulate.
