export default function Shared() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-white">Gastos Compartilhados</h1>
      
      <div className="bg-gray-800 p-6 rounded-lg">
        <h2 className="text-xl font-semibold text-white mb-4">Balanço do Mês</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <div className="text-sm text-gray-400">Usuário 1 pagou</div>
            <div className="text-xl font-bold text-green-400">R$ 0,00</div>
          </div>
          <div>
            <div className="text-sm text-gray-400">Usuário 2 pagou</div>
            <div className="text-xl font-bold text-blue-400">R$ 0,00</div>
          </div>
          <div>
            <div className="text-sm text-gray-400">Status</div>
            <div className="text-xl font-bold text-green-400">Quitado</div>
          </div>
        </div>
      </div>
      
      <div className="bg-gray-800 p-6 rounded-lg">
        <h2 className="text-xl font-semibold text-white mb-4">Transações Compartilhadas</h2>
        <div className="text-gray-400">Nenhuma transação compartilhada encontrada</div>
      </div>
    </div>
  );
}