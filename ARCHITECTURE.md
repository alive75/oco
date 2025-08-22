# Arquitetura Técnica - OCO

## Visão Geral

```
┌─────────────────────────────────────────────────────┐
│                   Frontend (React)                    │
│                  ┌─────────────────┐                 │
│                  │   Tailwind CSS   │                │
│                  │   Shadcn UI      │                │
│                  │   TypeScript     │                │
│                  └─────────────────┘                 │
└────────────────────────┬────────────────────────────┘
                         │ HTTP/REST
                         ▼
┌─────────────────────────────────────────────────────┐
│                  Backend (NestJS)                     │
│  ┌──────────────────────────────────────────────┐   │
│  │  Controllers → Services → Repositories        │   │
│  │       JWT Auth | Validation | Guards          │   │
│  └──────────────────────────────────────────────┘   │
└────────────────────────┬────────────────────────────┘
                         │ SQL
                         ▼
┌─────────────────────────────────────────────────────┐
│                PostgreSQL Database                    │
│         Users | Accounts | Budgets | Transactions    │
└───────────────────────────────────────────────────────┘
```

## Backend Architecture (NestJS)

### Estrutura de Módulos

```
src/
├── main.ts                 # Bootstrap da aplicação
├── app.module.ts          # Módulo raiz
│
├── auth/                  # Autenticação e autorização
│   ├── auth.module.ts
│   ├── auth.controller.ts
│   ├── auth.service.ts
│   ├── strategies/
│   │   ├── jwt.strategy.ts
│   │   └── local.strategy.ts
│   ├── guards/
│   │   └── jwt-auth.guard.ts
│   └── dto/
│       └── login.dto.ts
│
├── users/                 # Gerenciamento de usuários
│   ├── users.module.ts
│   ├── users.controller.ts
│   ├── users.service.ts
│   ├── entities/
│   │   └── user.entity.ts
│   └── dto/
│       └── update-user.dto.ts
│
├── budgets/              # Orçamento (grupos e categorias)
│   ├── budgets.module.ts
│   ├── budgets.controller.ts
│   ├── budgets.service.ts
│   ├── entities/
│   │   ├── budget-group.entity.ts
│   │   └── budget-category.entity.ts
│   └── dto/
│       ├── create-group.dto.ts
│       └── create-category.dto.ts
│
├── accounts/             # Contas bancárias e cartões
│   ├── accounts.module.ts
│   ├── accounts.controller.ts
│   ├── accounts.service.ts
│   ├── entities/
│   │   └── account.entity.ts
│   └── dto/
│       └── create-account.dto.ts
│
├── transactions/         # Transações financeiras
│   ├── transactions.module.ts
│   ├── transactions.controller.ts
│   ├── transactions.service.ts
│   ├── entities/
│   │   └── transaction.entity.ts
│   └── dto/
│       └── create-transaction.dto.ts
│
├── shared/              # Despesas compartilhadas
│   ├── shared.module.ts
│   ├── shared.controller.ts
│   ├── shared.service.ts
│   └── dto/
│       └── shared-balance.dto.ts
│
└── common/              # Recursos compartilhados
    ├── decorators/
    ├── filters/
    ├── interceptors/
    └── pipes/
```

### Fluxo de Dados

```
Request → Controller → Service → Repository → Database
    ↑         ↓           ↓          ↓           ↓
    └─────── DTO ←──── Entity ←── Entity ←─── Table
```

### Entidades e Relacionamentos

