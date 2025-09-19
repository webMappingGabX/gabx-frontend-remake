import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../../components/ui/dialog";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Textarea } from "../../components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components/ui/select";
import { useToast } from "../../hooks/useToast";
import { 
  Palette, 
  Gauge, 
  FileText, 
  User,
  X
} from "lucide-react";

// Types basés sur votre modèle Observation
interface User {
  id: string;
  username: string;
  email: string;
}

interface Observation {
  id: string;
  category: "PAINT" | "STRUCTURE" | "ELECTRIC" | "PLUMBING"; // Étendu avec d'autres catégories possibles
  scale: number;
  content: string;
  userId: string;
  User?: User;
  createdAt: string;
  updatedAt: string;
}

interface ObservationFormData {
  category: "PAINT" | "STRUCTURE" | "ELECTRIC" | "PLUMBING";
  scale: number;
  content: string;
  userId?: string;
}

interface ObservationFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (observationData: ObservationFormData) => void;
  onCreate: (observationData: ObservationFormData) => void;
  observation?: Observation | null;
  isLoading?: boolean;
  users: User[]; // Liste des utilisateurs pour l'attribution
}

const ObservationFormModal = ({ 
  isOpen, 
  onClose, 
  onUpdate,
  onCreate, 
  observation = null, 
  isLoading = false,
  users = []
}: ObservationFormModalProps) => {
  const { toast } = useToast();
  const isEditing = !!observation;

  const [formData, setFormData] = useState<ObservationFormData>({
    category: "PAINT",
    scale: 5,
    content: "",
    userId: ""
  });

  const [errors, setErrors] = useState<Partial<ObservationFormData>>({});

  // Initialiser le formulaire avec les données de l'observation si en mode édition
  useEffect(() => {
    if (isEditing && observation) {
      setFormData({
        category: observation.category,
        scale: observation.scale,
        content: observation.content,
        userId: observation.userId
      });
    } else {
      setFormData({
        category: "PAINT",
        scale: 5,
        content: "",
        userId: ""
      });
    }
    setErrors({});
  }, [isEditing, observation, isOpen]);

  const validateForm = (): boolean => {
    const newErrors: Partial<ObservationFormData> = {};

    // Validation du contenu
    if (!formData.content.trim()) {
      newErrors.content = "Le contenu de l'observation est requis";
    } else if (formData.content.length < 10) {
      newErrors.content = "Le contenu doit contenir au moins 10 caractères";
    }

    // Validation de l'échelle
    if (formData.scale < 1 || formData.scale > 10) {
      newErrors.scale = "L'échelle doit être comprise entre 1 et 10";
    }

    // Validation de l'utilisateur (seulement en création)
    if (!isEditing && !formData.userId) {
      newErrors.userId = "L'attribution à un utilisateur est requise";
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

    if (isEditing) {
      onUpdate(formData);
    } else {
      onCreate(formData);
    }
  };

  const handleInputChange = (field: keyof ObservationFormData, value: string | number) => {
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

  const getScaleLabel = (scale: number) => {
    if (scale < 5) return "Critique";
    if (scale < 7) return "Moyen";
    return "Bon";
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[550px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            {isEditing ? "Modifier l'observation" : "Créer une nouvelle observation"}
          </DialogTitle>
          <DialogDescription>
            {isEditing 
              ? "Modifiez les détails de l'observation ci-dessous."
              : "Remplissez les informations pour créer une nouvelle observation."
            }
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Catégorie */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Palette className="w-4 h-4" />
              Catégorie *
            </Label>
            <Select 
              value={formData.category} 
              onValueChange={(value: "PAINT" | "STRUCTURE" | "ELECTRIC" | "PLUMBING") => 
                handleInputChange("category", value)
              }
              disabled={isLoading}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Sélectionnez une catégorie" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="PAINT">Peinture</SelectItem>
                <SelectItem value="STRUCTURE">Structure</SelectItem>
                <SelectItem value="ELECTRIC">Électricité</SelectItem>
                <SelectItem value="PLUMBING">Plomberie</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Échelle d'évaluation */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Gauge className="w-4 h-4" />
              Échelle d'évaluation (1-10) *
            </Label>
            <div className="space-y-3">
              <Input
                type="range"
                min="1"
                max="10"
                step="0.1"
                value={formData.scale}
                onChange={(e) => handleInputChange("scale", parseFloat(e.target.value))}
                disabled={isLoading}
                className={errors.scale ? "border-red-500" : ""}
              />
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">1 (Critique)</span>
                <div className="text-center">
                  <span className="font-medium">{formData.scale}</span>
                  <span className="block text-xs text-muted-foreground">
                    {getScaleLabel(formData.scale)}
                  </span>
                </div>
                <span className="text-sm text-muted-foreground">10 (Excellent)</span>
              </div>
            </div>
            {errors.scale && (
              <p className="text-sm text-red-500">{errors.scale}</p>
            )}
          </div>

          {/* Contenu */}
          <div className="space-y-2">
            <Label htmlFor="content" className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Description de l'observation *
            </Label>
            <Textarea
              id="content"
              placeholder="Décrivez en détail l'observation..."
              value={formData.content}
              onChange={(e) => handleInputChange("content", e.target.value)}
              disabled={isLoading}
              rows={4}
              className={errors.content ? "border-red-500" : ""}
            />
            {errors.content && (
              <p className="text-sm text-red-500">{errors.content}</p>
            )}
          </div>

          {/* Attribution utilisateur (seulement en création) */}
          {!isEditing && (
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <User className="w-4 h-4" />
                Attribuer à un utilisateur *
              </Label>
              <Select 
                value={formData.userId} 
                onValueChange={(value) => handleInputChange("userId", value)}
                disabled={isLoading}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Sélectionnez un utilisateur" />
                </SelectTrigger>
                <SelectContent>
                  {users.map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.username} ({user.email})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.userId && (
                <p className="text-sm text-red-500">{errors.userId}</p>
              )}
            </div>
          )}

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

export default ObservationFormModal;