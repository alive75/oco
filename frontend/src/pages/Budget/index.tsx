export default function Budget() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-white">Orçamento</h1>
        <div className="flex space-x-2">
          <button className="px-3 py-1 text-white hover:bg-gray-700 rounded">←</button>
          <span className="px-4 py-2 text-white font-medium">Janeiro 2024</span>
          <button className="px-3 py-1 text-white hover:bg-gray-700 rounded">→</button>
        </div>
      </div>
      
      <div className="bg-gray-800 p-6 rounded-lg">
        <h2 className="text-lg font-semibold text-green-400 mb-2">Pronto para Atribuir</h2>
        <div className="text-3xl font-bold text-green-400">R$ 0,00</div>
      </div>
      
      <div className="space-y-4">
        <div className="bg-gray-800 p-6 rounded-lg">
          <h3 className="text-lg font-semibold text-white mb-4">Nenhum grupo criado</h3>
          <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded">
            Adicionar Grupo
          </button>
        </div>
      </div>
    </div>
  );
}