```typescript
// user.entity.ts
@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  id: number;
  
  @Column({ unique: true })
  email: string;
  
  @Column()
  name: string;
  
  @Column()
  passwordHash: string;
  
  @OneToMany(() => Account, account => account.user)
  accounts: Account[];
  
  @OneToMany(() => Transaction, transaction => transaction.paidBy)
  transactions: Transaction[];
}

// account.entity.ts
@Entity('accounts')
export class Account {
  @PrimaryGeneratedColumn()
  id: number;
  
  @Column()
  name: string;
  
  @Column({ type: 'enum', enum: AccountType })
  type: AccountType; // CHECKING, CREDIT_CARD, INVESTMENT
  
  @Column({ type: 'decimal', precision: 10, scale: 2 })
  balance: number;
  
  @ManyToOne(() => User, user => user.accounts)
  user: User;
  
  @OneToMany(() => Transaction, transaction => transaction.account)
  transactions: Transaction[];
}

// budget-group.entity.ts
@Entity('budget_groups')
export class BudgetGroup {
  @PrimaryGeneratedColumn()
  id: number;
  
  @Column()
  name: string;
  
  @Column({ type: 'date' })
  monthYear: Date;
  
  @OneToMany(() => BudgetCategory, category => category.group)
  categories: BudgetCategory[];
}

// budget-category.entity.ts
@Entity('budget_categories')
export class BudgetCategory {
  @PrimaryGeneratedColumn()
  id: number;
  
  @Column()
  name: string;
  
  @Column({ type: 'decimal', precision: 10, scale: 2 })
  allocatedAmount: number;
  
  @ManyToOne(() => BudgetGroup, group => group.categories)
  group: BudgetGroup;
  
  @OneToMany(() => Transaction, transaction => transaction.category)
  transactions: Transaction[];
}

// transaction.entity.ts
@Entity('transactions')
export class Transaction {
  @PrimaryGeneratedColumn()
  id: number;
  
  @Column({ type: 'date' })
  date: Date;
  
  @Column()
  payee: string;
  
  @Column({ type: 'decimal', precision: 10, scale: 2 })
  amount: number;
  
  @Column({ default: false })
  isShared: boolean;
  
  @Column({ nullable: true })
  notes: string;
  
  @ManyToOne(() => Account, account => account.transactions)
  account: Account;
  
  @ManyToOne(() => BudgetCategory, category => category.transactions, { nullable: true })
  category: BudgetCategory;
  
  @ManyToOne(() => User, user => user.transactions)
  paidBy: User;
}
```

## Frontend Architecture (React)

### Estrutura de Pastas

```
src/
├── main.tsx              # Entry point
├── App.tsx              # Componente raiz
├── router.tsx           # Configuração de rotas
│
├── pages/               # Páginas/Rotas
│   ├── Login/
│   │   ├── index.tsx
│   │   └── styles.css
│   ├── Dashboard/
│   │   └── index.tsx
│   ├── Budget/
│   │   ├── index.tsx
│   │   └── components/
│   │       ├── GroupCard.tsx
│   │       └── CategoryItem.tsx
│   ├── Accounts/
│   │   ├── index.tsx
│   │   └── components/
│   │       └── TransactionList.tsx
│   └── Shared/
│       └── index.tsx
│
├── components/          # Componentes reutilizáveis
│   ├── Layout/
│   │   ├── Header.tsx
│   │   ├── Sidebar.tsx
│   │   └── Footer.tsx
│   ├── Forms/
│   │   ├── TransactionForm.tsx
│   │   ├── CategoryForm.tsx
│   │   └── AccountForm.tsx
│   └── UI/             # Componentes Shadcn UI
│       ├── Button.tsx
│       ├── Card.tsx
│       ├── Input.tsx
│       └── Select.tsx
│
├── hooks/              # Custom hooks
│   ├── useAuth.ts
│   ├── useBudget.ts
│   └── useTransactions.ts
│
├── services/           # Comunicação com API
│   ├── api.ts         # Configuração axios
│   ├── auth.service.ts
│   ├── budget.service.ts
│   └── transaction.service.ts
│
├── stores/            # Estado global (Zustand)
│   ├── auth.store.ts
│   ├── budget.store.ts
│   ├── transaction.store.ts
│   └── shared.store.ts
│
├── types/             # TypeScript types
│   ├── user.types.ts
│   ├── budget.types.ts
│   └── transaction.types.ts
│
└── utils/             # Funções auxiliares
    ├── formatters.ts
    ├── validators.ts
    └── calculations.ts
```

### Fluxo de Estado

```
User Action → Component → Hook/Service → API Call → Backend
     ↑            ↓            ↓           ↓          ↓
     └────── Store Update ←── Response ←──┘          ↓
                  ↓                                   ↓
            Re-render ←───────────────────────── Database
```

## Implementação do Cliente HTTP (Axios)

