import { createBrowserRouter, Navigate, type RouteObject } from 'react-router-dom'
import AuthLayout from '../components/layouts/AuthLayout'
import LoginPage from '../pages/auth/LoginPage'
import RegisterPage from '../pages/auth/RegisterPage'
import ForgotPasswordPage from '../pages/auth/ForgetPasswordPage'
import HomePage from '../pages/home/HomePage'
import ProfilePage from '../pages/profile/ProfilePage'

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
  {
    path: '/profile',
    element: <ProfilePage />,
  },

  // Fallback
  {
    path: '*',
    element: <Navigate to="/" replace />,
  },
]

const router = createBrowserRouter(routes)

export default router
