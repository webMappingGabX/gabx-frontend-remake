import { useState, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { 
  Search, 
  Filter, 
  MoreVertical, 
  Edit, 
  Trash2, 
  UserPlus,
  Shield,
  UserCheck,
  UserX,
  Eye,
  EyeOff,
  X,
  User,
  Mail,
  Briefcase
} from "lucide-react";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../../components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components/ui/select";
import { useToast } from "../../hooks/useToast";
import { useDispatch, useSelector } from "react-redux";
import { clearCurrentUser, createUser, deleteUser, fetchUserById, fetchUsers, selectCurrentUser, selectUsers, selectUsersError, selectUsersLoading, setCurrentUser, updateUser } from "../../app/store/slices/usersSlice";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../../components/ui/dialog";
import { Textarea } from "../../components/ui/textarea";
import { Label } from "../../components/ui/label";
import { selectUser } from "../../app/store/slices/authSlice";

interface User {
    id: string;
    username: string;
    email: string;
    role: "DEFAULT" | "EXPERT" | "ADMIN";
    profession: string;
    status: "ACTIVE" | "INACTIVE" | "SUSPEND";
    createdAt: string;
    updatedAt: string;
  }
  
  interface UserFormData {
    username: string;
    email: string;
    password?: string;
    confirmPassword?: string;
    role: "DEFAULT" | "EXPERT" | "ADMIN";
    profession: string;
    status: "ACTIVE" | "INACTIVE" | "SUSPEND";
  }
  
  interface UserFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    onUpdate: (userData: UserFormData) => void;
    onCreate: (userData: UserFormData) => void;
    user?: User | null;
    isLoading?: boolean;
  }
  
