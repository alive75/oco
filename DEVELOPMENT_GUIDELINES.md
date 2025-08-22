# Diretrizes de Desenvolvimento - OCO

## Melhores Práticas para Claude Code

### 1. Princípios Gerais
- **Incremental**: Desenvolva em pequenos incrementos testáveis
- **Test First**: Teste cada feature antes de prosseguir
- **Simple First**: Implemente a versão mais simples que funciona
- **Refactor Later**: Otimize apenas quando necessário

### 2. Workflow Recomendado
1. Criar estrutura base
2. Implementar uma feature completa (backend → frontend)
3. Testar localmente
4. Commit com mensagem descritiva
5. Repetir para próxima feature

### 3. Convenções de Código

#### Quando usar Zustand vs Props
```typescript
// ✅ Use Zustand para estado global (auth, orçamento atual, filtros)
const { user } = useAuthStore();
const { groups, readyToAssign } = useBudgetStore();

// ✅ Use props para dados locais e callbacks
<TransactionForm 
  accountId={selectedAccount}
  onSubmit={handleSubmit}
/>

// ❌ EVITAR: Zustand para tudo (overhead desnecessário)
const useFormStore = create(() => ({ // NÃO FAÇA ISSO
  formData: {},
  setFormData: () => {}
}));
```

#### TypeScript
```typescript
// ✅ BOM: Tipos explícitos e nomes descritivos
interface CreateTransactionDto {
  accountId: number;
  categoryId?: number;
  amount: number;
  date: Date;
  isShared: boolean;
}

// ❌ EVITAR: any types e nomes genéricos
interface Data {
  id: any;
  value: any;
}
```

#### React Components
```tsx
// ✅ BOM: Componente tipado e bem estruturado
interface TransactionFormProps {
  onSubmit: (data: TransactionData) => Promise<void>;
  initialData?: Partial<TransactionData>;
}

export function TransactionForm({ onSubmit, initialData }: TransactionFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  
  // Lógica do componente
  
  return (
    <form onSubmit={handleSubmit}>
      {/* JSX limpo e organizado */}
    </form>
  );
}

// ❌ EVITAR: Componentes muito grandes ou sem tipos
```

#### Uso de Stores (Zustand)
```tsx
// ✅ BOM: Use seletores para evitar re-renders
function Header() {
  const user = useAuthStore(state => state.user);
  const logout = useAuthStore(state => state.logout);
  
  return <div>Olá, {user?.name}</div>;
}

// ❌ EVITAR: Desestruturar todo o store
function Header() {
  const { user, token, isAuthenticated, login, logout } = useAuthStore();
  // Vai re-renderizar quando qualquer parte mudar
}
```

#### Services com Axios
```typescript
// ✅ BOM: Tratamento de erro consistente
export const budgetService = {
  async createCategory(dto: CreateCategoryDto) {
    try {
      const { data } = await api.post('/budgets/categories', dto);
      return data;
    } catch (error) {
      console.error('Erro ao criar categoria:', error);
      throw error;
    }
  }
};

// ❌ EVITAR: Sem tratamento de erro
export const budgetService = {
  createCategory: (dto) => api.post('/budgets/categories', dto)
};
```

## Prompts para Claude Code por Etapa

### ETAPA 1: Setup e Estrutura Base

```markdown
Crie a estrutura inicial do projeto OCO (Orçamento do Casal Organizado) com as seguintes especificações:

## Backend (NestJS)
1. Inicialize um projeto NestJS novo
2. Configure TypeORM com PostgreSQL
3. Instale e configure:
   - @nestjs/passport e passport-jwt para autenticação
   - @nestjs/swagger para documentação
   - class-validator e class-transformer para validação
   - bcrypt para hash de senhas
4. Crie a estrutura de módulos: auth, users, budgets, accounts, transactions, shared
5. Configure CORS e variáveis de ambiente
6. Crie o docker-compose.yml para PostgreSQL local

## Frontend (React + Vite)
1. Crie um projeto React com Vite e TypeScript
2. Instale e configure:
   - Tailwind CSS
   - Shadcn UI (configure os componentes base)
   - React Router DOM
   - Axios (para chamadas API)
   - React Hook Form + Zod
   - Zustand (para estado global)
3. Crie a estrutura de pastas conforme ARCHITECTURE.md
4. Configure o arquivo de rotas básico

## Configuração do Axios
Configure o cliente HTTP com interceptors para JWT:
\`\`\`typescript
// src/services/api.ts
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:3000',
  timeout: 10000
});

api.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = \`Bearer \${token}\`;
  }
  return config;
});

export default api;
\`\`\`

## Configuração do Zustand
Crie as stores principais:
\`\`\`typescript
// src/stores/auth.store.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useAuthStore = create()(
  persist(
    (set) => ({
      user: null,
      token: null,
      login: async (credentials) => {
        // implementar
      },
      logout: () => set({ user: null, token: null })
    }),
    { name: 'auth-storage' }
  )
);
\`\`\`

## Banco de Dados
1. Crie as migrations iniciais com as tabelas:
   - users (id, email, name, password_hash)
   - accounts (id, user_id, name, type, balance)
   - budget_groups (id, name, month_year)
   - budget_categories (id, group_id, name, allocated_amount)
   - transactions (id, account_id, category_id, date, payee, amount, is_shared, notes, paid_by_user_id)

2. Crie um seed com 2 usuários fixos:
   - usuario1@oco.app (senha: 123456)
   - usuario2@oco.app (senha: 123456)

Mantenha tudo simples e funcional. Não adicione features desnecessárias.
```

