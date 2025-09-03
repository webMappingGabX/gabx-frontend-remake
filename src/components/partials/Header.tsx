import { motion, AnimatePresence } from "framer-motion";
import { Button } from "../ui/button";
import { Menu, X, User, Map } from "lucide-react";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { selectIsAuthenticated, logoutUser } from "../../app/store/slices/authSlice";

// Type pour le dispatch Redux Toolkit
type AppDispatch = ReturnType<typeof useDispatch>;

const Header = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await dispatch(logoutUser());
      navigate("/auth/login");
    } catch (error) {
      console.error("Erreur lors de la déconnexion:", error);
    }
  };

  return (
    <motion.header
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="sticky top-0 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 z-[1500] px-3"
    >
      <div className="container flex items-center justify-between h-16">
        {/* Logo et Navigation principale */}
        <div className="flex items-center gap-8">
          {/* Bouton menu mobile */}
          <button 
            className="p-2 md:hidden"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
          
          {/* Logo */}
          <Link to="/map" className="flex flex-row items-center gap-2">
            <Map className="w-6 h-6 text-primary" />
            <motion.span 
              className="text-2xl font-bold text-transparent bg-gradient-to-r from-primary to-purple-600 bg-clip-text"
              whileHover={{ scale: 1.05 }}
            >
              GabX
            </motion.span>
          </Link>

        </div>

        {/* Zone de recherche et actions */}
        <div className="flex items-center gap-4">

          {/* Actions utilisateur */}
          {!isAuthenticated ? (
            <div className={`items-center gap-2 hidden md:flex`}>
              <Button variant="ghost" size="sm" className="relative hover:bg-gray-200" asChild>
                <Link to="/auth/register">
                  Inscription
                </Link>
              </Button>

              <Button variant="ghost" size="sm" className="relative text-white bg-primary" asChild>
                <Link to="/auth/login">
                  <motion.span
                    whileHover={{ scale: 1.07 }}
                    transition={{ type: "spring" }}
                  >
                  Connexion
                  </motion.span>
                </Link>
              </Button>
            </div>
          ) : (
            <div className={`items-center gap-2 hidden md:flex`}>
              <Button variant="ghost" size="icon" asChild>
                <Link to="/profile">
                  <User className="w-5 h-5" />
                </Link>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="relative text-white bg-red-500 cursor-pointer hover:bg-red-300"
                onClick={handleLogout}
              >
                <motion.span
                  whileHover={{ scale: 1.07 }}
                  transition={{ type: "spring" }}
                >
                  Déconnexion
                </motion.span>
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Menu mobile */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden bg-transparent border-t md:hidden"
          >
            {isAuthenticated ? (
              <div className="container flex flex-col gap-4 py-4">
                <Link 
                  to="/profile"
                  className="py-2 font-medium transition-colors hover:text-primary"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Mon compte
                </Link>
                <button
                  onClick={() => {
                    handleLogout();
                    setMobileMenuOpen(false);
                  }}
                  className="py-2 font-medium text-left text-red-600 transition-colors hover:text-primary"
                >
                  Déconnexion
                </button>
              </div>
            ) : (
              <div className="container flex flex-col gap-4 py-4">
                {[
                  { href: "/auth/register", label: `Inscription` },
                  { href: "/auth/login", label: `Connexion` },
                ].map((item) => (
                  <Link 
                    key={item.href} 
                    to={item.href}
                    className="py-2 font-medium transition-colors hover:text-primary"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  );
};

export default Header;