```typescript
// services/api.ts
import axios from 'axios';
import { useAuthStore } from '@/stores/auth.store';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor para adicionar token
api.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().token;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor para tratar erros
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Token expirado ou inválido
      useAuthStore.getState().logout();
      window.location.href = '/login';
    }
    
    // Mensagem de erro amigável
    const message = error.response?.data?.message || 'Erro na requisição';
    throw new Error(message);
  }
);

export default api;
```

## Gerenciamento de Estado (Zustand)

```typescript
// stores/auth.store.ts
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { authService } from '@/services/auth.service';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  
  // Actions
  login: (credentials: LoginDto) => Promise<void>;
  logout: () => void;
  checkAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      
      login: async (credentials) => {
        set({ isLoading: true });
        try {
          const response = await authService.login(credentials);
          set({
            user: response.user,
            token: response.access_token,
            isAuthenticated: true,
            isLoading: false
          });
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },
      
      logout: () => {
        set({
          user: null,
          token: null,
          isAuthenticated: false
        });
      },
      
      checkAuth: async () => {
        const token = get().token;
        if (!token) return;
        
        try {
          const user = await authService.getProfile();
          set({ user, isAuthenticated: true });
        } catch {
          get().logout();
        }
      }
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ token: state.token }) // Persiste apenas o token
    }
  )
);

// stores/budget.store.ts
import { create } from 'zustand';
import { budgetService } from '@/services/budget.service';

interface BudgetState {
  currentMonth: Date;
  groups: BudgetGroup[];
  readyToAssign: number;
  isLoading: boolean;
  
  // Actions
  loadBudget: (month: Date) => Promise<void>;
  updateCategory: (categoryId: number, amount: number) => Promise<void>;
  createGroup: (name: string) => Promise<void>;
  createCategory: (groupId: number, data: CreateCategoryDto) => Promise<void>;
}

export const useBudgetStore = create<BudgetState>((set, get) => ({
  currentMonth: new Date(),
  groups: [],
  readyToAssign: 0,
  isLoading: false,
  
  loadBudget: async (month) => {
    set({ isLoading: true });
    try {
      const budget = await budgetService.getMonthlyBudget(month);
      set({
        groups: budget.groups,
        readyToAssign: budget.readyToAssign,
        currentMonth: month,
        isLoading: false
      });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },
  
  updateCategory: async (categoryId, amount) => {
    await budgetService.updateCategory(categoryId, { allocatedAmount: amount });
    // Recarrega o orçamento para atualizar cálculos
    get().loadBudget(get().currentMonth);
  },
  
  createGroup: async (name) => {
    await budgetService.createGroup({ name, monthYear: get().currentMonth });
    get().loadBudget(get().currentMonth);
  },
  
  createCategory: async (groupId, data) => {
    await budgetService.createCategory({ ...data, groupId });
    get().loadBudget(get().currentMonth);
  }
}));

// stores/transaction.store.ts
import { create } from 'zustand';

interface TransactionFilters {
  accountId?: number;
  categoryId?: number;
  startDate?: Date;
  endDate?: Date;
  isShared?: boolean;
}

interface TransactionState {
  transactions: Transaction[];
  filters: TransactionFilters;
  isLoading: boolean;
  
  // Actions
  loadTransactions: () => Promise<void>;
  setFilters: (filters: TransactionFilters) => void;
  addTransaction: (data: CreateTransactionDto) => Promise<void>;
  updateTransaction: (id: number, data: UpdateTransactionDto) => Promise<void>;
  deleteTransaction: (id: number) => Promise<void>;
}

export const useTransactionStore = create<TransactionState>((set, get) => ({
  transactions: [],
  filters: {},
  isLoading: false,
  
  loadTransactions: async () => {
    set({ isLoading: true });
    try {
      const transactions = await transactionService.getAll(get().filters);
      set({ transactions, isLoading: false });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },
  
  setFilters: (filters) => {
    set({ filters });
    get().loadTransactions();
  },
  
  addTransaction: async (data) => {
    await transactionService.create(data);
    get().loadTransactions();
    // Atualiza o orçamento se houver categoria
    if (data.categoryId) {
      useBudgetStore.getState().loadBudget(useBudgetStore.getState().currentMonth);
    }
  },
  
  updateTransaction: async (id, data) => {
    await transactionService.update(id, data);
    get().loadTransactions();
  },
  
  deleteTransaction: async (id) => {
    await transactionService.delete(id);
    get().loadTransactions();
  }
}));
```