### ETAPA 2: Backend Core - Autenticação e CRUDs

```markdown
Implemente o backend core do OCO com as seguintes funcionalidades:

## Módulo de Autenticação
1. Implemente login JWT com email/senha
2. Crie o JwtAuthGuard para proteger rotas
3. Adicione endpoint GET /auth/profile para retornar usuário logado
4. Configure refresh token com expiração de 7 dias

## Módulo de Usuários
1. Service para buscar usuário por email (para login)
2. Não precisa de CRUD completo - apenas 2 usuários fixos
3. Adicione método para validar senha com bcrypt

## Módulo de Contas (Accounts)
1. CRUD completo de contas bancárias
2. Tipos: CHECKING, CREDIT_CARD, INVESTMENT
3. Quando criar CREDIT_CARD, criar categoria automática com mesmo nome
4. Endpoint GET /accounts deve retornar apenas contas do usuário logado
5. Validar que usuário só pode editar/deletar próprias contas

## Módulo de Orçamento (Budgets)
1. CRUD de grupos de orçamento (budget_groups)
2. CRUD de categorias dentro dos grupos
3. GET /budgets deve retornar estrutura completa do mês atual
4. POST /budgets/copy-previous deve copiar estrutura do mês anterior
5. Calcular "Pronto para atribuir" (renda - soma das alocações)

## Módulo de Transações
1. CRUD completo de transações
2. Filtros: por conta, categoria, data, usuário
3. Ao criar transação:
   - Se conta for CREDIT_CARD e tiver categoria, mover dinheiro entre categorias
   - Atualizar saldo da conta
4. Validar que categoria existe e pertence ao mês corrente

## Swagger
Configure Swagger em /api/docs com documentação de todos endpoints

Teste cada endpoint antes de prosseguir. Use Thunder Client ou Insomnia.
```

### ETAPA 3: Lógica de Negócio Específica

```markdown
Implemente as regras de negócio específicas do OCO:

## Lógica do Cartão de Crédito
1. No TransactionsService, implemente a lógica especial para cartões:
   - Quando transação em cartão com categoria X:
     * Deduzir valor da categoria X
     * Adicionar valor à categoria do cartão (para pagamento)
   - Pagamento de fatura: transferência da conta corrente para cartão
2. Criar método para calcular fatura atual do cartão

## Sistema de Despesas Compartilhadas
1. Criar SharedService com os métodos:
   - getMonthlyBalance(month: Date): retorna balanço do mês
   - getSharedTransactions(month: Date): lista transações compartilhadas
   - calculateOwedAmount(): calcula quem deve quanto para quem
2. Lógica: 
   - Transações is_shared = true entram no cálculo
   - Divisão sempre 50/50
   - Retornar: { user1Paid: total, user2Paid: total, owedBy: userId, amount: valor }

## Cálculos do Orçamento
1. No BudgetsService, adicionar métodos:
   - getAvailableAmount(categoryId): retorna alocado - gasto
   - getReadyToAssign(): retorna renda total - soma alocações
   - getCategorySpent(categoryId, month): soma transações da categoria
2. Adicionar campo calculado 'available' em cada categoria (allocated - spent)
3. Adicionar campo 'readyToAssign' no retorno do orçamento

## Validações de Negócio
1. Não permitir alocação negativa em categorias
2. Não permitir deletar categoria com transações
3. Não permitir transação sem conta
4. Validar que tipos especiais (Renda, Transferência) não têm categoria

## Relatórios Básicos
1. GET /reports/monthly-summary: resumo do mês (total gasto, por categoria, etc)
2. GET /reports/accounts-balance: saldo de todas as contas

Adicione testes unitários para as regras de negócio críticas.
```

