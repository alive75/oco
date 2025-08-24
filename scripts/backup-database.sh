#!/bin/bash

# OCO Database Backup Script
# Creates a timestamped backup of the OCO PostgreSQL database

# Configuration
DB_HOST="localhost"
DB_PORT="5432"
DB_NAME="oco_db"
DB_USER="oco_user"
BACKUP_DIR="/home/alive75/code/oco/backups"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="oco_db_backup_${TIMESTAMP}.sql"

# Create backup directory if it doesn't exist
mkdir -p "$BACKUP_DIR"

# Export password to avoid prompting
export PGPASSWORD="oco_password"

echo "Starting backup of database '$DB_NAME'..."
echo "Backup file: $BACKUP_DIR/$BACKUP_FILE"

# Create database dump
pg_dump \
  --host="$DB_HOST" \
  --port="$DB_PORT" \
  --username="$DB_USER" \
  --dbname="$DB_NAME" \
  --verbose \
  --clean \
  --if-exists \
  --create \
  --format=plain \
  --file="$BACKUP_DIR/$BACKUP_FILE"

# Check if backup was successful
if [ $? -eq 0 ]; then
    echo "Backup completed successfully!"
    echo "File: $BACKUP_DIR/$BACKUP_FILE"
    
    # Compress the backup
    gzip "$BACKUP_DIR/$BACKUP_FILE"
    echo "Backup compressed: $BACKUP_DIR/${BACKUP_FILE}.gz"
    
    # Clean up old backups (keep last 7 days)
    find "$BACKUP_DIR" -name "oco_db_backup_*.sql.gz" -mtime +7 -delete
    echo "Old backups cleaned up (kept last 7 days)"
    
else
    echo "Backup failed!"
    exit 1
fi

# Unset password
unset PGPASSWORD