## Database Schema

```sql
-- Usuários (2 fixos)
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(100) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Contas
CREATE TABLE accounts (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  name VARCHAR(100) NOT NULL,
  type VARCHAR(20) NOT NULL CHECK (type IN ('CHECKING', 'CREDIT_CARD', 'INVESTMENT')),
  balance DECIMAL(10,2) DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Grupos de orçamento
CREATE TABLE budget_groups (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  month_year DATE NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(name, month_year)
);

-- Categorias de orçamento
CREATE TABLE budget_categories (
  id SERIAL PRIMARY KEY,
  group_id INTEGER REFERENCES budget_groups(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  allocated_amount DECIMAL(10,2) DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Transações
CREATE TABLE transactions (
  id SERIAL PRIMARY KEY,
  account_id INTEGER REFERENCES accounts(id),
  category_id INTEGER REFERENCES budget_categories(id),
  paid_by_user_id INTEGER REFERENCES users(id),
  date DATE NOT NULL,
  payee VARCHAR(255),
  amount DECIMAL(10,2) NOT NULL,
  is_shared BOOLEAN DEFAULT FALSE,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índices para performance
CREATE INDEX idx_transactions_date ON transactions(date);
CREATE INDEX idx_transactions_category ON transactions(category_id);
CREATE INDEX idx_budget_groups_month ON budget_groups(month_year);
```

## API Endpoints

### Autenticação
```
POST   /auth/login          # Login
POST   /auth/refresh        # Refresh token
GET    /auth/profile        # Perfil do usuário logado
```

### Orçamento
```
GET    /budgets             # Lista grupos e categorias do mês
POST   /budgets/groups      # Criar grupo
PATCH  /budgets/groups/:id  # Atualizar grupo
DELETE /budgets/groups/:id  # Deletar grupo

POST   /budgets/categories     # Criar categoria
PATCH  /budgets/categories/:id # Atualizar categoria
DELETE /budgets/categories/:id # Deletar categoria
```

### Contas
```
GET    /accounts            # Lista contas do usuário
POST   /accounts            # Criar conta
PATCH  /accounts/:id        # Atualizar conta
DELETE /accounts/:id        # Deletar conta
```

### Transações
```
GET    /transactions        # Lista transações (com filtros)
POST   /transactions        # Criar transação
PATCH  /transactions/:id    # Atualizar transação
DELETE /transactions/:id    # Deletar transação
```

### Compartilhados
```
GET    /shared/balance      # Balanço mensal do casal
GET    /shared/transactions # Transações compartilhadas
POST   /shared/settle       # Marcar como quitado
```

## Segurança

### Autenticação JWT
```typescript
// Payload do token
{
  sub: userId,
  email: userEmail,
  iat: issuedAt,
  exp: expiresAt
}
```

### Middleware de Segurança
- **Helmet**: Headers de segurança
- **CORS**: Domínios permitidos
- **Rate Limiting**: 100 req/min por IP
- **Validation Pipe**: Validação automática de DTOs

## Deploy

### Desenvolvimento
```bash
# Backend
cd backend
npm install
npm run start:dev  # http://localhost:3000

# Frontend
cd frontend
npm install
npm run dev       # http://localhost:5173
```

### Produção
```bash
# Backend
npm run build
npm run start:prod

# Frontend
npm run build
# Servir pasta dist/ com nginx

# PM2 para backend
pm2 start dist/main.js --name oco-api
```

### Variáveis de Ambiente

```env
# Backend (.env)
NODE_ENV=production
PORT=3000
DATABASE_URL=postgresql://user:pass@localhost/oco_db
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=7d
CORS_ORIGIN=https://yourdomain.com

# Frontend (.env)
VITE_API_URL=https://api.yourdomain.com
```

## Monitoramento

### Logs
- Console logs em desenvolvimento
- Winston logger em produção
- Logs estruturados em JSON

### Métricas Básicas
- Tempo de resposta das APIs
- Taxa de erro
- Uso de memória/CPU
- Queries lentas no banco
