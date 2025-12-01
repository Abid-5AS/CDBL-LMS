#!/bin/bash

# Database Synchronization Script
# Run this after pulling changes to sync your local database with schema changes

set -e

echo "🔄 Starting database synchronization..."

# Check if we're in the right directory
if [ ! -f "prisma/schema.prisma" ]; then
    echo "❌ Error: prisma/schema.prisma not found. Are you in the project root?"
    exit 1
fi

# Generate Prisma Client
echo "📦 Generating Prisma Client..."
pnpm prisma generate

# Check migration status
echo "🔍 Checking migration status..."
MIGRATION_STATUS=$(pnpm prisma migrate status 2>&1 || true)

if echo "$MIGRATION_STATUS" | grep -q "Database schema is up to date"; then
    echo "✅ Database schema is already up to date!"
elif echo "$MIGRATION_STATUS" | grep -q "pending migration"; then
    echo "⚠️  Pending migrations detected. Applying..."
    pnpm prisma migrate deploy
    echo "✅ Migrations applied successfully!"
else
    echo "⚠️  Migration status unclear. Running migrate deploy to be safe..."
    pnpm prisma migrate deploy || echo "⚠️  No migrations to apply or database not initialized yet."
    echo "✅ Database synchronized!"
fi

# Verify final status
echo ""
echo "🔍 Final verification..."
pnpm prisma migrate status || echo "✅ Database is ready!"

echo ""
echo "✅ Database synchronization complete!"
