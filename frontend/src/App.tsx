import { Outlet, Navigate, Link, useLocation } from 'react-router-dom';

function App() {
  const location = useLocation();
  
  // Mock authentication check - replace with real auth logic later
  const isAuthenticated = false; // TODO: replace with real auth check

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  const navigation = [
    { name: 'Dashboard', href: '/dashboard' },
    { name: 'Orçamento', href: '/budget' },
    { name: 'Contas', href: '/accounts' },
    { name: 'Compartilhados', href: '/shared' },
  ];

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Header */}
      <header className="bg-gray-800 border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-bold text-white">OCO</h1>
              <nav className="ml-10 flex space-x-8">
                {navigation.map((item) => (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={`${
                      location.pathname === item.href
                        ? 'text-white border-b-2 border-blue-500'
                        : 'text-gray-300 hover:text-white'
                    } px-3 py-2 text-sm font-medium transition-colors`}
                  >
                    {item.name}
                  </Link>
                ))}
              </nav>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-gray-300">Usuário Logado</span>
              <button className="text-gray-300 hover:text-white">
                Sair
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <Outlet />
      </main>
    </div>
  );
}

export default App;
