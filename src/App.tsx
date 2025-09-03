import './App.css'
import AuthLayout from './components/layouts/AuthLayout';
import Header from './components/partials/Header'
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import ForgotPassword from './pages/auth/ForgotPassword';
import Forbidden from './components/errors/Forbidden';
import NotFound from './components/errors/NotFound';
import MainLayout from './components/layouts/MainLayout';
import Home from './pages/Home';
import AuthProtectedRoute from './components/guards/AuthProtectedRoute';
import useAuth from "./hooks/useAuth";
import UserProfile from './pages/Profile';
import MapLayout from './components/layouts/MapLayout';

function App() {
  const { isAuthenticated } = useAuth();

  return (
    <BrowserRouter
    >
      <Routes>
        <Route path='/auth' element={isAuthenticated ? <Navigate to={`/map`} replace /> : <AuthLayout />}>
          <Route path='/auth/login' element={<Login />} />
          <Route path='/auth/register' element={<Register />} />
          <Route path='/auth/forgot-password' element={<ForgotPassword />} />
        </Route>

        <Route path='/' element={
          <AuthProtectedRoute>
            <MainLayout />
          </AuthProtectedRoute>
        }>
          <Route path='/' element={ <Navigate to={`/map`} replace /> } />
          <Route path='/profile' element={<UserProfile />} />
        </Route>
        
        <Route path='/map' element={
          <AuthProtectedRoute>
            <MapLayout />
          </AuthProtectedRoute>
        } />

        <Route path='/403' element={<Forbidden />} />

        <Route path='*' element={<NotFound />} />
      </Routes>
          
    </BrowserRouter>
  )
}

export default App
