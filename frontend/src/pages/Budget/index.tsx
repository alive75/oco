import { useState, useEffect } from 'react';
import { useBudgetStore } from '../../stores/budget.store';
import { formatCurrency } from '../../utils/currency';
import { BudgetSkeleton } from '../../components/Skeleton';
import { 
  ChevronLeft as ChevronLeftIcon, 
  ChevronRight as ChevronRightIcon, 
  Plus as PlusIcon,
  ChevronDown as ChevronDownIcon,
  ChevronUp as ChevronUpIcon 
} from 'lucide-react';

export default function Budget() {
  const {
    currentMonth,
    groups,
    readyToAssign,
    isLoading,
    setCurrentMonth,
    loadBudget,
    updateCategory,
    createGroup,
    createCategory
  } = useBudgetStore();

  const [expandedGroups, setExpandedGroups] = useState<Set<number>>(new Set());
  const [editingCategory, setEditingCategory] = useState<number | null>(null);
  const [categoryValue, setCategoryValue] = useState<string>('');
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [showCreateCategory, setShowCreateCategory] = useState<number | null>(null);
  const [newGroupName, setNewGroupName] = useState('');
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryAmount, setNewCategoryAmount] = useState('');

  useEffect(() => {
    loadBudget(currentMonth);
  }, [loadBudget, currentMonth]);

  const formatMonthYear = (date: Date) => {
    return date.toLocaleDateString('pt-BR', { 
      month: 'long', 
      year: 'numeric' 
    });
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    const newMonth = new Date(currentMonth);
    if (direction === 'prev') {
      newMonth.setMonth(newMonth.getMonth() - 1);
    } else {
      newMonth.setMonth(newMonth.getMonth() + 1);
    }
    setCurrentMonth(newMonth);
  };

  const toggleGroup = (groupId: number) => {
    const newExpanded = new Set(expandedGroups);
    if (newExpanded.has(groupId)) {
      newExpanded.delete(groupId);
    } else {
      newExpanded.add(groupId);
    }
    setExpandedGroups(newExpanded);
  };

  const handleCategoryEdit = (categoryId: number, currentAmount: number) => {
    setEditingCategory(categoryId);
    setCategoryValue(currentAmount.toString());
  };

  const saveCategoryAmount = async (categoryId: number) => {
    try {
      const amount = parseFloat(categoryValue) || 0;
      await updateCategory(categoryId, { allocated_amount: amount });
      setEditingCategory(null);
    } catch (error) {
      console.error('Erro ao salvar categoria:', error);
    }
  };

  const cancelCategoryEdit = () => {
    setEditingCategory(null);
    setCategoryValue('');
  };

  const handleCreateGroup = async () => {
    if (!newGroupName.trim()) return;
    
    try {
      await createGroup({
        name: newGroupName,
        month_year: currentMonth.toISOString().slice(0, 7) // YYYY-MM format
      });
      setNewGroupName('');
      setShowCreateGroup(false);
    } catch (error) {
      console.error('Erro ao criar grupo:', error);
    }
  };

  const handleCreateCategory = async (groupId: number) => {
    if (!newCategoryName.trim()) return;
    
    try {
      const amount = parseFloat(newCategoryAmount) || 0;
      await createCategory({
        name: newCategoryName,
        allocated_amount: amount,
        group_id: groupId
      });
      setNewCategoryName('');
      setNewCategoryAmount('');
      setShowCreateCategory(null);
    } catch (error) {
      console.error('Erro ao criar categoria:', error);
    }
  };

  const getProgressPercentage = (spent: number, allocated: number) => {
    if (allocated === 0) return 0;
    return Math.min((spent / allocated) * 100, 100);
  };

  const getProgressColor = (spent: number, allocated: number) => {
    if (spent > allocated) return 'bg-red-500';
    if (spent / allocated > 0.8) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  if (isLoading) {
    return <BudgetSkeleton />;
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Header com navegação do mês */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={() => navigateMonth('prev')}
          className="p-2 text-gray-400 hover:text-white rounded-md hover:bg-gray-700 transition-colors duration-200"
        >
          <ChevronLeftIcon className="h-5 w-5" />
        </button>
        
        <h1 className="text-2xl font-bold text-white capitalize">
          {formatMonthYear(currentMonth)}
        </h1>
        
        <button
          onClick={() => navigateMonth('next')}
          className="p-2 text-gray-400 hover:text-white rounded-md hover:bg-gray-700 transition-colors duration-200"
        >
          <ChevronRightIcon className="h-5 w-5" />
        </button>
      </div>

      {/* Card "Pronto para Atribuir" */}
      <div className="bg-gray-800 rounded-lg p-6 mb-6 border-l-4 border-blue-500">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-300">
              Pronto para Atribuir
            </h2>
            <p className="text-sm text-gray-400">
              Valor disponível para alocar em categorias
            </p>
          </div>
          <div className={`text-2xl font-bold ${
            readyToAssign >= 0 ? 'text-green-400' : 'text-red-400'
          }`}>
            {formatCurrency(readyToAssign)}
          </div>
        </div>
      </div>

      {/* Lista de Grupos */}
      <div className="space-y-4">
        {groups.map((group) => (
          <div key={group.id} className="bg-gray-800 rounded-lg overflow-hidden">
            {/* Header do Grupo */}
            <div
              className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-700 transition-colors duration-200"
              onClick={() => toggleGroup(group.id)}
            >
              <div className="flex items-center space-x-3">
                {expandedGroups.has(group.id) ? (
                  <ChevronDownIcon className="h-5 w-5 text-gray-400" />
                ) : (
                  <ChevronUpIcon className="h-5 w-5 text-gray-400" />
                )}
                <div>
                  <h3 className="text-lg font-semibold text-white">
                    {group.name}
                  </h3>
                  <p className="text-sm text-gray-400">
                    {group.categories.length} categorias
                  </p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-lg font-semibold text-white">
                  {formatCurrency(group.total_allocated)}
                </div>
                <div className="text-sm text-gray-400">Total alocado</div>
              </div>
            </div>

            {/* Lista de Categorias (expandível) */}
            {expandedGroups.has(group.id) && (
              <div className="border-t border-gray-700 animate-in slide-in-from-top-2 duration-300">
                <div className="p-4 space-y-3">
                  {group.categories.map((category) => (
                    <div
                      key={category.id}
                      className="flex items-center justify-between py-3 px-4 bg-gray-700 rounded-lg"
                    >
                      <div className="flex-1">
                        <h4 className="text-white font-medium">
                          {category.name}
                        </h4>
                        
                        {/* Barra de Progresso */}
                        <div className="mt-2">
                          <div className="flex items-center justify-between text-sm text-gray-400 mb-1">
                            <span>Gasto: {formatCurrency(category.spent)}</span>
                            <span>Alocado: {formatCurrency(category.allocated_amount)}</span>
                          </div>
                          <div className="w-full bg-gray-600 rounded-full h-2">
                            <div
                              className={`h-2 rounded-full transition-all ${
                                getProgressColor(category.spent, category.allocated_amount)
                              }`}
                              style={{
                                width: `${getProgressPercentage(
                                  category.spent,
                                  category.allocated_amount
                                )}%`
                              }}
                            ></div>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center space-x-4 ml-4">
                        {/* Campo de edição ou valor */}
                        {editingCategory === category.id ? (
                          <div className="flex items-center space-x-2">
                            <input
                              type="number"
                              step="0.01"
                              value={categoryValue}
                              onChange={(e) => setCategoryValue(e.target.value)}
                              className="w-24 px-2 py-1 bg-gray-600 border border-gray-500 rounded text-white text-sm"
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  saveCategoryAmount(category.id);
                                } else if (e.key === 'Escape') {
                                  cancelCategoryEdit();
                                }
                              }}
                              autoFocus
                            />
                            <button
                              onClick={() => saveCategoryAmount(category.id)}
                              className="px-2 py-1 bg-green-600 hover:bg-green-700 rounded text-xs text-white"
                            >
                              ✓
                            </button>
                            <button
                              onClick={cancelCategoryEdit}
                              className="px-2 py-1 bg-gray-600 hover:bg-gray-700 rounded text-xs text-white"
                            >
                              ✕
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => handleCategoryEdit(category.id, category.allocated_amount)}
                            className="text-right hover:bg-gray-600 px-2 py-1 rounded transition-colors duration-200"
                          >
                            <div className="text-white font-semibold">
                              {formatCurrency(category.allocated_amount)}
                            </div>
                          </button>
                        )}

                        {/* Valor Disponível */}
                        <div className="text-right">
                          <div className={`text-sm font-semibold ${
                            category.available >= 0 ? 'text-green-400' : 'text-red-400'
                          }`}>
                            {formatCurrency(category.available)}
                          </div>
                          <div className="text-xs text-gray-400">Disponível</div>
                        </div>
                      </div>
                    </div>
                  ))}

                  {/* Botão para adicionar categoria */}
                  {showCreateCategory === group.id ? (
                    <div className="flex items-center space-x-2 py-3 px-4 bg-gray-700 rounded-lg border-2 border-dashed border-gray-500">
                      <input
                        type="text"
                        placeholder="Nome da categoria"
                        value={newCategoryName}
                        onChange={(e) => setNewCategoryName(e.target.value)}
                        className="flex-1 px-2 py-1 bg-gray-600 border border-gray-500 rounded text-white text-sm"
                      />
                      <input
                        type="number"
                        step="0.01"
                        placeholder="Valor"
                        value={newCategoryAmount}
                        onChange={(e) => setNewCategoryAmount(e.target.value)}
                        className="w-24 px-2 py-1 bg-gray-600 border border-gray-500 rounded text-white text-sm"
                      />
                      <button
                        onClick={() => handleCreateCategory(group.id)}
                        className="px-3 py-1 bg-green-600 hover:bg-green-700 rounded text-sm text-white"
                      >
                        Criar
                      </button>
                      <button
                        onClick={() => setShowCreateCategory(null)}
                        className="px-3 py-1 bg-gray-600 hover:bg-gray-700 rounded text-sm text-white"
                      >
                        Cancelar
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setShowCreateCategory(group.id)}
                      className="flex items-center justify-center py-3 px-4 bg-gray-700 rounded-lg border-2 border-dashed border-gray-500 hover:border-gray-400 text-gray-400 hover:text-gray-300 transition-all duration-200"
                    >
                      <PlusIcon className="h-4 w-4 mr-2" />
                      Adicionar Categoria
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        ))}

        {/* Botão para adicionar grupo */}
        {showCreateGroup ? (
          <div className="bg-gray-800 rounded-lg p-4 border-2 border-dashed border-gray-500">
            <div className="flex items-center space-x-4">
              <input
                type="text"
                placeholder="Nome do grupo"
                value={newGroupName}
                onChange={(e) => setNewGroupName(e.target.value)}
                className="flex-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleCreateGroup();
                }}
                autoFocus
              />
              <button
                onClick={handleCreateGroup}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded text-white"
              >
                Criar Grupo
              </button>
              <button
                onClick={() => {
                  setShowCreateGroup(false);
                  setNewGroupName('');
                }}
                className="px-4 py-2 bg-gray-600 hover:bg-gray-700 rounded text-white"
              >
                Cancelar
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setShowCreateGroup(true)}
            className="w-full flex items-center justify-center py-4 bg-gray-800 rounded-lg border-2 border-dashed border-gray-600 hover:border-gray-500 text-gray-400 hover:text-gray-300 transition-all duration-200"
          >
            <PlusIcon className="h-5 w-5 mr-2" />
            Adicionar Grupo
          </button>
        )}
      </div>
    </div>
  );
}