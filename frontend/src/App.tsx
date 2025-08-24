import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from './stores/auth.store';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';

function App() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', key: 'd' },
    { name: 'Orçamento', href: '/budget', key: 'b' },
    { name: 'Contas', href: '/accounts', key: 'c' },
    { name: 'Compartilhados', href: '/shared', key: 's' },
  ];

  // Global navigation shortcuts
  useKeyboardShortcuts([
    {
      key: 'd',
      ctrlKey: true,
      callback: () => navigate('/dashboard'),
    },
    {
      key: 'b',
      ctrlKey: true,
      callback: () => navigate('/budget'),
    },
    {
      key: 'c',
      ctrlKey: true,
      callback: () => navigate('/accounts'),
    },
    {
      key: 's',
      ctrlKey: true,
      callback: () => navigate('/shared'),
    },
    {
      key: 'l',
      ctrlKey: true,
      shiftKey: true,
      callback: () => logout(),
    }
  ], true);

  return (
    <div className="min-h-screen bg-gray-900">
      <header className="bg-gray-800 border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-bold text-white">OCO</h1>
              <nav className="hidden md:ml-10 md:flex md:space-x-8">
                {navigation.map((item) => (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={`${
                      location.pathname === item.href
                        ? 'text-white border-b-2 border-blue-500'
                        : 'text-gray-300 hover:text-white'
                    } px-3 py-2 text-sm font-medium transition-colors flex items-center space-x-2`}
                  >
                    <span>{item.name}</span>
                    <span className="text-xs opacity-50 hidden lg:inline">
                      (Ctrl+{item.key.toUpperCase()})
                    </span>
                  </Link>
                ))}
              </nav>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-gray-300 text-sm">{user?.name}</span>
              <button 
                onClick={logout}
                className="text-gray-300 hover:text-white text-sm font-medium flex items-center space-x-2"
              >
                <span>Sair</span>
                <span className="text-xs opacity-50 hidden lg:inline">
                  (Ctrl+Shift+L)
                </span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <Outlet />
      </main>
    </div>
  );
}

export default App;
