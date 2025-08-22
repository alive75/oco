# OCO - Orçamento do Casal Organizado

Sistema de gerenciamento financeiro para casais com Zero-Based Budgeting e entrada manual de transações.

## 📁 Estrutura do Projeto

```
oco/
├── backend/          # NestJS API
├── frontend/         # React + Vite
├── docker-compose.yml
└── README.md
```

## 🚀 Como Executar

### Pré-requisitos
- Node.js 18+
- Docker & Docker Compose
- PostgreSQL (via Docker)

### 1. Banco de Dados
```bash
# Iniciar PostgreSQL
docker-compose up -d postgres

# O banco será inicializado automaticamente com 2 usuários:
# usuario1@oco.app / 123456
# usuario2@oco.app / 123456
```

### 2. Backend (NestJS)
```bash
cd backend
npm install
npm run start:dev

# API disponível em: http://localhost:3000
# Swagger docs: http://localhost:3000/api/docs
```

### 3. Frontend (React)
```bash
cd frontend
npm install
npm run dev

# Frontend disponível em: http://localhost:5173
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

## 🔧 Status do Desenvolvimento

### ✅ Etapa 1 - Estrutura Base (Completa)

**Backend:**
- ✅ Projeto NestJS inicializado
- ✅ Módulos criados (auth, users, budgets, accounts, transactions, shared)
- ✅ Entidades TypeORM definidas
- ✅ Configuração JWT + Passport
- ✅ Swagger configurado
- ✅ CORS habilitado

**Frontend:**
- ✅ Projeto React + Vite inicializado
- ✅ Tailwind CSS configurado
- ✅ Shadcn UI preparado
- ✅ React Router configurado
- ✅ Estrutura de pastas criada
- ✅ Axios configurado com interceptors JWT
- ✅ Stores Zustand criadas
- ✅ Services para API criados

**Database:**
- ✅ Docker Compose configurado
- ✅ Seed com 2 usuários fixos
- ✅ Tabelas definidas
- ✅ Relacionamentos configurados

### 🔄 Próximas Etapas
1. **Etapa 2**: Backend Core - Implementar endpoints completos
2. **Etapa 3**: Lógica de negócio específica (cartão de crédito, compartilhamento)
3. **Etapa 4**: Frontend funcional com integração à API
4. **Etapa 5**: Telas principais (Budget, Accounts, Shared)
5. **Etapa 6**: Refinamento e deploy

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

- ✅ **Login** - Formulário + botões rápidos
- ✅ **Layout** - Header com navegação
- ✅ **Dashboard** - Cards de resumo
- ✅ **Orçamento** - Estrutura básica
- ✅ **Contas** - Placeholder
- ✅ **Compartilhados** - Balanço mensal

---

**Próximo passo**: Implementar Etapa 2 - Backend Core com endpoints funcionais e lógica de negócio.