### ETAPA 4: Frontend Base

```markdown
Crie a estrutura base do frontend React para o OCO:

## Configuração Inicial
1. Configure axios com baseURL e interceptor para JWT:
\`\`\`typescript
// src/services/api.ts
import axios from 'axios';
import { useAuthStore } from '@/stores/auth.store';

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000'
});

api.interceptors.request.use(config => {
  const token = useAuthStore.getState().token;
  if (token) config.headers.Authorization = \`Bearer \${token}\`;
  return config;
});

api.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 401) {
      useAuthStore.getState().logout();
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);
\`\`\`

2. Crie o AuthStore com Zustand:
\`\`\`typescript
// src/stores/auth.store.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { authService } from '@/services/auth.service';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (credentials: LoginDto) => Promise<void>;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      login: async (credentials) => {
        const response = await authService.login(credentials);
        set({ 
          user: response.user, 
          token: response.access_token,
          isAuthenticated: true 
        });
      },
      logout: () => set({ user: null, token: null, isAuthenticated: false })
    }),
    { 
      name: 'auth-storage',
      partialize: (state) => ({ token: state.token })
    }
  )
);
\`\`\`

3. Configure React Router com rotas protegidas:
   - /login (pública)
   - /dashboard, /budget, /accounts, /shared (protegidas)

## Tela de Login
1. Formulário com email e senha
2. Validação com Zod
3. Dois botões para login rápido (Usuário 1 / Usuário 2) - para facilitar desenvolvimento
4. Salvar token no localStorage
5. Redirecionar para /dashboard após login

## Layout Principal
1. Header com:
   - Logo/Nome do app
   - Navegação principal (Dashboard, Orçamento, Contas, Compartilhados)
   - Nome do usuário e botão logout
2. Container principal com padding responsivo
3. Dark mode como padrão (bg-gray-900, text-gray-100)

## Dashboard Inicial
1. Cards com resumo:
   - Orçamento do mês (disponível/alocado)
   - Saldo total das contas
   - Gastos compartilhados do mês
2. Lista de transações recentes (últimas 10)
3. Botão rápido para adicionar transação

## Componentes Base (Shadcn UI)
1. Configure os componentes necessários:
   - Button, Card, Input, Select, Label
   - Form (React Hook Form integration)
   - Dialog/Modal
   - Toast para notificações
2. Crie componente MoneyInput formatado para valores em R$

## Services
1. Crie services para cada módulo usando Axios:
\`\`\`typescript
// src/services/auth.service.ts
import { api } from './api';

export const authService = {
  async login(credentials: LoginDto) {
    const { data } = await api.post('/auth/login', credentials);
    return data;
  },
  
  async getProfile() {
    const { data } = await api.get('/auth/profile');
    return data;
  }
};

// src/services/budget.service.ts
import { api } from './api';

export const budgetService = {
  async getMonthlyBudget(month: Date) {
    const { data } = await api.get('/budgets', {
      params: { month: month.toISOString() }
    });
    return data;
  },
  
  async createCategory(dto: CreateCategoryDto) {
    const { data } = await api.post('/budgets/categories', dto);
    return data;
  },
  
  async updateCategory(id: number, dto: UpdateCategoryDto) {
    const { data } = await api.patch(\`/budgets/categories/\${id}\`, dto);
    return data;
  }
};

// src/services/transaction.service.ts
import { api } from './api';

export const transactionService = {
  async getAll(filters?: TransactionFilters) {
    const { data } = await api.get('/transactions', { params: filters });
    return data;
  },
  
  async create(dto: CreateTransactionDto) {
    const { data } = await api.post('/transactions', dto);
    return data;
  },
  
  async update(id: number, dto: UpdateTransactionDto) {
    const { data } = await api.patch(\`/transactions/\${id}\`, dto);
    return data;
  },
  
  async delete(id: number) {
    await api.delete(\`/transactions/\${id}\`);
  }
};
\`\`\`

Mantenha o design simples e funcional. Use Tailwind classes direto, sem criar muitos componentes customizados.
```

### ETAPA 5: Telas Principais

