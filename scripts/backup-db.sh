#!/bin/bash

# Database backup script for CDBL-LMS
# This creates a SQL dump of the current database state

# Load environment variables
source .env 2>/dev/null || true

# Extract database credentials from DATABASE_URL
# Format: mysql://user:password@host:port/database
DB_URL="${DATABASE_URL}"

# Parse the URL
DB_USER=$(echo $DB_URL | sed -n 's/.*:\/\/\([^:]*\):.*/\1/p')
DB_PASS=$(echo $DB_URL | sed -n 's/.*:\/\/[^:]*:\([^@]*\)@.*/\1/p')
DB_HOST=$(echo $DB_URL | sed -n 's/.*@\([^:]*\):.*/\1/p')
DB_PORT=$(echo $DB_URL | sed -n 's/.*:\([0-9]*\)\/.*/\1/p')
DB_NAME=$(echo $DB_URL | sed -n 's/.*\/\([^?]*\).*/\1/p')

# Create backups directory
mkdir -p backups

# Generate timestamp
TIMESTAMP=$(date +"%Y-%m-%d_%H-%M-%S")
BACKUP_FILE="backups/backup-${TIMESTAMP}.sql"

echo "📦 Starting database backup..."
echo "   Database: ${DB_NAME}"
echo "   Host: ${DB_HOST}:${DB_PORT}"
echo "   File: ${BACKUP_FILE}"

# Create backup using mysqldump
mysqldump -h "${DB_HOST}" -P "${DB_PORT}" -u "${DB_USER}" -p"${DB_PASS}" "${DB_NAME}" > "${BACKUP_FILE}"

if [ $? -eq 0 ]; then
    FILE_SIZE=$(du -h "${BACKUP_FILE}" | cut -f1)
    echo "✅ Backup completed successfully!"
    echo "   Size: ${FILE_SIZE}"
    echo "   Location: ${BACKUP_FILE}"
else
    echo "❌ Backup failed!"
    exit 1
fi
