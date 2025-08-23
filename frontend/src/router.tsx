import { createBrowserRouter, Navigate } from 'react-router-dom';
import { ProtectedRoute } from './components/ProtectedRoute';
import App from './App';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Budget from './pages/Budget';
import Accounts from './pages/Accounts';
import Shared from './pages/Shared';

export const router = createBrowserRouter([
  {
    path: '/login',
    element: <Login />,
  },
  {
    path: '/',
    element: (
      <ProtectedRoute>
        <App />
      </ProtectedRoute>
    ),
    children: [
      {
        index: true,
        element: <Navigate to="/dashboard" replace />,
      },
      {
        path: 'dashboard',
        element: <Dashboard />,
      },
      {
        path: 'budget',
        element: <Budget />,
      },
      {
        path: 'accounts',
        element: <Accounts />,
      },
      {
        path: 'shared',
        element: <Shared />,
      },
    ],
  },
]);