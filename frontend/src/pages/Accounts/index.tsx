export default function Accounts() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-white">Contas</h1>
        <button className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded">
          Nova Conta
        </button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-gray-800 p-6 rounded-lg text-center">
          <h3 className="text-lg font-semibold text-white mb-2">Nenhuma conta criada</h3>
          <p className="text-gray-400 mb-4">Comece adicionando suas contas bancárias</p>
          <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded">
            Adicionar Primeira Conta
          </button>
        </div>
      </div>
    </div>
  );
}