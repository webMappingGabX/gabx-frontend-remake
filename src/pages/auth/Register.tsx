"use client";

import { useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Eye, EyeOff, Mail, Lock, Building, User, Workflow, CheckCircle, XCircle, Loader2 } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { registerUser, type AuthState } from "../../app/store/slices/authSlice";
import axios from "../../api/axios";

// Fonction utilitaire pour valider le format email
const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Fonction utilitaire pour debounce
const useDebounce = (value: string, delay: number) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

export default function Register() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    profession: "",
    password: "",
    confirmPassword: "",
    locationCode: null,
    role: "DEFAULT"
  });
  const [ showError, setShowError ] = useState(false);
  const [ error, setError ] = useState("");

  // États pour la validation en temps réel
  const [usernameValidation, setUsernameValidation] = useState({
    isValidating: false,
    isValid: null as boolean | null,
    message: ""
  });
  
  const [emailValidation, setEmailValidation] = useState({
    isValidating: false,
    isValid: null as boolean | null,
    message: ""
  });

  const [isLoading, setIsLoading] = useState(false);
  const dispatch = useDispatch();
  const { register } = useSelector((state : { auth : AuthState }) => state.auth);
  const navigate = useNavigate();

  // Debounce pour username et email
  const debouncedUsername = useDebounce(formData.username, 500);
  const debouncedEmail = useDebounce(formData.email, 500);

  // Fonction pour vérifier la disponibilité d'une ressource
  const checkResourceAvailability = useCallback(async (type: 'username' | 'email', value: string) => {
    if (!value) return;

    const payload = type === 'username' ? { username: value } : { email: value };
    
    try {
      // Appel à l'API pour vérifier la ressource
      const response = await axios.post('/auth/verify-resource', payload);
      
      if (response.status === 200) {
        // Ressource disponible
        if (type === 'username') {
          setUsernameValidation({
            isValidating: false,
            isValid: true,
            message: "Nom d'utilisateur disponible"
          });
        } else {
          setEmailValidation({
            isValidating: false,
            isValid: true,
            message: "Email disponible"
          });
        }
      } else if (response.status === 409) {
        // Ressource non disponible
        if (type === 'username') {
          setUsernameValidation({
            isValidating: false,
            isValid: false,
            message: "Ce nom d'utilisateur n'est plus disponible"
          });
        } else {
          setEmailValidation({
            isValidating: false,
            isValid: false,
            message: "Cet email est déjà associé à un compte"
          });
        }
      }
    } catch (err) {
      // Erreur lors de la vérification
      //console.log("ERROR", err);
      if (type === 'username') {
        setUsernameValidation({
          isValidating: false,
          isValid: false,
          message: err.response.data.message
        });
      } else {
        setEmailValidation({
          isValidating: false,
          isValid: false,
          message: err.response.data.message
        });
      }
    }
  }, []);

  // Effet pour vérifier le username quand il change
  useEffect(() => {    
    if (debouncedUsername.includes(" ")) {
      setUsernameValidation({
        isValidating: false,
        isValid: false,
        message: "Le nom d'utilisateur ne doit pas contenir d'espaces"
      });
    } else if (debouncedUsername.length >= 3) {
      setUsernameValidation({
        isValidating: true,
        isValid: null,
        message: ""
      });
      checkResourceAvailability('username', debouncedUsername);
    } else if (debouncedUsername.length > 0) {
      setUsernameValidation({
        isValidating: false,
        isValid: null,
        message: "Le nom d'utilisateur doit contenir au moins 3 caractères"
      });
    } else {
      setUsernameValidation({
        isValidating: false,
        isValid: null,
        message: ""
      });
    }
  }, [debouncedUsername, checkResourceAvailability]);

  // Effet pour vérifier l'email quand il change
  useEffect(() => {
    if (debouncedEmail && isValidEmail(debouncedEmail)) {
      setEmailValidation({
        isValidating: true,
        isValid: null,
        message: ""
      });
      checkResourceAvailability('email', debouncedEmail);
    } else if (debouncedEmail && debouncedEmail.length > 0) {
      setEmailValidation({
        isValidating: false,
        isValid: false,
        message: "Format d'email invalide"
      });
    } else {
      setEmailValidation({
        isValidating: false,
        isValid: null,
        message: ""
      });
    }
  }, [debouncedEmail, checkResourceAvailability]);

  const handleChange = async (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });

    setShowError(false);
  };

  // IsLoading se synchronise avec register.isLoadong pour eviter de retoucher la totalite du composant
  useEffect(() => {
    setIsLoading(register.isLoading);
  }, [register.isLoading]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    setError("");
    // Validation des mots de passe
    if (formData.password !== formData.confirmPassword) {
      setError("Les mots de passe ne correspondent pas");
      setIsLoading(false);
      return;
    }

    // Validation que username et email sont valides
    if (usernameValidation.isValid !== true || emailValidation.isValid !== true) {
        setError("Veuillez corriger les erreurs de validation avant de continuer");
      return;
    }

    setShowError(error.trim() !== "");

    let submitData = { ...formData };
    if (formData.locationCode != null && formData.locationCode !== "") {
      submitData.role = "TENANT";
    }
    console.log("SUBMIT DATA", submitData);
    const response = await dispatch(registerUser(submitData));

    //console.log("REGISTER RESPONSE", response);
    
    if(response.type.includes("fulfilled"))
    {
        navigate("/auth/login");
    } else {
        setError("Une erreur inattendue s'est produite pendant l'enregistrement");
        setShowError(true);
    }
  };

  // Fonction pour obtenir l'icône de validation
  const getValidationIcon = (validation: { isValidating: boolean; isValid: boolean | null; message: string }) => {
    if (validation.isValidating) {
      return <Loader2 className="w-5 h-5 text-gray-400 animate-spin" />;
    }
    if (validation.isValid === true) {
      return <CheckCircle className="w-5 h-5 text-green-500" />;
    }
    if (validation.isValid === false) {
      return <XCircle className="w-5 h-5 text-red-500" />;
    }
    return null;
  };

  // Fonction pour obtenir la classe de bordure selon la validation
  const getBorderClass = (validation: { isValidating: boolean; isValid: boolean | null; message: string }) => {
    if (validation.isValidating) return "border-gray-300";
    if (validation.isValid === true) return "border-green-500";
    if (validation.isValid === false) return "border-red-500";
    return "border-gray-300";
  };

  return (
    <div className="flex items-center justify-center min-h-screen p-4 bg-gradient-to-br from-blue-100 via-white to-green-100">
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
            Créer un compte
          </h1>
          <p className="text-gray-600">
            Rejoignez notre communauté
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

            {/* Nom */}
            <div className="space-y-2">
              <label htmlFor="username" className="text-sm font-medium text-gray-700">
                Nom d'utilisateur
              </label>
              <div className="relative">
                <User className="absolute w-5 h-5 text-gray-400 transform -translate-y-1/2 left-3 top-1/2" />
                <Input
                  id="username"
                  name="username"
                  type="text"
                  placeholder="Nom d'utilisateur"
                  value={formData.username}
                  onChange={handleChange}
                  className={`pl-10 pr-12 ${getBorderClass(usernameValidation)}`}
                  required
                />
                <div className="absolute transform -translate-y-1/2 right-3 top-1/2">
                  {getValidationIcon(usernameValidation)}
                </div>
              </div>
              {usernameValidation.message && (
                <span className={`text-sm ${
                  usernameValidation.isValid === true ? 'text-green-600' : 
                  usernameValidation.isValid === false ? 'text-red-600' : 
                  'text-gray-500'
                }`}>
                  {usernameValidation.message}
                </span>
              )}
            </div>

            {/* Email */}
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium text-gray-700">
                Adresse email
              </label>
              <div className="relative">
                <Mail className="absolute w-5 h-5 text-gray-400 transform -translate-y-1/2 left-3 top-1/2" />
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="votre@gmail.com"
                  value={formData.email}
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

            {/* Téléphone */}
            <div className="space-y-2">
              <label htmlFor="profession" className="text-sm font-medium text-gray-700">
                Profession
              </label>
              <div className="relative">
                <Workflow className="absolute w-5 h-5 text-gray-400 transform -translate-y-1/2 left-3 top-1/2" />
                <Input
                  id="profession"
                  name="profession"
                  type="text"
                  placeholder="Ex: Topographe"
                  value={formData.profession}
                  onChange={handleChange}
                  className="pl-10"
                  required
                />
              </div>
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

            {/* Confirmation du mot de passe */}
            <div className="space-y-2">
              <label htmlFor="confirmPassword" className="text-sm font-medium text-gray-700">
                Confirmer le mot de passe
              </label>
              <div className="relative">
                <Lock className="absolute w-5 h-5 text-gray-400 transform -translate-y-1/2 left-3 top-1/2" />
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Confirmez votre mot de passe"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className="pl-10 pr-10"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute text-gray-400 transition-colors transform -translate-y-1/2 right-3 top-1/2 hover:text-gray-600"
                >
                  {showConfirmPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>
            
            {/* Code locataire (optionnel) */}
            <div className="space-y-2">
              <label htmlFor="locationCode" className="text-sm font-medium text-gray-700">
                Code locataire <span className="text-xs text-gray-400">(si vous en avez un)</span>
              </label>
              <div className="relative">
                <Building className="absolute w-5 h-5 text-gray-400 transform -translate-y-1/2 left-3 top-1/2" />
                <Input
                  id="locationCode"
                  name="locationCode"
                  type="text"
                  placeholder="Entrez votre code locataire (facultatif)"
                  value={formData.locationCode || ""}
                  onChange={handleChange}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Conditions */}
            <div className="space-y-4">
              <label className="flex items-start space-x-2">
                <input
                  type="checkbox"
                  className="mt-1 border-gray-300 rounded text-primary focus:ring-primary"
                  required
                />
                <span className="text-sm text-gray-600">
                  J'accepte les{" "}
                  <Link to="#" className="text-primary hover:text-primary/80">
                    conditions d'utilisation
                  </Link>{" "}
                  et la{" "}
                  <Link to="#" className="text-primary hover:text-primary/80">
                    politique de confidentialité
                  </Link>
                </span>
              </label>
              
              {/* <label className="flex items-start space-x-2">
                <input
                  type="checkbox"
                  className="mt-1 border-gray-300 rounded text-primary focus:ring-primary"
                />
                <span className="text-sm text-gray-600">
                  Je souhaite recevoir des offres personnalisées par email
                </span>
              </label> */}
            </div>
            {/* Show Error message */}
            {error.trim() != "" ? (
                <div className="px-4 py-2 mt-2 mb-4 text-sm text-red-700 bg-red-100 border border-red-300 rounded">
                    { error }
                </div>
            ) : null}

            {/* Bouton d'inscription */}
            <Button
              type="submit"
              className="w-full py-3 font-medium text-white cursor-pointer bg-primary hover:bg-primary/90"
              disabled={isLoading}
            >
              {isLoading ? (
                <div className="flex items-center">
                  <div className="w-4 h-4 mr-2 border-b-2 border-white rounded-full animate-spin"></div>
                  Création du compte...
                </div>
              ) : (
                "Créer mon compte"
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

          {/* Inscription avec Google */}
          {/* <Button
            variant="outline"
            className="w-full border-gray-300 hover:bg-gray-50"
            onClick={() => console.log("Inscription avec Google")}
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

          {/* Lien de connexion */}
          <div className="mt-6 text-center">
            <span className="text-gray-600">Déjà un compte ? </span>
            <Link
              to="/auth/login"
              className="font-medium transition-colors text-primary hover:text-primary/80"
            >
              Se connecter
            </Link>
          </div>
          
          {/* Retour a l'accueil */}
          <div className="mt-6 text-center">
            <span className="text-gray-600">Vous avez changer d'avis ? </span>
            <Link
              to="/map"
              className="font-medium transition-colors text-primary hover:text-primary/80"
            >
              Rentrer à la page d'accueil
            </Link>
          </div>
        </motion.div>

        {/* Footer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="mt-8 text-sm text-center text-gray-500"
        >
          <p>En créant un compte, vous acceptez nos</p>
          <div className="flex justify-center space-x-1">
            <Link to="#" className="text-primary hover:text-primary/80">
              Conditions d'utilisation
            </Link>
            <span>et</span>
            <Link to="#" className="text-primary hover:text-primary/80">
              Politique de confidentialité
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
} 