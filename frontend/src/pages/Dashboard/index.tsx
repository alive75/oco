export default function Dashboard() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-white">Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gray-800 p-6 rounded-lg">
          <h3 className="text-lg font-semibold text-white mb-2">Orçamento do Mês</h3>
          <div className="text-2xl font-bold text-green-400">R$ 0,00</div>
          <div className="text-sm text-gray-400">Disponível para alocar</div>
        </div>
        <div className="bg-gray-800 p-6 rounded-lg">
          <h3 className="text-lg font-semibold text-white mb-2">Saldo Total</h3>
          <div className="text-2xl font-bold text-blue-400">R$ 0,00</div>
          <div className="text-sm text-gray-400">Todas as contas</div>
        </div>
        <div className="bg-gray-800 p-6 rounded-lg">
          <h3 className="text-lg font-semibold text-white mb-2">Gastos Compartilhados</h3>
          <div className="text-2xl font-bold text-yellow-400">R$ 0,00</div>
          <div className="text-sm text-gray-400">Este mês</div>
        </div>
      </div>
      
      <div className="bg-gray-800 p-6 rounded-lg">
        <h2 className="text-xl font-semibold text-white mb-4">Transações Recentes</h2>
        <div className="text-gray-400">Nenhuma transação encontrada</div>
      </div>
    </div>
  );
}