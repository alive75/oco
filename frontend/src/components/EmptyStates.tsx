import { 
  Building2 as BuildingIcon, 
  CreditCard as CreditCardIcon,
  Plus as PlusIcon,
  Receipt as ReceiptIcon,
  Users as UsersIcon,
  Wallet as WalletIcon 
} from 'lucide-react';

interface EmptyStateProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  actionButton?: React.ReactNode;
}

function EmptyState({ title, description, icon, actionButton }: EmptyStateProps) {
  return (
    <div className="bg-gray-800 rounded-lg p-12 text-center">
      <div className="text-gray-400 mb-4">
        {icon}
      </div>
      <h3 className="text-lg font-semibold text-gray-300 mb-2">
        {title}
      </h3>
      <p className="text-gray-400 mb-6 max-w-md mx-auto">
        {description}
      </p>
      {actionButton}
    </div>
  );
}

export function NoAccountsSelected() {
  return (
    <EmptyState
      title="Selecione uma Conta"
      description="Escolha uma conta na lista ao lado para ver suas transações e adicionar movimentações"
      icon={<BuildingIcon className="h-12 w-12 mx-auto mb-4" />}
    />
  );
}

export function NoAccounts({ onAddAccount }: { onAddAccount?: () => void }) {
  return (
    <EmptyState
      title="Nenhuma Conta Cadastrada"
      description="Você ainda não possui contas cadastradas. Adicione sua primeira conta para começar a controlar suas finanças."
      icon={<WalletIcon className="h-12 w-12 mx-auto mb-4" />}
      actionButton={
        onAddAccount && (
          <button
            onClick={onAddAccount}
            className="flex items-center space-x-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg mx-auto transition-colors duration-200"
          >
            <PlusIcon className="h-4 w-4" />
            <span>Adicionar Primeira Conta</span>
          </button>
        )
      }
    />
  );
}

export function NoTransactions({ onAddTransaction }: { onAddTransaction?: () => void }) {
  return (
    <EmptyState
      title="Nenhuma Transação Encontrada"
      description="Esta conta ainda não possui transações. Adicione uma transação para começar a rastrear suas movimentações."
      icon={<ReceiptIcon className="h-12 w-12 mx-auto mb-4" />}
      actionButton={
        onAddTransaction && (
          <button
            onClick={onAddTransaction}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg mx-auto transition-colors duration-200"
          >
            <PlusIcon className="h-4 w-4" />
            <span>Adicionar Primeira Transação</span>
          </button>
        )
      }
    />
  );
}

export function NoBudgetGroups({ onAddGroup }: { onAddGroup?: () => void }) {
  return (
    <EmptyState
      title="Nenhum Grupo de Orçamento"
      description="Crie seu primeiro grupo de orçamento para organizar suas categorias e começar a planejar seus gastos mensais."
      icon={<CreditCardIcon className="h-12 w-12 mx-auto mb-4" />}
      actionButton={
        onAddGroup && (
          <button
            onClick={onAddGroup}
            className="flex items-center space-x-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg mx-auto transition-colors duration-200"
          >
            <PlusIcon className="h-4 w-4" />
            <span>Criar Primeiro Grupo</span>
          </button>
        )
      }
    />
  );
}

export function NoSharedExpenses() {
  return (
    <EmptyState
      title="Nenhuma Despesa Compartilhada"
      description="As transações marcadas como 'compartilhadas' aparecerão aqui. Adicione transações e marque-as como compartilhadas para dividir os custos."
      icon={<UsersIcon className="h-12 w-12 mx-auto mb-4" />}
    />
  );
}

export function LoadingTransactions() {
  return (
    <div className="p-6 text-center text-gray-400">
      <div className="animate-pulse flex items-center justify-center space-x-2">
        <ReceiptIcon className="h-5 w-5" />
        <span>Carregando transações...</span>
      </div>
    </div>
  );
}