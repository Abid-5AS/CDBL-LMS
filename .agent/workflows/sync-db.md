---
description: Sync database schema after pulling changes
---

# Database Schema Synchronization Workflow

Use this workflow whenever you pull changes from another device to ensure your local database schema is in sync.

## Steps

// turbo-all
1. **Pull latest changes from remote**
```bash
git pull
```

2. **Generate Prisma Client**
```bash
pnpm prisma generate
```

3. **Apply pending migrations**
```bash
pnpm prisma migrate deploy
```

4. **Verify database schema**
```bash
pnpm prisma migrate status
```

## Alternative: Reset Database (Development Only)

If you encounter migration conflicts or want a fresh start:

```bash
# WARNING: This will delete all data!
pnpm prisma migrate reset --force
```

## Quick Sync Command

For convenience, you can run the sync script:

```bash
pnpm db:sync
```