```markdown
Implemente as três telas principais do OCO:

## Tela de Orçamento (/budget)
1. Header do mês com navegação (mês anterior/próximo)
2. Card "Pronto para Atribuir" no topo (destaque visual)
3. Lista de Grupos expansíveis:
   - Nome do grupo com total alocado
   - Lista de categorias dentro com:
     * Nome da categoria
     * Campo input para valor alocado (editável inline)
     * Barra de progresso (gasto/alocado)
     * Valor disponível em verde ou vermelho se excedido
4. Botões para adicionar grupo/categoria
5. Modal para criar/editar grupo e categoria
6. Auto-save ao mudar valores (debounce 1s)

## Tela de Contas (/accounts)
1. Tabs ou cards para cada conta
2. Para cada conta mostrar:
   - Nome e tipo (ícone diferente para cada tipo)
   - Saldo atual
   - Lista de transações da conta
   - Botão "Nova Transação"
3. Formulário de transação (modal ou inline):
   - Data (default: hoje)
   - Pagante (select: Usuário 1 ou 2)
   - Categoria OU Tipo Especial (select)
   - Valor (R$)
   - Compartilhada? (checkbox)
   - Anotações (textarea opcional)
   - Botões Salvar/Cancelar
4. Permitir editar/deletar transações (com confirmação)
5. Filtros: por mês, categoria, compartilhadas

## Tela de Compartilhados (/shared)
1. Resumo do mês no topo:
   - Total pago por Usuário 1: R$ X
   - Total pago por Usuário 2: R$ Y
   - Balanço: "Usuário X deve R$ Z para Usuário Y" (ou "Quitado")
2. Lista de transações compartilhadas com:
   - Data, descrição, valor
   - Quem pagou (badge colorido)
   - Valor individual (50% do total)
3. Filtro por mês
4. Botão "Marcar como Quitado" quando houver dívida
5. Gráfico pizza mostrando proporção de gastos (opcional)

## Features de UX
1. Loading states em todas as chamadas de API
2. Toast notifications para ações (sucesso/erro)
3. Confirmação antes de deletar
4. Valores monetários sempre formatados (R$ 1.234,56)
5. Responsivo: funcionar bem em mobile

Teste o fluxo completo: criar orçamento → adicionar transação → ver compartilhados.
```

### ETAPA 6: Refinamento e Deploy

```markdown
Finalize o OCO com refinamentos e prepare para deploy:

## Refinamentos de UX
1. Adicione animações suaves (Tailwind transitions)
2. Melhore feedback visual:
   - Skeleton loaders durante carregamento
   - Estados vazios com mensagens úteis
   - Indicadores visuais de sucesso (check verde) após salvar
3. Adicione atalhos:
   - Enter para salvar formulários
   - Esc para fechar modais
   - Tab navigation funcionando corretamente
4. Persista filtros selecionados no localStorage

## Otimizações
1. Implemente cache básico no frontend (5min para dados do orçamento)
2. Adicione debounce em campos de busca/filtro
3. Lazy loading para listas grandes de transações
4. Comprima build do frontend

## Correções e Validações
1. Teste e corrija:
   - Fluxo de cartão de crédito
   - Cálculo de despesas compartilhadas
   - Atualização de saldos
2. Adicione validações que faltam:
   - Datas futuras em transações
   - Valores negativos
   - Limites de caracteres
3. Tratamento de erros amigável

## Preparação para Deploy
1. Backend:
   - Configure PM2 ecosystem file
   - Crie script de backup do banco
   - Configure nginx como reverse proxy
   - Adicione health check endpoint
2. Frontend:
   - Build otimizado para produção
   - Configure nginx para servir arquivos estáticos
   - Adicione meta tags e favicon
3. Scripts úteis:
   - Reset de senha (via SQL direto)
   - Backup/restore do banco
   - Logs rotation

## Documentação
1. README.md com:
   - Instruções de instalação
   - Configuração de ambiente
   - Comandos úteis
2. Crie USAGE.md com guia de uso básico

## Testes Finais
1. Teste o fluxo completo de um mês:
   - Criar orçamento
   - Adicionar transações variadas
   - Verificar cálculos
   - Conferir compartilhamento
2. Teste em diferentes dispositivos (mobile/desktop)
3. Verifique performance com muitas transações

Após esses ajustes, o MVP estará pronto para uso pessoal!
```

## Dicas para Melhores Resultados com Claude Code

