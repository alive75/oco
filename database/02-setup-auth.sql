-- Alterar método de autenticação para md5 para todas as conexões
-- Isso permite conexões com senha md5/bcrypt

-- Criar usuário PostgreSQL com senha usando md5
-- O usuário oco_user já existe, vamos apenas alterar a senha
ALTER USER oco_user WITH PASSWORD 'oco_password';