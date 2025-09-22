import './App.css'
import AuthLayout from './components/layouts/AuthLayout';
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import ForgotPassword from './pages/auth/ForgotPassword';
import Forbidden from './components/errors/Forbidden';
import NotFound from './components/errors/NotFound';
import MainLayout from './components/layouts/MainLayout';
import AuthProtectedRoute from './components/guards/AuthProtectedRoute';
import useAuth from "./hooks/useAuth";
import UserProfile from './pages/Profile';
import MapLayout from './components/layouts/MapLayout';
import { hasToken, isFullyAuthenticated } from './utils/tools';
import DashboardLayout from './components/layouts/DashboardLayout';
import AdminUsersPage from './pages/dashboard/AdminUsersPage';
import AdminDashboard from './pages/dashboard/AdminDashboard';
import AdminObservations from './pages/dashboard/AdminObservations';
import Map2D from './components/maps/Map2D';
import Map3D from './components/maps/Map3D';
import OSMBuildingsMap from './components/maps/OSMBuildingsMap';
import UserObservationsPage from './pages/ObservationsPage';
import DrawableLeafletMap from './components/maps/DrawableLeafletMap';
import PlotEditionPage from './pages/PlotEditionPage';

function App() {
  const { isAuthenticated } = useAuth();

  return (
    <BrowserRouter
    >
      <Routes>
        <Route path='/auth' element={isFullyAuthenticated(isAuthenticated) && hasToken() ? <Navigate to={`/map`} replace /> : <AuthLayout />}>
          <Route path='/auth/login' element={<Login />} />
          <Route path='/auth/register' element={<Register />} />
          <Route path='/auth/forgot-password' element={<ForgotPassword />} />
        </Route>

        <Route path='/' element={
          <AuthProtectedRoute>
            <MainLayout />
          </AuthProtectedRoute>
        }>
          {/* <Route path='/' element={ <Navigate to={`/map`} replace /> } /> */}
          <Route path='/admin' element={<UserProfile />} />
          <Route path='/observations' element={<UserObservationsPage />} />
          <Route path='/profile' element={<UserProfile />} />
        </Route>

        <Route path='/dashboard' element={
          <AuthProtectedRoute>
            <DashboardLayout />
          </AuthProtectedRoute>
        }>
          <Route path='/dashboard' element={<AdminDashboard />} />
          <Route path='/dashboard/users' element={<AdminUsersPage />} />
          <Route path='/dashboard/observations' element={<AdminObservations />} />
        </Route>
        
        <Route path='/map' element={
          <AuthProtectedRoute>
            <MapLayout />
          </AuthProtectedRoute>
        } >
          <Route path='/map/' element={ <Navigate to={`/map/2D`} replace /> } />
          <Route path='/map/2D' element={<Map2D />} />
          <Route path='/map/3D' element={<Map3D />} />
          <Route path='/map/osm-buildings' element={<OSMBuildingsMap />} />
          <Route path='/map/drawable' element={<DrawableLeafletMap />} />

          <Route path='/map/plot-edition' element={<PlotEditionPage />} />
        </Route>

        <Route path='/403' element={<Forbidden />} />

        <Route path='*' element={<NotFound />} />
      </Routes>
          
    </BrowserRouter>
  )
}

export default App
