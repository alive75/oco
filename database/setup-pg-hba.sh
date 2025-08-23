#!/bin/bash
# Este script configura o pg_hba.conf para usar md5 em vez de scram-sha-256
echo "Configuring pg_hba.conf for md5 authentication..."

cat > /var/lib/postgresql/data/pg_hba.conf << 'EOFFILE'
# TYPE  DATABASE        USER            ADDRESS                 METHOD

# "local" is for Unix domain socket connections only
local   all             all                                     md5
# IPv4 local connections:
host    all             all             127.0.0.1/32            md5
# IPv6 local connections:
host    all             all             ::1/128                 md5
# Allow replication connections from localhost
local   replication     all                                     md5
host    replication     all             127.0.0.1/32            md5
host    replication     all             ::1/128                 md5
# Allow all other connections with md5
host    all             all             0.0.0.0/0               md5
EOFFILE

echo "PostgreSQL pg_hba.conf updated for md5 authentication"