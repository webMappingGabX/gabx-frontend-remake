import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent } from "../ui/card";
import { Button } from "../ui/button";
import { Search, Eye, X, Filter, MapPin, Home, Building } from "lucide-react";
import { closeMenu, selectOverlaps, selectSearch, toggleOverlaps, toggleSearch } from "../../app/store/slices/settingSlice";
import { useDispatch, useSelector } from "react-redux";
import { useToast } from "../../hooks/useToast";
import { useEffect, useState } from "react";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Badge } from "../ui/badge";
import { Switch } from "../ui/switch";

interface SearchFilters {
  region: string;
  department: string;
  arrondissement: string;
  town: string;
  housingEstate: string;
  propertyType: string;
  status: string;
}

const ViewMenu = () => {
    const dispatch = useDispatch();
    const { toast } = useToast();

    const [searchFilters, setSearchFilters] = useState<SearchFilters>({
      region: '',
      department: '',
      arrondissement: '',
      town: '',
      housingEstate: '',
      propertyType: '',
      status: ''
    });

    const [searchQuery, setSearchQuery] = useState("");
    const [overlappingAreas, setOverlappingAreas] = useState<any[]>([]);

    const selectSearchFromState = useSelector(selectSearch);
    const selectOverlapsFromState = useSelector(selectOverlaps);

    // Données simulées pour les empiètements
    const mockOverlappingAreas = [
      {
        id: 1,
        properties: ["PROP_001", "PROP_002"],
        area: 150.5,
        severity: "HIGH",
        location: "Zone Nord",
        coordinates: []
      },
      {
        id: 2,
        properties: ["PROP_003", "PROP_004", "PROP_005"],
        area: 75.2,
        severity: "MEDIUM",
        location: "Zone Sud",
        coordinates: []
      },
      {
        id: 3,
        properties: ["PROP_006", "PROP_007"],
        area: 210.8,
        severity: "LOW",
        location: "Zone Est",
        coordinates: []
      }
    ];

    // Charger les empiètements au montage
    useEffect(() => {
      // Simuler le chargement des données d'empiètement
      setOverlappingAreas(mockOverlappingAreas);
    }, []);

    // Gestion des options d'affichage
    const handleViewOverlapChange = () => {
        dispatch(toggleOverlaps());
    }

    /*useEffect(() => {
        toast({
            title: "Affichage mis à jour",
            description: `Option Afficher les empiètement ${selectOverlapsFromState ? 'activée' : 'désactivée'}`,
            variant: "default"
        });
    }, [selectOverlapsFromState])*/

    
    const handleViewSearchChange = () => {
        dispatch(toggleSearch());
    }

    /*useEffect(() => {
        toast({
            title: "Affichage mis à jour",
            description: `Option Afficher la zone de recherche ${selectSearchFromState ? 'activée' : 'désactivée'}`,
            variant: "default"
        });
    }, [selectSearchFromState])*/


    // Afficher les détails d'un empiètement
    const handleShowOverlapDetails = (overlap: any) => {
      toast({
        title: `Empiètement #${overlap.id}`,
        description: `${overlap.properties.length} propriétés concernées - ${overlap.area}m²`,
        variant: "default"
      });

      // Ici, vous pourriez zoomer sur la zone d'empiètement
      console.log("Focus on overlap:", overlap);
    };

    // Obtenir la couleur de sévérité
    const getSeverityColor = (severity: string) => {
      switch (severity) {
        case "HIGH": return "bg-red-500";
        case "MEDIUM": return "bg-orange-500";
        case "LOW": return "bg-yellow-500";
        default: return "bg-gray-500";
      }
    };

    // Obtenir le texte de sévérité
    const getSeverityText = (severity: string) => {
      switch (severity) {
        case "HIGH": return "Élevé";
        case "MEDIUM": return "Moyen";
        case "LOW": return "Faible";
        default: return "Inconnu";
      }
    };

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0, y: 100 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 0 }}
                className="absolute z-[1100] md:max-w-xl md:min-w-sm md:w-auto w-[90%] bottom-4 left-1/2 -translate-x-1/2 max-h-[500px]"
            >
                <Card className="py-2">
                    <CardContent className="p-4">
                        <div className="flex flex-col items-start justify-between max-h-[450px] overflow-y-auto">
                            <h1 className="relative flex flex-row items-center w-full mb-4 font-bold text-gray-500">
                                <Button 
                                    className="absolute flex items-center justify-center font-bold text-black bg-transparent shadow-none cursor-pointer right-2 hover:bg-gray-300/90"
                                    onClick={() => dispatch(closeMenu())}
                                >
                                    <X className="w-4 h-4" />
                                </Button>
                                <Eye className="w-4 h-4 mr-2" />
                                VIEW MENU
                            </h1>
                            
                            <div className="w-full space-y-4">

                                {/* Options d'affichage */}
                                <div className="space-y-3">
                                    <h3 className="flex items-center gap-2 text-md">
                                        {/* <Eye className="w-4 h-4" /> */}
                                        Choisissez les elements a afficher/masquer
                                    </h3>
                                    
                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between">
                                            <Label className="text-sm">Empiètements</Label>
                                            <Switch
                                                checked={selectOverlapsFromState}
                                                onCheckedChange={handleViewOverlapChange}
                                            />
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <Label className="text-sm">Champ de recherche</Label>
                                            <Switch
                                                checked={selectSearchFromState}
                                                onCheckedChange={handleViewSearchChange}
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Empiettements */}
                                {/* <div className="space-y-3">
                                    <h3 className="flex items-center gap-2 font-semibold text-md">
                                        <MapPin className="w-4 h-4" />
                                        Zones d'empiètement
                                        <Badge variant="secondary" className="ml-2">
                                            {overlappingAreas.length}
                                        </Badge>
                                    </h3>
                                    
                                    {overlappingAreas.length > 0 ? (
                                        <div className="space-y-2 overflow-y-auto max-h-32">
                                            {overlappingAreas.map((overlap) => (
                                                <div
                                                    key={overlap.id}
                                                    className="p-2 border rounded-md cursor-pointer hover:bg-gray-50"
                                                    onClick={() => handleShowOverlapDetails(overlap)}
                                                >
                                                    <div className="flex items-center justify-between">
                                                        <div className="flex items-center gap-2">
                                                            <div className={`w-3 h-3 rounded-full ${getSeverityColor(overlap.severity)}`} />
                                                            <span className="text-sm font-medium">
                                                                Emp. #{overlap.id}
                                                            </span>
                                                        </div>
                                                        <Badge variant="outline">
                                                            {getSeverityText(overlap.severity)}
                                                        </Badge>
                                                    </div>
                                                    <div className="mt-1 text-xs text-gray-500">
                                                        {overlap.properties.length} propriétés • {overlap.area}m²
                                                    </div>
                                                    <div className="text-xs text-gray-400">
                                                        {overlap.location}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="py-4 text-sm text-center text-gray-500">
                                            <Building className="w-8 h-8 mx-auto mb-2 opacity-50" />
                                            Aucun empiètement détecté
                                        </div>
                                    )}
                                    
                                    <Button 
                                        variant="outline" 
                                        size="sm" 
                                        className="w-full"
                                        onClick={() => {
                                            toast({
                                                title: "Analyse des empiètements",
                                                description: "Recherche des conflits en cours...",
                                                variant: "default"
                                            });
                                        }}
                                    >
                                        <Search className="w-4 h-4 mr-2" />
                                        Analyser les empiètements
                                    </Button>
                                </div> */}
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </motion.div>
        </AnimatePresence>
    );
}

export default ViewMenu;