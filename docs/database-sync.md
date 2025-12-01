# Database Synchronization Guide

This guide explains how to keep your database schema synchronized when working across multiple devices (Desktop and MacBook).

## The Problem

When you make database schema changes on one device and push them to the cloud, pulling those changes on another device can cause database inconsistencies because:
- The Prisma schema file changes
- New migrations are added
- But your local database hasn't been updated yet

## The Solution

We've implemented **automatic database synchronization** that runs whenever you pull changes or switch branches.

## How It Works

### Automatic Synchronization

Git hooks automatically detect schema changes and sync your database:

1. **After `git pull`**: The `post-merge` hook checks if `prisma/schema.prisma` or migration files changed
2. **After branch switching**: The `post-checkout` hook does the same check
3. **If changes detected**: Automatically runs `pnpm db:sync` to update your database

### Manual Synchronization

You can also manually sync your database anytime:

```bash
# Sync database with latest schema
pnpm db:sync

# Check migration status
pnpm db:status

# Reset database (WARNING: deletes all data)
pnpm db:reset
```

## Workflow Example

### On Desktop (making changes):
```bash
# Make schema changes
vim prisma/schema.prisma

# Create migration
pnpm prisma migrate dev --name add_new_feature

# Commit and push
git add .
git commit -m "feat: add new feature to schema"
git push
```

### On MacBook (pulling changes):
```bash
# Pull changes
git pull

# ✅ Database automatically syncs!
# The post-merge hook detects schema changes and runs:
# - prisma generate
# - prisma migrate deploy
```

## What Gets Synced

The sync script performs these steps:
1. **Generate Prisma Client**: Updates the Prisma client with new schema
2. **Check Migration Status**: Detects pending migrations
3. **Apply Migrations**: Runs any pending migrations
4. **Verify**: Confirms database is up to date

## Troubleshooting

### Migration Conflicts

If you encounter migration conflicts (rare):

```bash
# Option 1: Reset database (development only)
pnpm db:reset

# Option 2: Manually resolve
pnpm prisma migrate resolve --applied <migration_name>
```

### Hook Not Running

If the Git hook doesn't run automatically:

```bash
# Make hooks executable
chmod +x .husky/post-merge .husky/post-checkout

# Or manually sync
pnpm db:sync
```

### Check Current Status

```bash
# See migration status
pnpm db:status

# See what changed
git diff HEAD~1 prisma/
```

## Files Created

- **`.husky/post-merge`**: Auto-sync after git pull
- **`.husky/post-checkout`**: Auto-sync after branch switch
- **`scripts/sync-db.sh`**: Database sync script
- **`.agent/workflows/sync-db.md`**: Workflow documentation
- **`package.json`**: Added `db:sync`, `db:status`, `db:reset` scripts

## Best Practices

1. **Always pull before making schema changes** to avoid conflicts
2. **Commit migrations with schema changes** in the same commit
3. **Test migrations locally** before pushing
4. **Use descriptive migration names** for easier tracking
5. **Keep `.env` files in sync** between devices (DATABASE_URL)

## Environment Variables

Make sure your `.env` file has the correct `DATABASE_URL` on both devices:

```env
DATABASE_URL="mysql://user:password@localhost:3306/cdbl_lms"
```

## Summary

You no longer need to worry about database inconsistencies! The system automatically:
- ✅ Detects schema changes when you pull
- ✅ Generates updated Prisma client
- ✅ Applies pending migrations
- ✅ Verifies everything is in sync

Just `git pull` and continue working! 🚀
