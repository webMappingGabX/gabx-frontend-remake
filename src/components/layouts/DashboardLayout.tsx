import { useEffect, useState } from "react";
import { Outlet, Link, useLocation } from "react-router-dom";
import { 
  LayoutDashboard, 
  Users, 
  Binoculars, 
  Menu,
  X, 
  LogOut,
  Settings,
  FileText,
  Map,
  BarChart3,
  Shield,
  Home
} from "lucide-react";
import { Button } from "../../components/ui/button";
import { useDispatch, useSelector } from "react-redux";
import { logoutUser, selectAuthUser } from "../../app/store/slices/authSlice";
import { useToast } from "../../hooks/useToast";

const DashboardLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const dispatch = useDispatch();
  const { toast } = useToast();
  const authUser = useSelector(selectAuthUser);

  useEffect(() => {
    console.log("AUTH USER", authUser);
  }, [authUser])
  
  const handleLogout = async () => {
    try {
      await dispatch(logoutUser());
      toast({
        title: "Déconnexion réussie",
        description: "Vous avez été déconnecté avec succès.",
      });
    } catch (error) {
      console.error("Erreur lors de la déconnexion:", error);
    }
  };

  const navigationItems = [
    {
      name: "Retourner à la carte",
      href: "/map",
      icon: Home,
      isActive: location.pathname === "/map"
    },
    {
      name: "Tableau de bord",
      href: "/dashboard",
      icon: LayoutDashboard,
      isActive: location.pathname === "/dashboard"
    },
    {
      name: "Utilisateurs",
      href: "/dashboard/users",
      icon: Users,
      isActive: location.pathname.startsWith("/dashboard/users")
    },
    {
      name: "Observations",
      href: "/dashboard/observations",
      icon: Binoculars,
      isActive: location.pathname.startsWith("/dashboard/observations")
    },
    /*{
      name: "Rapports",
      href: "/admin/reports",
      icon: FileText,
      isActive: location.pathname.startsWith("/admin/reports")
    },
    {
      name: "Cartes",
      href: "/admin/maps",
      icon: Map,
      isActive: location.pathname.startsWith("/admin/maps")
    },
    {
      name: "Statistiques",
      href: "/admin/statistics",
      icon: BarChart3,
      isActive: location.pathname.startsWith("/admin/statistics")
    },
    {
      name: "Paramètres",
      href: "/admin/settings",
      icon: Settings,
      isActive: location.pathname.startsWith("/admin/settings")
    }*/
  ];

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Overlay mobile */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-20 bg-black opacity-50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed inset-y-0 left-0 z-30 w-64 bg-gray-900 text-white transform transition-transform duration-300 ease-in-out
        lg:static lg:translate-x-0 lg:z-auto
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-between h-16 px-4 border-b border-gray-800">
            <div className="flex items-center space-x-2">
              <Shield className="w-8 h-8 text-blue-400" />
              <span className="text-xl font-bold">Admin SIC MAP VIEW</span>
            </div>
            <button 
              className="lg:hidden"
              onClick={() => setSidebarOpen(false)}
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-4 space-y-2 overflow-y-auto">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`
                    flex items-center px-4 py-3 rounded-lg transition-colors
                    ${item.isActive 
                      ? 'bg-blue-600 text-white' 
                      : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                    }
                  `}
                  onClick={() => setSidebarOpen(false)}
                >
                  <Icon className="w-5 h-5 mr-3" />
                  {item.name}
                </Link>
              );
            })}
          </nav>

          {/* User section */}
          <div className="p-4 border-t border-gray-800">
            <div className="flex items-center px-4 py-3">
              <div className="flex-shrink-0">
                <div className="flex items-center justify-center w-10 h-10 bg-blue-600 rounded-full">
                  <span className="font-medium text-white">A</span>
                </div>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-white">{authUser?.username}</p>
                <p className="text-xs text-gray-400">
                  {authUser?.role === "ADMIN" && "Administrateur"}
                  {authUser?.role === "EXPERT" && "Expert"}
                  {authUser?.role === "DEFAULT" && "Utilisateur"}
                  {authUser?.role === "TENANT" && "Locataire"}
                  {!["ADMIN", "EXPERT", "DEFAULT", "TENANT"].includes(authUser?.role) && authUser?.role}
                </p>
              </div>
            </div>
            
            <Button
              variant="ghost"
              className="justify-start w-full mt-2 text-gray-300 hover:text-white hover:bg-gray-800"
              onClick={handleLogout}
            >
              <LogOut className="w-4 h-4 mr-2" />
              Déconnexion
            </Button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex flex-col flex-1 overflow-hidden">
        {/* Header */}
        <header className="flex items-center justify-between h-16 px-6 bg-white border-b border-gray-200">
          <div className="flex items-center">
            <button 
              className="mr-4 text-gray-500 lg:hidden"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="w-6 h-6" />
            </button>
            <h1 className="text-2xl font-semibold text-gray-900">
              {navigationItems.find(item => item.isActive)?.name || "Administration"}
            </h1>
          </div>

          <div className="flex items-center space-x-4">
            <div className="hidden md:block">
              <p className="text-sm text-gray-700">Bienvenue, <span className="font-medium">{authUser?.username}</span></p>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          <div className="p-2 md:p-4">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;