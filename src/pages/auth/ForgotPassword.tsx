import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Mail, ArrowLeft, Building, Lock, Eye, EyeOff, RefreshCw, CheckCircle, XCircle, Loader2 } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { resetPassword, sendResetCode, verifyCode, type AuthState } from "../../app/store/slices/authSlice";
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

export default function ForgotPassword() {
  const [step, setStep] = useState(1); // 1: email, 2: code, 3: new password
  const [formData, setFormData] = useState({
    email: "",
    code: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState("");
  const [showError, setShowError] = useState(false);
  const [countdown, setCountdown] = useState(0);

  // États pour la validation en temps réel
  const [emailValidation, setEmailValidation] = useState({
    isValidating: false,
    isValid: null as boolean | null,
    message: ""
  });

  const [codeValidation, setCodeValidation] = useState({
    isValidating: false,
    isValid: null as boolean | null,
    message: ""
  });

  const [isLoading, setIsLoading] = useState(false);
  const dispatch = useDispatch();
  const { reset } = useSelector((state : { auth : AuthState }) => state.auth);
  const navigate = useNavigate();

  // Debounce pour email
  const debouncedEmail = useDebounce(formData.email, 500);

  // Fonction pour vérifier la validité d'un email
  const checkEmailValidity = useCallback(async (email: string) => {
    if (!email) return;

    try {
      // Appel à l'API pour vérifier si l'email existe
      const response = await axios.post('/auth/verify-email', { email });
      
      if (response.status === 200) {
        // Email existe
        setEmailValidation({
          isValidating: false,
          isValid: true,
          message: "Email trouvé, vous pouvez continuer"
        });
      } else if (response.status === 404) {
        // Email n'existe pas
        setEmailValidation({
          isValidating: false,
          isValid: false,
          message: "Cet email n'est associé à aucun compte"
        });
      }
    } catch (err) {
      // Erreur lors de la vérification
      setEmailValidation({
        isValidating: false,
        isValid: false,
        message: err.response?.data?.message || "Erreur lors de la vérification"
      });
    }
  }, []);

  // Effet pour vérifier l'email quand il change
  useEffect(() => {
    if (debouncedEmail && isValidEmail(debouncedEmail)) {
      setEmailValidation({
        isValidating: true,
        isValid: null,
        message: ""
      });
      checkEmailValidity(debouncedEmail);
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
  }, [debouncedEmail, checkEmailValidity]);

  // Gestion du countdown pour le renvoi de code
  const startCountdown = () => {
    setCountdown(60);
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });

    setShowError(false);
    setError("");
  };

  const handleSendCode = async (e) => {
    e.preventDefault();
    setError("");
    
    if (emailValidation.isValid !== true) {
      setError("Veuillez entrer un email valide");
      setShowError(true);
      return;
    }

    setIsLoading(true);
    
    try {
      // Appel à l'API pour envoyer le code de réinitialisation
      //const response = await axios.post('/auth/send-reset-code', { email: formData.email });
      const response = await dispatch(sendResetCode(formData.email));

      //if (response.status === 200) {
      if (response.type.includes("fulfilled")) {
        setIsLoading(false);
        setStep(2);
        startCountdown();
      } else {
        setError(response.payload.message || response.payload || "Erreur innatendue");
        setShowError(true);
        setIsLoading(false);
      }
    } catch (err) {
      setIsLoading(false);
      setError(err.response?.data?.message || "Erreur lors de l'envoi du code");
      setShowError(true);
    }
  };

  const handleVerifyCode = async (e) => {
    e.preventDefault();
    setError("");
    
    if (formData.code.length !== 6) {
      setError("Le code doit contenir 6 chiffres");
      setShowError(true);
      return;
    }

    setIsLoading(true);
    
    try {
      // Appel à l'API pour vérifier le code
      /*const response = await axios.post('/auth/verify-reset-code', {
        email: formData.email,
        code: formData.code
      });
      
      if (response.status === 200) {*/
      const payload = { email: formData.email, code: formData.code }
      const response = await dispatch(verifyCode(payload))

      if(response.type.includes("fulfilled")) {
        setIsLoading(false);
        setStep(3);
      }else {
        setError(response.payload.message || response.payload || "Erreur innatendue");
        setShowError(true);
        setIsLoading(false);
      }
    } catch (err) {
      setIsLoading(false);
      setError(err.response?.data?.message || "Code invalide ou expiré");
      setShowError(true);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError("");
    
    if (formData.newPassword !== formData.confirmPassword) {
      setError("Les mots de passe ne correspondent pas");
      setShowError(true);
      return;
    }

    if (formData.newPassword.length < 6) {
      setError("Le mot de passe doit contenir au moins 6 caractères");
      setShowError(true);
      return;
    }

    setIsLoading(true);
    
    try {
      // Appel à l'API pour réinitialiser le mot de passe
      /*const response = await axios.post('/auth/reset-password', {
        email: formData.email,
        code: formData.code,
        newPassword: formData.newPassword
      });
      
      
      if (response.status === 200) {*/
      const payload = {
        email: formData.email,
        code: formData.code,
        newPassword: formData.newPassword
      };
      const response = await dispatch(resetPassword(payload))
      if(response.type.includes("fulfilled")) {
        setIsLoading(false);
        navigate('/auth/login', { 
          state: { message: "Mot de passe réinitialisé avec succès" } 
        });
      } else {
        setError(response.payload.message || response.payload || "Erreur innatendue");
        setShowError(true);
        setIsLoading(false);
      }
    } catch (err) {
      setIsLoading(false);
      setError(err.response?.data?.message || "Erreur lors de la réinitialisation");
      setShowError(true);
    }
  };

  const handleResendCode = async () => {
    setIsLoading(true);
    
    try {
      // Appel à l'API pour renvoyer le code
      const response = await axios.post('/auth/resend-reset-code', { email: formData.email });
      
      if (response.status === 200) {
        setIsLoading(false);
        startCountdown();
      }
    } catch (err) {
      setIsLoading(false);
      setError(err.response?.data?.message || "Erreur lors de l'envoi du code");
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
    <div className="flex items-center justify-center min-h-screen p-4 bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="w-full max-w-md">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8 text-center"
        >
          <Link
            to="/auth/login"
            className="inline-flex items-center mb-6 text-gray-600 transition-colors hover:text-gray-800"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Retour à la connexion
          </Link>
          
          <div className="flex justify-center mb-4">
            <div className="p-3 rounded-full bg-primary/10">
              <Building className="w-8 h-8 text-primary" />
            </div>
          </div>
          
          <h1 className="mb-2 text-3xl font-bold text-gray-900">
            Mot de passe oublié ?
          </h1>
          <p className="text-gray-600">
            {step === 1 && "Entrez votre email pour recevoir un code de vérification"}
            {step === 2 && "Entrez le code reçu par email"}
            {step === 3 && "Choisissez votre nouveau mot de passe"}
          </p>
        </motion.div>

        {/* Indicateur de progression */}
        <div className="flex justify-center mb-6">
          <div className="flex space-x-2">
            {[1, 2, 3].map((stepNumber) => (
              <div
                key={stepNumber}
                className={`w-3 h-3 rounded-full transition-colors ${
                  step >= stepNumber ? 'bg-primary' : 'bg-gray-300'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Formulaire */}
        <motion.div
          key={step}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3 }}
          className="p-8 bg-white border border-gray-100 shadow-xl rounded-2xl"
        >
          {/* Message d'erreur global */}
          {error && (
            <div className="p-3 mb-4 text-sm text-red-700 bg-red-100 border border-red-300 rounded">
              {error}
            </div>
          )}

          {step === 1 && (
            <form onSubmit={handleSendCode} className="space-y-6">
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
                    placeholder="votre@email.com"
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

              {/* Informations */}
              <div className="p-4 rounded-lg bg-blue-50">
                <p className="text-sm text-gray-700">
                  Nous vous enverrons un code de vérification à 6 chiffres.
                </p>
              </div>

              {/* Bouton d'envoi */}
              <Button
                type="submit"
                className="w-full py-3 font-medium text-white bg-primary hover:bg-primary/90"
                disabled={isLoading || emailValidation.isValid !== true}
              >
                {isLoading ? (
                  <div className="flex items-center">
                    <div className="w-4 h-4 mr-2 border-b-2 border-white rounded-full animate-spin"></div>
                    Envoi en cours...
                  </div>
                ) : (
                  "Envoyer le code"
                )}
              </Button>
            </form>
          )}

          {step === 2 && (
            <form onSubmit={handleVerifyCode} className="space-y-6">
              {/* Code de vérification */}
              <div className="space-y-2">
                <label htmlFor="code" className="text-sm font-medium text-gray-700">
                  Code de vérification
                </label>
                <div className="relative">
                  <Input
                    id="code"
                    name="code"
                    type="text"
                    placeholder="------"
                    value={formData.code}
                    onChange={handleChange}
                    className="font-mono text-lg tracking-widest text-center"
                    maxLength={6}
                    required
                  />
                </div>
                <p className="text-xs text-center text-gray-500">
                  Code à 6 chiffres envoyé à {formData.email}
                </p>
              </div>

              {/* Renvoi de code */}
              <div className="text-center">
                {countdown > 0 ? (
                  <p className="text-sm text-gray-500">
                    Renvoyer le code dans {countdown}s
                  </p>
                ) : (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleResendCode}
                    disabled={isLoading}
                    className="text-sm"
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Renvoyer le code
                  </Button>
                )}
              </div>

              {/* Bouton de vérification */}
              <Button
                type="submit"
                className="w-full py-3 font-medium text-white bg-primary hover:bg-primary/90"
                disabled={isLoading || formData.code.length !== 6}
              >
                {isLoading ? (
                  <div className="flex items-center">
                    <div className="w-4 h-4 mr-2 border-b-2 border-white rounded-full animate-spin"></div>
                    Vérification...
                  </div>
                ) : (
                  "Vérifier le code"
                )}
              </Button>
            </form>
          )}

          {step === 3 && (
            <form onSubmit={handleResetPassword} className="space-y-6">
              {/* Nouveau mot de passe */}
              <div className="space-y-2">
                <label htmlFor="newPassword" className="text-sm font-medium text-gray-700">
                  Nouveau mot de passe
                </label>
                <div className="relative">
                  <Lock className="absolute w-5 h-5 text-gray-400 transform -translate-y-1/2 left-3 top-1/2" />
                  <Input
                    id="newPassword"
                    name="newPassword"
                    type={showPassword ? "text" : "password"}
                    placeholder="Votre nouveau mot de passe"
                    value={formData.newPassword}
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

              {/* Bouton de réinitialisation */}
              <Button
                type="submit"
                className="w-full py-3 font-medium text-white bg-primary hover:bg-primary/90"
                disabled={isLoading || !formData.newPassword || !formData.confirmPassword}
              >
                {isLoading ? (
                  <div className="flex items-center">
                    <div className="w-4 h-4 mr-2 border-b-2 border-white rounded-full animate-spin"></div>
                    Réinitialisation...
                  </div>
                ) : (
                  "Réinitialiser le mot de passe"
                )}
              </Button>
            </form>
          )}

          {/* Lien de connexion */}
          <div className="mt-6 text-center">
            <span className="text-gray-600">Vous vous souvenez de votre mot de passe ? </span>
            <Link
              to="/auth/login"
              className="font-medium transition-colors text-primary hover:text-primary/80"
            >
              Se connecter
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
          <p>Besoin d'aide ? Contactez notre support</p>
          <Link to="/contact" className="text-primary hover:text-primary/80">
            support@gabx.com
          </Link>
        </motion.div>
      </div>
    </div>
  );
}