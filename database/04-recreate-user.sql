-- Recria o usuário com configuração explícita para md5
DROP USER IF EXISTS oco_user;
CREATE USER oco_user WITH PASSWORD 'oco_password' SUPERUSER CREATEDB CREATEROLE REPLICATION;
GRANT ALL PRIVILEGES ON DATABASE oco_db TO oco_user;