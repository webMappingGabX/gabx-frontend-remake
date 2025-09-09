"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Eye, EyeOff, Mail, Lock, Building, CheckCircle, XCircle, Loader2 } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { loginUser, type AuthState } from "../../app/store/slices/authSlice";


export default function Login() {
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    identifier: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [showError, setShowError] = useState(false);

  // États pour la validation en temps réel
  const [emailValidation, setEmailValidation] = useState({
    isValid: null as boolean | null,
    message: ""
  });

  const [isLoading, setIsLoading] = useState(false);
  const dispatch = useDispatch();
  const { login } = useSelector((state : { auth : AuthState }) => state.auth);
  const navigate = useNavigate();

  // Synchronisation du loading state
  /*useEffect(() => {
    setIsLoading(login.isLoading);
  }, [login.isLoading]);*/

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });

    setShowError(false);
    setError("");

    // Validation en temps réel de l'email
    /* if (e.target.name === "email") {
      if (e.target.value && !isValidEmail(e.target.value)) {
        setEmailValidation({
          isValid: false,
          message: "Format d'email invalide"
        });
      } else if (e.target.value && isValidEmail(e.target.value)) {
        setEmailValidation({
          isValid: true,
          message: "Format d'email valide"
        });
      } else {
        setEmailValidation({
          isValid: null,
          message: ""
        });
      }
    } */
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    // Validation des champs
    if (!formData.identifier || !formData.password) {
      setError("Veuillez remplir tous les champs");
      setShowError(true);
      return;
    }

    /*if (!isValidEmail(formData.ide)) {
      setError("Veuillez entrer un email valide");
      setShowError(true);
      return;
    }*/

    setShowError(false);
    const response = await dispatch(loginUser(formData));
    
    if (response.type.includes("fulfilled")) {
      navigate("/map");
    } else {
      setError(response.payload?.message  || response.payload || "Erreur lors de la connexion");
      setShowError(true);
    }
  };

  // Fonction pour obtenir l'icône de validation
  const getValidationIcon = (validation: { isValid: boolean | null; message: string }) => {
    if (validation.isValid === true) {
      return <CheckCircle className="w-5 h-5 text-green-500" />;
    }
    if (validation.isValid === false) {
      return <XCircle className="w-5 h-5 text-red-500" />;
    }
    return null;
  };

  // Fonction pour obtenir la classe de bordure selon la validation
  const getBorderClass = (validation: { isValid: boolean | null; message: string }) => {
    if (validation.isValid === true) return "border-green-500";
    if (validation.isValid === false) return "border-red-500";
    return "border-gray-300";
  };

  return (
    <div className="flex items-center justify-center min-h-screen p-4 bg-gradient-to-br from-blue-50 via-white to-orange-50">
      <div className="w-full max-w-md">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8 text-center"
        >
          
          <div className="flex justify-center mb-4">
            <div className="p-3 rounded-full bg-primary/10">
              <Building className="w-8 h-8 text-primary" />
            </div>
          </div>
          
          <h1 className="mb-2 text-3xl font-bold text-gray-900">
            Connexion
          </h1>
          <p className="text-gray-600">
            Accédez à votre espace personnel
          </p>
        </motion.div>

        {/* Formulaire */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="p-8 bg-white border border-gray-100 shadow-xl rounded-2xl"
        >
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Message d'erreur global */}
            {error && (
              <div className="p-3 mb-2 text-sm text-red-700 bg-red-100 border border-red-300 rounded">
                {error}
              </div>
            )}

            {/* Email */}
            <div className="space-y-2">
              <label htmlFor="identifier" className="text-sm font-medium text-gray-700">
                Nom d'utilisateur ou email
              </label>
              <div className="relative">
                <Mail className="absolute w-5 h-5 text-gray-400 transform -translate-y-1/2 left-3 top-1/2" />
                <Input
                  id="identifier"
                  name="identifier"
                  type="text"
                  placeholder="Nom d'utilisateur ou email"
                  value={formData.identifier}
                  onChange={handleChange}
                  className={`pl-10 pr-12 ${getBorderClass(emailValidation)}`}
                  required
                />
                <div className="absolute transform -translate-y-1/2 right-3 top-1/2">
                  {getValidationIcon(emailValidation)}
                </div>
              </div>
              {emailValidation.message && (
                <span className={`text-sm ${
                  emailValidation.isValid === true ? 'text-green-600' : 
                  emailValidation.isValid === false ? 'text-red-600' : 
                  'text-gray-500'
                }`}>
                  {emailValidation.message}
                </span>
              )}
            </div>

            {/* Mot de passe */}
            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium text-gray-700">
                Mot de passe
              </label>
              <div className="relative">
                <Lock className="absolute w-5 h-5 text-gray-400 transform -translate-y-1/2 left-3 top-1/2" />
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Votre mot de passe"
                  value={formData.password}
                  onChange={handleChange}
                  className="pl-10 pr-10"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute text-gray-400 transition-colors transform -translate-y-1/2 right-3 top-1/2 hover:text-gray-600"
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>

            {/* Options */}
            <div className="flex flex-wrap items-center justify-between">
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  className="border-gray-300 rounded text-primary focus:ring-primary"
                />
                <span className="text-sm text-gray-600">Se souvenir de moi</span>
              </label>
              <Link
                to="/auth/forgot-password"
                className="text-sm transition-colors text-primary hover:text-primary/80"
              >
                Mot de passe oublié ?
              </Link>
            </div>

            {/* Bouton de connexion */}
            <Button
              type="submit"
              className="w-full py-3 font-medium text-white cursor-pointer bg-primary hover:bg-primary/90"
              disabled={isLoading}
            >
              {isLoading ? (
                <div className="flex items-center">
                  <div className="w-4 h-4 mr-2 border-b-2 border-white rounded-full animate-spin"></div>
                  Connexion en cours...
                </div>
              ) : (
                "Se connecter"
              )}
            </Button>
          </form>

          {/* Séparateur */}
          {/* <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 text-gray-500 bg-white">ou</span>
            </div>
          </div> */}

          {/* Connexion avec Google */}
          {/* <Button
            variant="outline"
            className="w-full border-gray-300 cursor-pointer hover:bg-gray-50"
            onClick={() => console.log("Connexion avec Google")}
          >
            <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            Continuer avec Google
          </Button> */}

          {/* Lien d'inscription */}
          <div className="mt-6 text-center">
            <span className="text-gray-600">Pas encore de compte ? </span>
            <Link
              to="/auth/register"
              className="font-medium transition-colors text-primary hover:text-primary/80"
            >
              Créer un compte
            </Link>
          </div>

          {/* Retour a l'accueil */}
          {/* <div className="mt-6 text-center">
            <span className="text-gray-600">Vous avez changer d'avis ? </span>
            <Link
              to="/map"
              className="font-medium transition-colors text-primary hover:text-primary/80"
            >
              Rentrer à la page d'accueil
            </Link>
          </div> */}
        </motion.div>

        {/* Footer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="mt-8 text-sm text-center text-gray-500"
        >
          <p>En vous connectant, vous acceptez nos</p>
          <div className="flex justify-center space-x-1">
            <Link to="/terms" className="text-primary hover:text-primary/80">
              Conditions d'utilisation
            </Link>
            <span>et</span>
            <Link to="/privacy" className="text-primary hover:text-primary/80">
              Politique de confidentialité
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
}