#!/bin/bash

# OCO Database Restore Script
# Restores the OCO PostgreSQL database from a backup file

# Check if backup file is provided
if [ $# -eq 0 ]; then
    echo "Usage: $0 <backup_file>"
    echo "Example: $0 /path/to/oco_db_backup_20241224_150000.sql.gz"
    exit 1
fi

BACKUP_FILE="$1"

# Configuration
DB_HOST="localhost"
DB_PORT="5432"
DB_NAME="oco_db"
DB_USER="oco_user"

# Check if backup file exists
if [ ! -f "$BACKUP_FILE" ]; then
    echo "Error: Backup file '$BACKUP_FILE' not found!"
    exit 1
fi

# Export password to avoid prompting
export PGPASSWORD="oco_password"

echo "Starting restore of database '$DB_NAME' from '$BACKUP_FILE'..."

# Check if file is compressed
if [[ "$BACKUP_FILE" == *.gz ]]; then
    echo "Decompressing backup file..."
    gunzip -c "$BACKUP_FILE" | psql \
      --host="$DB_HOST" \
      --port="$DB_PORT" \
      --username="$DB_USER" \
      --dbname="postgres"
else
    # Restore from uncompressed file
    psql \
      --host="$DB_HOST" \
      --port="$DB_PORT" \
      --username="$DB_USER" \
      --dbname="postgres" \
      --file="$BACKUP_FILE"
fi

# Check if restore was successful
if [ $? -eq 0 ]; then
    echo "Database restore completed successfully!"
else
    echo "Database restore failed!"
    exit 1
fi

# Unset password
unset PGPASSWORD

echo "Note: You may need to restart the OCO application for changes to take effect."