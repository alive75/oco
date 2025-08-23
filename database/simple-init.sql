-- Inicialização simples do banco OCO
-- Cria usuário oco_user com senha
CREATE USER oco_user WITH PASSWORD 'oco_password' SUPERUSER CREATEDB CREATEROLE;
GRANT ALL PRIVILEGES ON DATABASE oco_db TO oco_user;