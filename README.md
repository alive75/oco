# OCO - Orçamento do Casal Organizado

Sistema de gerenciamento financeiro para casais com Zero-Based Budgeting e entrada manual de transações.

## 📁 Estrutura do Projeto

```
oco/
├── backend/          # NestJS API
├── frontend/         # React + Vite
├── scripts/          # Scripts de deployment e utilitários
├── database/         # Configurações do banco
├── docker-compose.yml
├── ecosystem.config.js    # Configuração PM2
├── nginx.conf            # Configuração Nginx
└── README.md
```

## 🚀 Instalação e Execução

### Pré-requisitos
- Node.js 18+
- PostgreSQL 13+
- PM2 (para produção)
- Nginx (opcional, para produção)

### Instalação Rápida

#### 1. Clone o repositório
```bash
git clone https://github.com/seu-usuario/oco.git
cd oco
```

#### 2. Configuração do Banco de Dados
```bash
# Opção 1: Docker (Recomendado)
docker-compose up -d postgres

# Opção 2: PostgreSQL local
# Crie um banco 'oco_db' e usuario 'oco_user'
# Execute os scripts em database/init.sql
```

#### 3. Backend
```bash
cd backend
npm install
cp .env.example .env  # Configure suas variáveis
npm run start:dev

# API: http://localhost:3000
# Docs: http://localhost:3000/api
```

#### 4. Frontend
```bash
cd frontend
npm install
npm run dev

# App: http://localhost:5173
```

### Usuários Padrão
```
usuario1@oco.app / 123456
usuario2@oco.app / 123456
```

## 🏗️ Arquitetura

### Backend
- **Framework**: NestJS + TypeScript
- **Banco**: PostgreSQL + TypeORM
- **Auth**: JWT + Passport
- **Docs**: Swagger
- **Validação**: class-validator

### Frontend
- **Framework**: React 18 + TypeScript + Vite
- **Styles**: Tailwind CSS
- **Components**: Shadcn UI (configurado)
- **State**: Zustand
- **Forms**: React Hook Form + Zod
- **HTTP**: Axios

## 🚀 Deployment (Produção)

### Deployment Automatizado
```bash
# Build e deploy completo
./scripts/deploy.sh

# Apenas build
./scripts/build-production.sh

# Backup do banco
./scripts/backup-database.sh
```

### Configuração Manual

#### 1. Build
```bash
# Backend
cd backend
npm ci --production
npm run build

# Frontend  
cd frontend
npm ci
npm run build
```

#### 2. PM2 (Recomendado)
```bash
# Instalar PM2 globalmente
npm install -g pm2

# Iniciar aplicação
pm2 start ecosystem.config.js --env production

# Monitoramento
pm2 status
pm2 logs oco-api
pm2 monit
```

#### 3. Nginx (Opcional)
```bash
# Copiar configuração
sudo cp nginx.conf /etc/nginx/sites-available/oco
sudo ln -s /etc/nginx/sites-available/oco /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
```

### Scripts Utilitários
- `scripts/backup-database.sh` - Backup automático do banco
- `scripts/restore-database.sh` - Restaurar banco do backup
- `scripts/deploy.sh` - Deploy completo
- `scripts/build-production.sh` - Build otimizado

## 🔧 Funcionalidades Implementadas

### ✅ Core Features (Completo)
- **Autenticação JWT** com persistência
- **Zero-Based Budgeting** com grupos e categorias
- **Gestão de Contas** (Corrente, Crédito, Investimento)
- **Transações** com entrada manual
- **Despesas Compartilhadas** com divisão 50/50
- **Lógica de Cartão de Crédito** com movimentação entre categorias

### ✅ UX Melhorias (Step 6)
- **Animações suaves** com Tailwind transitions
- **Skeleton loaders** e estados vazios
- **Atalhos de teclado** (Ctrl+B, Ctrl+C, etc.)
- **Filtros persistentes** em localStorage
- **Cache frontend** (5min para orçamento)
- **Debounce em buscas** (300ms)
- **Validações robustas** (datas futuras, valores negativos)

### ✅ Production Ready
- **Build otimizado** com code splitting
- **PM2 ecosystem** configurado
- **Health checks** implementados
- **Scripts de backup/restore**
- **Configuração Nginx** para proxy reverso
- **Logs estruturados**

## 🗃️ Banco de Dados

### Usuários Padrão
```sql
usuario1@oco.app / 123456
usuario2@oco.app / 123456
```

### Schema Principais
- `users` - Usuários fixos (2)
- `accounts` - Contas bancárias/cartões
- `budget_groups` - Grupos do orçamento
- `budget_categories` - Categorias de gasto
- `transactions` - Transações financeiras

## 📝 Convenções

### Git
- Commits em português
- Mensagens descritivas
- Branch `main` para produção

### Código
- **Backend**: Controllers → Services → Repositories
- **Frontend**: Pages → Components → Hooks → Stores
- **Validação**: DTOs no backend, Zod no frontend
- **Estado**: Zustand para global, props para local

## 🔐 Autenticação

- JWT com expiração de 7 dias
- Interceptor automático no Axios
- Redirecionamento automático no logout
- Storage persistente com Zustand

## 🌐 APIs Disponíveis

```
GET    /           - Health check
POST   /auth/login - Login
GET    /auth/profile - Perfil do usuário

GET    /users      - Listar usuários
GET    /accounts   - Contas do usuário logado
GET    /budgets    - Orçamento do mês
GET    /transactions - Transações
GET    /shared/balance - Balanço compartilhado
```

## 📱 Telas Implementadas

### ✅ Principais
- **Login** - Autenticação com botões rápidos
- **Dashboard** - Resumo financeiro e transações recentes  
- **Orçamento** - Zero-based budgeting com grupos e categorias
- **Contas** - Gestão de contas com transações e busca
- **Compartilhados** - Despesas divididas com balanço automático

### ✅ Componentes
- **Header** - Navegação com atalhos de teclado
- **Formulários** - Validação client/server com feedback
- **Estados vazios** - Mensagens contextuais
- **Loading states** - Skeleton loaders
- **Modais** - Com suporte a Esc/Enter

## 🔧 Comandos Úteis

### Desenvolvimento
```bash
# Backend
npm run start:dev        # Dev server com watch
npm run build           # Build para produção  
npm run test            # Executar testes

# Frontend  
npm run dev             # Dev server
npm run build          # Build otimizado
npm run preview        # Preview do build

# Database
./scripts/backup-database.sh    # Backup
./scripts/restore-database.sh backup.sql.gz  # Restore
```

### Produção
```bash
# Deploy completo
./scripts/deploy.sh

# Gerenciamento PM2
pm2 start ecosystem.config.js --env production
pm2 reload oco-api
pm2 logs oco-api
pm2 monit
```

## 🐛 Troubleshooting

### Problemas Comuns

**Erro de conexão com banco:**
```bash
# Verificar se PostgreSQL está rodando
docker-compose ps
# Recriar container se necessário
docker-compose down && docker-compose up -d postgres
```

**Build do frontend falha:**
```bash
# Limpar cache e reinstalar
rm -rf node_modules package-lock.json
npm install
```

**PM2 não inicia:**
```bash
# Verificar logs
pm2 logs oco-api
# Verificar configuração
pm2 show oco-api
```

---

🎉 **Status**: MVP completo e pronto para produção!

📧 **Suporte**: Consulte os logs em `./logs/` para debugging