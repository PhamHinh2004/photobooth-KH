import { createBrowserRouter, Navigate, type RouteObject } from 'react-router-dom'
import AuthLayout from '../components/layouts/AuthLayout'
import AdminLayout from '../components/layouts/AdminLayout'
import LoginPage from '../pages/auth/LoginPage'
import RegisterPage from '../pages/auth/RegisterPage'
import ForgotPasswordPage from '../pages/auth/ForgetPasswordPage'
import OAuthCallbackPage from '../pages/auth/OAuthCallbackPage'
import HomePage from '../pages/home/HomePage'
import AboutUsPage from '../pages/about/AboutUsPage'
import ProfilePage from '../pages/profile/ProfilePage'
import ChangePasswordPage from '../pages/profile/ChangePasswordPage'
import AccountsPage from '../pages/admin/AccountsPage'
import CapturePage from '../pages/capture/CapturePage'
import FeedPage from '../pages/social/FeedPage'
import PostDetailPage from '../pages/social/PostDetailPage'
import MyPostsPage from '../pages/social/MyPostsPage'
import PublicLayout from '../components/layouts/PublicLayout'

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
  {
    path: '/oauth-callback',
    element: <OAuthCallbackPage />,
  },

  // Admin routes
  {
    path: '/admin',
    element: <AdminLayout />,
    children: [
      {
        index: true,
        element: <Navigate to="/admin/accounts" replace />,
      },
      {
        path: 'accounts',
        element: <AccountsPage />,
      },
    ],
  },

  // Public home page
  {
    path: '/',
    element: <HomePage />,
  },
  {
    path: '/about-us',
    element: <AboutUsPage />,
  },
  {
    path: '/profile',
    element: <ProfilePage />,
  },
  {
    path: '/change-password',
    element: <ChangePasswordPage />,
  },

  // Photobooth capture
  {
    path: '/capture',
    element: <CapturePage />,
  },

  // Social / Reviews
  {
    path: '/reviews',
    element: <PublicLayout><FeedPage /></PublicLayout>,
  },
  {
    path: '/reviews/:id',
    element: <PublicLayout><PostDetailPage /></PublicLayout>,
  },
  {
    path: '/my-posts',
    element: <PublicLayout><MyPostsPage /></PublicLayout>,
  },

  // Fallback
  {
    path: '*',
    element: <Navigate to="/" replace />,
  },
]

const router = createBrowserRouter(routes)

export default router
