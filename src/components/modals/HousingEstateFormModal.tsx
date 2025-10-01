import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  Building,
  X,
  MapPin,
  Home,
  Type
} from "lucide-react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { useToast } from "../../hooks/useToast";
import { useDispatch, useSelector } from "react-redux";
import { getArronds, getDepts, getRegions, getTowns, selectArrondState, selectDeptState, selectRegionsState, selectTownsState } from "../../app/store/slices/authSlice";

interface HousingEstateFormData {
  name: string;
  region: string;
  town: string;
  department: string;
  arrondissement: string;
  place: string;
  buildingsType: 'COLLECTIVE' | 'INDIVIDUAL';
}

interface HousingEstateFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (HEData: HousingEstateFormData) => void;
  onCreate: (HEData: HousingEstateFormData) => void;
  housingEstate?: HousingEstateFormData | null;
  isLoading?: boolean;
}

const HousingEstateFormModal = ({ 
  isOpen, 
  onClose, 
  onUpdate,
  onCreate, 
  housingEstate = null, 
  isLoading = false 
} : HousingEstateFormModalProps) => {
  const { toast } = useToast();
  const dispatch = useDispatch();
  const isEditing = !!housingEstate;

  const regionsFromState = useSelector(selectRegionsState);
  const deptsFromStates = useSelector(selectDeptState);
  const districtsFromStates = useSelector(selectArrondState);
  const townsFromStates = useSelector(selectTownsState);

  const [formData, setFormData] = useState<HousingEstateFormData>({
    name: "",
    region: '',
    town: '',
    department: '',
    arrondissement: '',
    place: '',
    buildingsType: 'COLLECTIVE'
  });

  const [errors, setErrors] = useState<Partial<HousingEstateFormData>>({});

  // Initialiser le formulaire avec les données du housing estate si en mode édition
  useEffect(() => {
    if (isEditing && housingEstate) {
      setFormData({
        name: housingEstate.name,
        region: housingEstate.region,
        town: housingEstate.town,
        department: housingEstate.department,
        arrondissement: housingEstate.arrondissement,
        place: housingEstate.place,
        buildingsType: housingEstate.buildingsType,
      });
    } else {
      setFormData({
        name: "",
        region: '',
        town: '',
        department: '',
        arrondissement: '',
        place: '',
        buildingsType: 'COLLECTIVE'
      });
    }
    setErrors({});
  }, [isEditing, housingEstate, isOpen]);

  // Charger les régions au montage
  useEffect(() => {
    const loadRegions = async () => {
      try {
        await dispatch(getRegions());
      } catch (err) {
        console.error("FAILED TO LOAD REGIONS", err);
      }
    }
    loadRegions();
  }, [dispatch]);

  // Charger les départements quand la région change
  useEffect(() => {
    if (formData.region) {
      const loadDepts = async () => {
        await dispatch(getDepts({ "regionId": formData.region }));
      }
      loadDepts();
    }
  }, [formData.region, dispatch]);

  // Charger les arrondissements quand le département change
  useEffect(() => {
    if (formData.department) {
      const loadArronds = async () => {
        await dispatch(getArronds({ "deptId": formData.department }));
      }
      loadArronds();
    }
  }, [formData.department, dispatch]);

  // Charger les villes quand l'arrondissement change
  useEffect(() => {
    if (formData.arrondissement) {
      const loadTowns = async () => {
        await dispatch(getTowns({ "arrondId": formData.arrondissement }));
      }
      loadTowns();
    }
  }, [formData.arrondissement, dispatch]);

  const validateForm = (): boolean => {
    const newErrors: Partial<HousingEstateFormData> = {};

    // Validation du nom
    if (!formData.name.trim()) {
      newErrors.name = "Le nom de la cité est requis";
    } else if (formData.name.length < 2) {
      newErrors.name = "Le nom doit contenir au moins 2 caractères";
    }

    // Validation de la région
    if (!formData.region) {
      newErrors.region = "La région est requise";
    }

    // Validation du département
    if (!formData.department) {
      newErrors.department = "Le département est requis";
    }

    // Validation de l'arrondissement
    if (!formData.arrondissement) {
      newErrors.arrondissement = "L'arrondissement est requis";
    }

    // Validation de la ville
    if (!formData.town) {
      newErrors.town = "La ville est requise";
    }

    // Validation du lieu
    if (!formData.place.trim()) {
      newErrors.place = "Le lieu est requis";
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

  const handleInputChange = (field: keyof HousingEstateFormData, value: string) => {
    setFormData(prev => ({ 
      ...prev, 
      [field]: value,
      // Réinitialiser les champs dépendants quand un champ parent change
      ...(field === 'region' && { 
        department: '',
        arrondissement: '',
        town: '' 
      }),
      ...(field === 'department' && { 
        arrondissement: '',
        town: '' 
      }),
      ...(field === 'arrondissement' && { 
        town: '' 
      })
    }));
    
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
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building className="w-5 h-5" />
            {isEditing ? "Modifier la cité" : "Créer une nouvelle cité"}
          </DialogTitle>
          <DialogDescription>
            {isEditing 
              ? "Modifiez les informations de la cité ci-dessous."
              : "Remplissez les informations pour créer une nouvelle cité."
            }
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Nom de la cité */}
          <div className="space-y-2">
            <Label htmlFor="name" className="flex items-center gap-2">
              <Home className="w-4 h-4" />
              Nom de la cité *
            </Label>
            <Input
              id="name"
              type="text"
              placeholder="Entrez le nom de la cité"
              value={formData.name}
              onChange={(e) => handleInputChange("name", e.target.value)}
              disabled={isLoading}
              className={errors.name ? "border-red-500" : ""}
            />
            {errors.name && (
              <p className="text-sm text-red-500">{errors.name}</p>
            )}
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {/* Région */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                Région *
              </Label>
              <Select 
                value={formData.region} 
                onValueChange={(value) => handleInputChange("region", value)}
                disabled={isLoading}
              >
                <SelectTrigger className={`w-full ${errors.region ? "border-red-500" : ""}`}>
                  <SelectValue placeholder="Sélectionnez une région" />
                </SelectTrigger>
                <SelectContent className="z-[1850]">
                  {regionsFromState?.map((region) => (
                    <SelectItem key={region?.id} value={region?.id.toString()}>
                      {region?.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.region && (
                <p className="text-sm text-red-500">{errors.region}</p>
              )}
            </div>

            {/* Département */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                Département *
              </Label>
              <Select 
                value={formData.department} 
                onValueChange={(value) => handleInputChange("department", value)}
                disabled={isLoading || !formData.region}
              >
                <SelectTrigger className={`w-full ${errors.department ? "border-red-500" : ""}`}>
                  <SelectValue placeholder="Sélectionnez un département" />
                </SelectTrigger>
                <SelectContent className="z-[1850]">
                  {deptsFromStates?.map((dept) => (
                    <SelectItem key={dept.id} value={dept?.id.toString()}>
                      {dept?.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.department && (
                <p className="text-sm text-red-500">{errors.department}</p>
              )}
            </div>

            {/* Arrondissement */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                Arrondissement *
              </Label>
              <Select 
                value={formData.arrondissement} 
                onValueChange={(value) => handleInputChange("arrondissement", value)}
                disabled={isLoading || !formData.department}
              >
                <SelectTrigger className={`w-full ${errors.arrondissement ? "border-red-500" : ""}`}>
                  <SelectValue placeholder="Sélectionnez un arrondissement" />
                </SelectTrigger>
                <SelectContent className="z-[1850]">
                  {districtsFromStates?.map((arrondissement) => (
                    <SelectItem key={arrondissement.id} value={arrondissement?.id.toString()}>
                      {arrondissement?.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.arrondissement && (
                <p className="text-sm text-red-500">{errors.arrondissement}</p>
              )}
            </div>

            {/* Ville */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                Ville *
              </Label>
              <Select 
                value={formData.town} 
                onValueChange={(value) => handleInputChange("town", value)}
                disabled={isLoading || !formData.arrondissement}
              >
                <SelectTrigger className={`w-full ${errors.town ? "border-red-500" : ""}`}>
                  <SelectValue placeholder="Sélectionnez une ville" />
                </SelectTrigger>
                <SelectContent className="z-[1850]">
                  {Array.isArray(townsFromStates) && townsFromStates?.map((town) => (
                    <SelectItem key={town?.id} value={town?.id.toString()}>
                      {town?.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.town && (
                <p className="text-sm text-red-500">{errors.town}</p>
              )}
            </div>
          </div>

          {/* Lieu */}
          <div className="space-y-2">
            <Label htmlFor="place" className="flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              Lieu-dit (Adresse) *
            </Label>
            <Input
              id="place"
              type="text"
              placeholder="Entrez l'adresse précise de la cité"
              value={formData.place}
              onChange={(e) => handleInputChange("place", e.target.value)}
              disabled={isLoading}
              className={errors.place ? "border-red-500" : ""}
            />
            {errors.place && (
              <p className="text-sm text-red-500">{errors.place}</p>
            )}
          </div>

          {/* Type de bâtiment */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Type className="w-4 h-4" />
              Type de bâtiment
            </Label>
            <Select 
              value={formData.buildingsType} 
              onValueChange={(value: 'COLLECTIVE' | 'INDIVIDUAL') => 
                handleInputChange("buildingsType", value)
              }
              disabled={isLoading}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="z-[1850]">
                <SelectItem value="COLLECTIVE">Collectif</SelectItem>
                <SelectItem value="INDIVIDUAL">Individuel</SelectItem>
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

export default HousingEstateFormModal;