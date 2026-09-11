import { createBrowserRouter, Navigate, type RouteObject } from 'react-router-dom'
import ProtectedRoute from './ProtectedRoute'
import AuthLayout from '../components/layouts/AuthLayout'
import MainLayout from '../components/layouts/MainLayout'
import LoginPage from '../pages/auth/LoginPage'
import RegisterPage from '../pages/auth/RegisterPage'
import ForgotPasswordPage from '../pages/auth/ForgetPasswordPage'
import DashboardPage from '../pages/dashboard/DashboardPage'
import HomePage from '../pages/home/HomePage'

const routes: RouteObject[] = [
  // Auth routes (không cần đăng nhập)
  {
    element: <AuthLayout />,
    children: [
      {
        path: '/login',
        element: <LoginPage />,
      },
      {
        path: '/register',
        element: <RegisterPage />,
      },
      {
        path: '/forgot-password',
        element: <ForgotPasswordPage />,
      },
      {
        path: '/forgetpassword',
        element: <ForgotPasswordPage />,
      },
    ],
  },

  // Public home page
  {
    path: '/',
    element: <HomePage />,
  },

  // Protected routes (cần đăng nhập)
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <MainLayout />,
        children: [
          {
            path: '/dashboard',
            element: <DashboardPage />,
          },
        ],
      },
    ],
  },

  // Fallback
  {
    path: '*',
    element: <Navigate to="/dashboard" replace />,
  },
]

const router = createBrowserRouter(routes)

export default router
