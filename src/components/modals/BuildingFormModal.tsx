import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  X, 
  Building, 
  MapPin, 
  Layers, 
  Hash,
  AlertTriangle,
  CheckCircle,
  FileText
} from "lucide-react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { Switch } from "../ui/switch";
import { Textarea } from "../ui/textarea";
import { Badge } from "../ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";

interface Building {
  id?: string;
  geom: any;
  code: string;
  state: 'CONSTRUCTED' | 'UNDER_CONSTRUCTION' | 'PLANNED' | 'DEMOLISHED';
  nbLevels: number;
  fraud: boolean;
  plotId: string;
  planId: string;
  description?: string;
}

interface BuildingFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (data: any) => void;
  onUpdate: (data: any) => void;
  building?: Building | null;
  isLoading?: boolean;
  plots?: Array<{ id: string; code: string; name: string }>;
  plans?: Array<{ id: string; name: string; description?: string }>;
}

const BuildingFormModal = ({
  isOpen,
  onClose,
  onCreate,
  onUpdate,
  building,
  isLoading = false,
  plots = [],
  plans = []
}: BuildingFormModalProps) => {
  const [formData, setFormData] = useState<Omit<Building, 'id'>>({
    geom: null,
    code: '',
    state: 'CONSTRUCTED',
    nbLevels: 1,
    fraud: false,
    plotId: '',
    planId: '',
    description: ''
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (building) {
      setFormData({
        geom: building.geom || null,
        code: building.code || '',
        state: building.state || 'CONSTRUCTED',
        nbLevels: building.nbLevels || 1,
        fraud: building.fraud || false,
        plotId: building.plotId || '',
        planId: building.planId || '',
        description: building.description || ''
      });
    } else {
      // Reset form for creation
      setFormData({
        geom: null,
        code: '',
        state: 'CONSTRUCTED',
        nbLevels: 1,
        fraud: false,
        plotId: '',
        planId: '',
        description: ''
      });
    }
    setErrors({});
  }, [building, isOpen]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.code.trim()) {
      newErrors.code = "Le code est obligatoire";
    }

    if (formData.nbLevels < 1) {
      newErrors.nbLevels = "Le nombre de niveaux doit être au moins 1";
    }

    if (formData.nbLevels > 50) {
      newErrors.nbLevels = "Le nombre de niveaux ne peut pas dépasser 50";
    }

    if (!formData.plotId) {
      newErrors.plotId = "La parcelle est obligatoire";
    }

    if (!formData.planId) {
      newErrors.planId = "Le plan est obligatoire";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    if (building?.id) {
      onUpdate(formData);
    } else {
      onCreate(formData);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  const handleNumberChange = (field: string, value: string) => {
    const numValue = value === '' ? 0 : parseInt(value, 10);
    if (!isNaN(numValue)) {
      handleInputChange(field, numValue);
    }
  };

  const getStateBadge = (state: Building['state']) => {
    const stateConfig = {
      CONSTRUCTED: { label: 'Construit', variant: 'default' as const },
      UNDER_CONSTRUCTION: { label: 'En construction', variant: 'secondary' as const },
      PLANNED: { label: 'Planifié', variant: 'outline' as const },
      DEMOLISHED: { label: 'Démoli', variant: 'destructive' as const }
    };

    const config = stateConfig[state];
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building className="w-5 h-5" />
            {building ? 'Modifier le bâtiment' : 'Nouveau bâtiment'}
          </DialogTitle>
          <DialogDescription>
            {building 
              ? `Modifiez les informations du bâtiment ${building.code}`
              : 'Créez un nouveau bâtiment en remplissant les informations ci-dessous'
            }
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Section Informations de base */}
          <div className="space-y-4">
            <h3 className="flex items-center gap-2 text-lg font-medium">
              <Hash className="w-4 h-4" />
              Informations de base
            </h3>
            
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {/* Code */}
              <div className="space-y-2">
                <Label htmlFor="code">Code du bâtiment *</Label>
                <Input
                  id="code"
                  placeholder="Ex: BAT-001"
                  value={formData.code}
                  onChange={(e) => handleInputChange('code', e.target.value)}
                  className={errors.code ? 'border-destructive' : ''}
                />
                {errors.code && (
                  <p className="text-sm text-destructive">{errors.code}</p>
                )}
              </div>

              {/* Nombre de niveaux */}
              <div className="space-y-2">
                <Label htmlFor="nbLevels">Nombre de niveaux *</Label>
                <Input
                  id="nbLevels"
                  type="number"
                  min="1"
                  max="50"
                  value={formData.nbLevels}
                  onChange={(e) => handleNumberChange('nbLevels', e.target.value)}
                  className={errors.nbLevels ? 'border-destructive' : ''}
                />
                {errors.nbLevels && (
                  <p className="text-sm text-destructive">{errors.nbLevels}</p>
                )}
              </div>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Description du bâtiment (optionnel)"
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                rows={3}
              />
            </div>
          </div>

          {/* Section État et Statut */}
          <div className="space-y-4">
            <h3 className="flex items-center gap-2 text-lg font-medium">
              <Building className="w-4 h-4" />
              État et statut
            </h3>
            
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              {/* État du bâtiment */}
              <div className="space-y-3">
                <Label>État du bâtiment *</Label>
                <Select
                  value={formData.state}
                  onValueChange={(value: Building['state']) => 
                    handleInputChange('state', value)
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CONSTRUCTED">
                      <div className="flex items-center gap-2">
                        <Building className="w-4 h-4" />
                        <span>Construit</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="UNDER_CONSTRUCTION">
                      <div className="flex items-center gap-2">
                        <Layers className="w-4 h-4" />
                        <span>En construction</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="PLANNED">
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4" />
                        <span>Planifié</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="DEMOLISHED">
                      <div className="flex items-center gap-2">
                        <X className="w-4 h-4" />
                        <span>Démoli</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
                <div className="text-sm text-muted-foreground">
                  État actuel: {getStateBadge(formData.state)}
                </div>
              </div>

              {/* Statut fraude */}
              <div className="space-y-3">
                <Label htmlFor="fraud" className="flex items-center gap-2">
                  {formData.fraud ? (
                    <AlertTriangle className="w-4 h-4 text-destructive" />
                  ) : (
                    <CheckCircle className="w-4 h-4 text-green-600" />
                  )}
                  Statut fraude
                </Label>
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <span className="text-sm">
                    {formData.fraud ? 'Bâtiment frauduleux' : 'Bâtiment conforme'}
                  </span>
                  <Switch
                    checked={formData.fraud}
                    onCheckedChange={(checked) => 
                      handleInputChange('fraud', checked)
                    }
                  />
                </div>
                <div className="text-sm text-muted-foreground">
                  {formData.fraud 
                    ? 'Ce bâtiment est marqué comme frauduleux'
                    : 'Ce bâtiment est conforme'
                  }
                </div>
              </div>
            </div>
          </div>

          {/* Section Références */}
          <div className="space-y-4">
            <h3 className="flex items-center gap-2 text-lg font-medium">
              <MapPin className="w-4 h-4" />
              Références spatiales
            </h3>
            
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {/* Parcelle */}
              <div className="space-y-2">
                <Label htmlFor="plotId">Parcelle *</Label>
                <Select
                  value={formData.plotId}
                  onValueChange={(value) => handleInputChange('plotId', value)}
                >
                  <SelectTrigger className={errors.plotId ? 'border-destructive' : ''}>
                    <SelectValue placeholder="Sélectionnez une parcelle" />
                  </SelectTrigger>
                  <SelectContent>
                    {plots.map((plot) => (
                      <SelectItem key={plot.id} value={plot.id}>
                        <div className="flex flex-col">
                          <span className="font-medium">{plot.code}</span>
                          {plot.name && (
                            <span className="text-sm text-muted-foreground">
                              {plot.name}
                            </span>
                          )}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.plotId && (
                  <p className="text-sm text-destructive">{errors.plotId}</p>
                )}
              </div>

              {/* Plan */}
              <div className="space-y-2">
                <Label htmlFor="planId">Plan *</Label>
                <Select
                  value={formData.planId}
                  onValueChange={(value) => handleInputChange('planId', value)}
                >
                  <SelectTrigger className={errors.planId ? 'border-destructive' : ''}>
                    <SelectValue placeholder="Sélectionnez un plan" />
                  </SelectTrigger>
                  <SelectContent>
                    {plans.map((plan) => (
                      <SelectItem key={plan.id} value={plan.id}>
                        <div className="flex flex-col">
                          <span className="font-medium">{plan.name}</span>
                          {plan.description && (
                            <span className="text-sm text-muted-foreground">
                              {plan.description}
                            </span>
                          )}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.planId && (
                  <p className="text-sm text-destructive">{errors.planId}</p>
                )}
              </div>
            </div>
          </div>

          {/* Section Géométrie (simplifiée pour l'exemple) */}
          <div className="space-y-4">
            <h3 className="flex items-center gap-2 text-lg font-medium">
              <MapPin className="w-4 h-4" />
              Géométrie
            </h3>
            
            <div className="p-4 border rounded-lg bg-muted/30">
              <div className="mb-2 text-sm text-muted-foreground">
                La géométrie du bâtiment sera gérée via l'interface cartographique.
                {building?.geom && (
                  <Badge variant="outline" className="ml-2">
                    Géométrie définie
                  </Badge>
                )}
              </div>
              <Button 
                type="button" 
                variant="outline" 
                size="sm"
                onClick={() => {
                  // Ici on pourrait ouvrir une modal cartographique
                  toast({
                    title: "Fonctionnalité cartographique",
                    description: "L'édition de la géométrie se fera dans l'interface cartographique.",
                  });
                }}
              >
                Éditer la géométrie
              </Button>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isLoading}
            >
              Annuler
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 mr-2 border-2 border-current rounded-full border-t-transparent animate-spin" />
                  {building ? 'Modification...' : 'Création...'}
                </>
              ) : (
                <>
                  <Building className="w-4 h-4 mr-2" />
                  {building ? 'Modifier le bâtiment' : 'Créer le bâtiment'}
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default BuildingFormModal;