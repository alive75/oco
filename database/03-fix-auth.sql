-- Força a configuração de autenticação para md5 em vez de scram-sha-256
-- Isso resolve o problema de compatibilidade com o cliente Node.js
ALTER SYSTEM SET password_encryption = 'md5';