const UserFormModal = ({ 
    isOpen, 
    onClose, 
    onUpdate,
    onCreate, 
    user = null, 
    isLoading = false 
  }: UserFormModalProps) => {
    const { toast } = useToast();
    const isEditing = !!user;
  
    const [formData, setFormData] = useState<UserFormData>({
      username: "",
      email: "",
      password: "",
      confirmPassword: "",
      role: "DEFAULT",
      profession: "",
      status: "ACTIVE",
    });
  
    const [errors, setErrors] = useState<Partial<UserFormData>>({});
  
    // Initialiser le formulaire avec les données de l'utilisateur si en mode édition
    useEffect(() => {
      if (isEditing && user) {
        setFormData({
          username: user.username,
          email: user.email,
          role: user.role,
          profession: user.profession,
          status: user.status,
          password: "",
          confirmPassword: "",
        });
      } else {
        setFormData({
          username: "",
          email: "",
          password: "",
          confirmPassword: "",
          role: "DEFAULT",
          profession: "",
          status: "ACTIVE",
        });
      }
      setErrors({});
    }, [isEditing, user, isOpen]);
  
    const validateForm = (): boolean => {
      const newErrors: Partial<UserFormData> = {};
  
      // Validation du nom d'utilisateur
      if (!formData.username.trim()) {
        newErrors.username = "Le nom d'utilisateur est requis";
      } else if (formData.username.length < 3) {
        newErrors.username = "Le nom d'utilisateur doit contenir au moins 3 caractères";
      }
  
      // Validation de l'email
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!formData.email.trim()) {
        newErrors.email = "L'email est requis";
      } else if (!emailRegex.test(formData.email)) {
        newErrors.email = "L'email n'est pas valide";
      }
  
      // Validation du mot de passe (seulement en création)
      if (!isEditing) {
        if (!formData.password) {
          newErrors.password = "Le mot de passe est requis";
        } else if (formData.password.length < 6) {
          newErrors.password = "Le mot de passe doit contenir au moins 6 caractères";
        }
  
        if (!formData.confirmPassword) {
          newErrors.confirmPassword = "La confirmation du mot de passe est requise";
        } else if (formData.password !== formData.confirmPassword) {
          newErrors.confirmPassword = "Les mots de passe ne correspondent pas";
        }
      } else {
        // En mode édition, validation optionnelle du mot de passe
        if (formData.password && formData.password.length < 6) {
          newErrors.password = "Le mot de passe doit contenir au moins 6 caractères";
        }
        if (formData.password && formData.password !== formData.confirmPassword) {
          newErrors.confirmPassword = "Les mots de passe ne correspondent pas";
        }
      }
  
      // Validation de la profession
      if (!formData.profession.trim()) {
        newErrors.profession = "La profession est requise";
      }
  
      setErrors(newErrors);
      return Object.keys(newErrors).length === 0;
    };
  
    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      
      if (!validateForm()) {
        toast({
          title: "Erreur de validation",
          description: "Veuillez corriger les erreurs dans le formulaire.",
          variant: "destructive",
        });
        return;
      }
  
      // Créer les données à envoyer (sans confirmPassword)
      const { confirmPassword, ...submitData } = formData;
      
      // En mode édition, ne pas envoyer le mot de passe s'il est vide
      if (isEditing && !formData.password) {
        delete submitData.password;
      }
  
      if(isEditing) onUpdate(submitData)
      else onCreate(submitData);
    };
  
    const handleInputChange = (field: keyof UserFormData, value: string) => {
      setFormData(prev => ({ ...prev, [field]: value }));
      
      // Effacer l'erreur pour ce champ quand l'utilisateur tape
      if (errors[field]) {
        setErrors(prev => ({ ...prev, [field]: undefined }));
      }
    };
  
    const handleClose = () => {
      if (!isLoading) {
        onClose();
      }
    };
  
    return (
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <User className="w-5 h-5" />
              {isEditing ? "Modifier l'utilisateur" : "Créer un nouvel utilisateur"}
            </DialogTitle>
            <DialogDescription>
              {isEditing 
                ? "Modifiez les informations de l'utilisateur ci-dessous."
                : "Remplissez les informations pour créer un nouvel utilisateur."
              }
            </DialogDescription>
          </DialogHeader>
  
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Nom d'utilisateur */}
            <div className="space-y-2">
              <Label htmlFor="username" className="flex items-center gap-2">
                <User className="w-4 h-4" />
                Nom d'utilisateur *
              </Label>
              <Input
                id="username"
                type="text"
                placeholder="Entrez le nom d'utilisateur"
                value={formData.username}
                onChange={(e) => handleInputChange("username", e.target.value)}
                disabled={isLoading}
                className={errors.username ? "border-red-500" : ""}
              />
              {errors.username && (
                <p className="text-sm text-red-500">{errors.username}</p>
              )}
            </div>
  
            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="email" className="flex items-center gap-2">
                <Mail className="w-4 h-4" />
                Email *
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="Entrez l'adresse email"
                value={formData.email}
                onChange={(e) => handleInputChange("email", e.target.value)}
                disabled={isLoading}
                className={errors.email ? "border-red-500" : ""}
              />
              {errors.email && (
                <p className="text-sm text-red-500">{errors.email}</p>
              )}
            </div>
  
            {/* Mot de passe */}
            <div className="space-y-2">
              <Label htmlFor="password" className="flex items-center gap-2">
                <Shield className="w-4 h-4" />
                Mot de passe {!isEditing && "*"}
              </Label>
              <Input
                id="password"
                type="password"
                placeholder={isEditing ? "Laisser vide pour ne pas changer" : "Entrez le mot de passe"}
                value={formData.password}
                onChange={(e) => handleInputChange("password", e.target.value)}
                disabled={isLoading}
                className={errors.password ? "border-red-500" : ""}
              />
              {errors.password && (
                <p className="text-sm text-red-500">{errors.password}</p>
              )}
            </div>
  
            {/* Confirmation mot de passe */}
            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="flex items-center gap-2">
                <Shield className="w-4 h-4" />
                Confirmer le mot de passe {!isEditing && "*"}
              </Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="Confirmez le mot de passe"
                value={formData.confirmPassword}
                onChange={(e) => handleInputChange("confirmPassword", e.target.value)}
                disabled={isLoading}
                className={errors.confirmPassword ? "border-red-500" : ""}
              />
              {errors.confirmPassword && (
                <p className="text-sm text-red-500">{errors.confirmPassword}</p>
              )}
            </div>
  
            {/* Profession */}
            <div className="space-y-2">
              <Label htmlFor="profession" className="flex items-center gap-2">
                <Briefcase className="w-4 h-4" />
                Profession *
              </Label>
              <Input
                id="profession"
                type="text"
                placeholder="Entrez la profession"
                value={formData.profession}
                onChange={(e) => handleInputChange("profession", e.target.value)}
                disabled={isLoading}
                className={errors.profession ? "border-red-500" : ""}
              />
              {errors.profession && (
                <p className="text-sm text-red-500">{errors.profession}</p>
              )}
            </div>
  
            {/* Rôle */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Shield className="w-4 h-4" />
                Rôle
              </Label>
              <Select 
                value={formData.role} 
                onValueChange={(value: "DEFAULT" | "EXPERT" | "ADMIN") => 
                  handleInputChange("role", value)
                }
                disabled={isLoading}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Sélectionnez un rôle" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="DEFAULT">Utilisateur</SelectItem>
                  <SelectItem value="EXPERT">Expert</SelectItem>
                  <SelectItem value="ADMIN">Administrateur</SelectItem>
                </SelectContent>
              </Select>
            </div>
  
            {/* Statut */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <UserCheck className="w-4 h-4" />
                Statut
              </Label>
              <Select 
                value={formData.status} 
                onValueChange={(value: "ACTIVE" | "INACTIVE" | "SUSPEND") => 
                  handleInputChange("status", value)
                }
                disabled={isLoading}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Sélectionnez un statut" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ACTIVE">Actif</SelectItem>
                  <SelectItem value="INACTIVE">Inactif</SelectItem>
                  <SelectItem value="SUSPEND">Suspendu</SelectItem>
                </SelectContent>
              </Select>
            </div>
  
            {/* Boutons d'action */}
            <div className="flex justify-end gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={isLoading}
                className="cursor-pointer"
              >
                Annuler
              </Button>
              <Button
                type="submit"
                disabled={isLoading}
                className="cursor-pointer"
              >
                {isLoading ? (
                  "Enregistrement..."
                ) : (
                  isEditing ? "Modifier" : "Créer"
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    );
  };

  export default UserFormModal;