### 1. Seja Específico
```markdown
❌ "Crie um formulário de transação"

✅ "Crie um formulário de transação usando React Hook Form e Zod com os campos: 
data (date picker), valor (input monetário R$), categoria (select), 
compartilhada (checkbox). Use Shadcn UI components."
```

### 2. Forneça Contexto
```markdown
"Continuando o desenvolvimento do OCO, já temos o backend com autenticação JWT funcionando.
Agora preciso implementar a tela de orçamento que mostra grupos e categorias..."
```

### 3. Peça Verificação
```markdown
"Após implementar, verifique se:
1. A lógica do cartão de crédito está movendo dinheiro entre categorias
2. O cálculo de 'Pronto para Atribuir' está correto
3. As transações compartilhadas estão sendo filtradas corretamente"
```

### 4. Iteração Incremental
```markdown
"Primeiro, crie apenas a estrutura básica da tela com dados mockados.
Depois conectaremos com a API."
```

### 4. Correções Direcionadas
```markdown
"Há um bug no cálculo de despesas compartilhadas. 
O valor deveria ser dividido 50/50, mas está mostrando o valor total.
Corrija no arquivo shared.service.ts, método calculateOwedAmount()"
```

### 5. Hooks Customizados com Zustand
```typescript
// src/hooks/useBudget.ts
import { useEffect } from 'react';
import { useBudgetStore } from '@/stores/budget.store';

export function useBudget(month?: Date) {
  const { groups, readyToAssign, isLoading, loadBudget } = useBudgetStore();
  
  useEffect(() => {
    loadBudget(month || new Date());
  }, [month]);
  
  return { groups, readyToAssign, isLoading };
}

// Uso no componente
function BudgetPage() {
  const { groups, readyToAssign, isLoading } = useBudget();
  
  if (isLoading) return <Skeleton />;
  
  return (
    <div>
      <Card>Pronto para atribuir: R$ {readyToAssign}</Card>
      {groups.map(group => (
        <GroupCard key={group.id} group={group} />
      ))}
    </div>
  );
}
```

## Troubleshooting Comum

### Problema: Erro de CORS
**Solução**: Configure CORS no main.ts do NestJS:
```typescript
app.enableCors({
  origin: 'http://localhost:5173',
  credentials: true,
});
```

### Problema: JWT não persiste
**Solução**: Zustand já persiste automaticamente com persist middleware:
```typescript
// O token é salvo automaticamente no localStorage
export const useAuthStore = create()(
  persist(
    (set) => ({ /* ... */ }),
    { name: 'auth-storage' }
  )
);
```

### Problema: Estado não sincroniza entre componentes
**Solução**: Com Zustand, o estado é global automaticamente:
```typescript
// Componente A
const { user } = useAuthStore();

// Componente B - sempre sincronizado
const { user } = useAuthStore();
```

### Problema: Múltiplas chamadas à API
**Solução**: Use o loading state do Zustand para prevenir:
```typescript
const { isLoading, loadBudget } = useBudgetStore();

useEffect(() => {
  if (!isLoading) {
    loadBudget(currentMonth);
  }
}, [currentMonth]);
```

### Problema: Cálculos incorretos
**Solução**: Use Decimal.js ou trabalhe com centavos (integers)

## Comandos Úteis para Desenvolvimento

```bash
# Backend - Setup inicial
cd backend
npm install @nestjs/cli -g
nest new . --package-manager npm
npm install @nestjs/typeorm typeorm pg
npm install @nestjs/passport passport passport-jwt @nestjs/jwt
npm install bcrypt class-validator class-transformer
npm install @nestjs/swagger swagger-ui-express
npm install --save-dev @types/bcrypt @types/passport-jwt

# Frontend - Setup inicial
cd frontend
npm create vite@latest . -- --template react-ts
npm install
npm install axios zustand
npm install react-router-dom
npm install react-hook-form @hookform/resolvers zod
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
npx shadcn-ui@latest init
npx shadcn-ui@latest add button card input select form toast

# Backend - Development
cd backend
npm run start:dev
npm run test:watch
npm run migration:generate -- -n AddNewField
npm run seed

# Frontend - Development  
cd frontend
npm run dev
npm run build
npm run preview

# Database
docker-compose up -d postgres
psql -U oco_user -d oco_db

# Logs
pm2 logs oco-api
tail -f /var/log/nginx/error.log

# Backup
pg_dump -U oco_user oco_db > backup.sql
psql -U oco_user oco_db < backup.sql
```
