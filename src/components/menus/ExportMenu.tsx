import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent } from "../ui/card";
import { Button } from "../ui/button";
import { Download, File, X, Printer, Map, Building, Filter, Settings } from "lucide-react";
import { closeMenu } from "../../app/store/slices/settingSlice";
import { useDispatch, useSelector } from "react-redux";
import { useToast } from "../../hooks/useToast";
import { useState } from "react";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Switch } from "../ui/switch";
import { Textarea } from "../ui/textarea";
import { Badge } from "../ui/badge";
import { Slider } from "../ui/slider";

interface ExportConfig {
  format: "A4" | "A3" | "CUSTOM";
  orientation: "portrait" | "landscape";
  includeMap: boolean;
  includeDataTable: boolean;
  includeOverlappingAreas: boolean;
  includePropertyDetails: boolean;
  quality: "low" | "medium" | "high";
  customWidth?: number;
  customHeight?: number;
}

interface DataFilters {
  region: string;
  department: string;
  town: string;
  housingEstate: string;
  propertyType: string;
  status: string;
  dateRange: string;
}

const ExportMenu = () => {
    const dispatch = useDispatch();
    const { toast } = useToast();
    
    const [exportConfig, setExportConfig] = useState<ExportConfig>({
      format: "A4",
      orientation: "portrait",
      includeMap: true,
      includeDataTable: true,
      includeOverlappingAreas: false,
      includePropertyDetails: true,
      quality: "medium"
    });

    const [dataFilters, setDataFilters] = useState<DataFilters>({
      region: '',
      department: '',
      town: '',
      housingEstate: '',
      propertyType: '',
      status: '',
      dateRange: 'all'
    });

    const [exportTitle, setExportTitle] = useState("Rapport Propriétés");
    const [exportDescription, setExportDescription] = useState("");
    const [isGenerating, setIsGenerating] = useState(false);
    const [selectedProperties, setSelectedProperties] = useState<string[]>([]);
    const [showAdvancedOptions, setShowAdvancedOptions] = useState(false);

    // Données simulées pour les propriétés
    const mockProperties = [
      { id: "PROP_001", name: "Propriété Nord", area: 1500, status: "BATI" },
      { id: "PROP_002", name: "Propriété Sud", area: 2000, status: "NON_BATI" },
      { id: "PROP_003", name: "Propriété Est", area: 1750, status: "BATI" },
    ];

    // Gestion de la configuration d'export
    const handleExportConfigChange = (field: keyof ExportConfig, value: any) => {
      setExportConfig(prev => ({
        ...prev,
        [field]: value
      }));
    };

    // Gestion des filtres
    const handleFilterChange = (field: keyof DataFilters, value: string) => {
      setDataFilters(prev => ({
        ...prev,
        [field]: value
      }));
    };

    // Sélection/désélection des propriétés
    const handlePropertySelection = (propertyId: string) => {
      setSelectedProperties(prev => 
        prev.includes(propertyId) 
          ? prev.filter(id => id !== propertyId)
          : [...prev, propertyId]
      );
    };

    // Sélectionner toutes les propriétés
    const handleSelectAllProperties = () => {
      if (selectedProperties.length === mockProperties.length) {
        setSelectedProperties([]);
      } else {
        setSelectedProperties(mockProperties.map(p => p.id));
      }
    };

    // Génération du PDF
    const generatePDF = async () => {
      if (!exportConfig.includeMap && !exportConfig.includeDataTable) {
        toast({
          title: "Configuration invalide",
          description: "Sélectionnez au moins une option d'export (carte ou tableau)",
          variant: "destructive"
        });
        return;
      }

      setIsGenerating(true);

      try {
        // Simulation de la génération du PDF
        await new Promise(resolve => setTimeout(resolve, 3000));

        // Ici, vous intégreriez une bibliothèque comme jsPDF ou html2canvas
        // pour générer le PDF réel

        const selectedCount = selectedProperties.length || mockProperties.length;
        
        toast({
          title: "PDF généré avec succès",
          description: `Rapport exporté avec ${selectedCount} propriété(s)`,
          variant: "default"
        });

        // Simulation du téléchargement
        simulateDownload();

      } catch (error) {
        console.error("Erreur lors de la génération du PDF:", error);
        toast({
          title: "Erreur",
          description: "Impossible de générer le PDF",
          variant: "destructive"
        });
      } finally {
        setIsGenerating(false);
      }
    };

    // Simulation du téléchargement
    const simulateDownload = () => {
      const link = document.createElement('a');
      link.href = '#';
      link.download = `${exportTitle.replace(/\s+/g, '_')}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    };

    // Réinitialiser la configuration
    const handleResetConfig = () => {
      setExportConfig({
        format: "A4",
        orientation: "portrait",
        includeMap: true,
        includeDataTable: true,
        includeOverlappingAreas: false,
        includePropertyDetails: true,
        quality: "medium"
      });
      setExportTitle("Rapport Propriétés");
      setExportDescription("");
      setSelectedProperties([]);

      toast({
        title: "Configuration réinitialisée",
        description: "Tous les paramètres ont été réinitialisés",
        variant: "default"
      });
    };

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0, y: 100 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 0 }}
                className="absolute z-[1100] md:max-w-2xl md:min-w-sm md:w-auto w-[90%] bottom-4 left-1/2 -translate-x-1/2 max-h-[600px]"
            >
                <Card className="py-2">
                    <CardContent className="p-4">
                        <div className="flex flex-col items-start justify-between max-h-[550px] overflow-y-auto">
                            <h1 className="relative flex flex-row items-center w-full mb-4 font-bold text-gray-500">
                                <Button 
                                    className="absolute flex items-center justify-center font-bold text-black bg-transparent shadow-none cursor-pointer right-2 hover:bg-gray-300/90"
                                    onClick={() => dispatch(closeMenu())}
                                >
                                    <X className="w-4 h-4" />
                                </Button>
                                <Download className="w-4 h-4 mr-2" />
                                EXPORT MENU
                            </h1>
                            
                            <div className="w-full space-y-6">
                                {/* Configuration de base */}
                                {/* <div className="space-y-4">
                                    <h3 className="flex items-center gap-2 font-semibold text-md">
                                        <Settings className="w-4 h-4" />
                                        Configuration d'export
                                    </h3>
                                    
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label>Format</Label>
                                            <Select
                                                value={exportConfig.format}
                                                onValueChange={(value: "A4" | "A3" | "CUSTOM") => 
                                                    handleExportConfigChange('format', value)
                                                }
                                            >
                                                <SelectTrigger>
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="A4">A4</SelectItem>
                                                    <SelectItem value="A3">A3</SelectItem>
                                                    <SelectItem value="CUSTOM">Personnalisé</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        <div className="space-y-2">
                                            <Label>Orientation</Label>
                                            <Select
                                                value={exportConfig.orientation}
                                                onValueChange={(value: "portrait" | "landscape") => 
                                                    handleExportConfigChange('orientation', value)
                                                }
                                            >
                                                <SelectTrigger>
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="portrait">Portrait</SelectItem>
                                                    <SelectItem value="landscape">Paysage</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <Label>Qualité</Label>
                                        <Select
                                            value={exportConfig.quality}
                                            onValueChange={(value: "low" | "medium" | "high") => 
                                                handleExportConfigChange('quality', value)
                                            }
                                        >
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="low">Basse</SelectItem>
                                                <SelectItem value="medium">Moyenne</SelectItem>
                                                <SelectItem value="high">Haute</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div> */}

                                {/* Options de contenu */}
                                {/* <div className="space-y-4">
                                    <h3 className="flex items-center gap-2 font-semibold text-md">
                                        <File className="w-4 h-4" />
                                        Contenu à inclure
                                    </h3>
                                    
                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between">
                                            <Label className="flex items-center gap-2">
                                                <Map className="w-4 h-4" />
                                                Carte géographique
                                            </Label>
                                            <Switch
                                                checked={exportConfig.includeMap}
                                                onCheckedChange={(checked) => 
                                                    handleExportConfigChange('includeMap', checked)
                                                }
                                            />
                                        </div>

                                        <div className="flex items-center justify-between">
                                            <Label className="flex items-center gap-2">
                                                <Printer className="w-4 h-4" />
                                                Tableau des données
                                            </Label>
                                            <Switch
                                                checked={exportConfig.includeDataTable}
                                                onCheckedChange={(checked) => 
                                                    handleExportConfigChange('includeDataTable', checked)
                                                }
                                            />
                                        </div>

                                        <div className="flex items-center justify-between">
                                            <Label className="flex items-center gap-2">
                                                <Filter className="w-4 h-4" />
                                                Zones d'empiètement
                                            </Label>
                                            <Switch
                                                checked={exportConfig.includeOverlappingAreas}
                                                onCheckedChange={(checked) => 
                                                    handleExportConfigChange('includeOverlappingAreas', checked)
                                                }
                                            />
                                        </div>

                                        <div className="flex items-center justify-between">
                                            <Label className="flex items-center gap-2">
                                                <Building className="w-4 h-4" />
                                                Détails des propriétés
                                            </Label>
                                            <Switch
                                                checked={exportConfig.includePropertyDetails}
                                                onCheckedChange={(checked) => 
                                                    handleExportConfigChange('includePropertyDetails', checked)
                                                }
                                            />
                                        </div>
                                    </div>
                                </div> */}

                                {/* Métadonnées */}
                                <div className="space-y-4">
                                    <h3 className="font-semibold text-md">Métadonnées</h3>
                                    
                                    <div className="space-y-3">
                                        <div className="space-y-2">
                                            <Label>Titre du rapport</Label>
                                            <Input
                                                value={exportTitle}
                                                onChange={(e) => setExportTitle(e.target.value)}
                                                placeholder="Entrez le titre du rapport"
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <Label>Description (optionnel)</Label>
                                            <Textarea
                                                value={exportDescription}
                                                onChange={(e) => setExportDescription(e.target.value)}
                                                placeholder="Description du rapport..."
                                                rows={3}
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Sélection des propriétés */}
                                {/* <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <h3 className="font-semibold text-md">Propriétés à inclure</h3>
                                        <Badge variant="secondary">
                                            {selectedProperties.length || "Toutes"} sélectionnées
                                        </Badge>
                                    </div>
                                    
                                    <div className="p-2 space-y-2 overflow-y-auto border rounded-md max-h-32">
                                        <div className="flex items-center justify-between p-2 border-b">
                                            <Label className="text-sm">Sélection multiple</Label>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={handleSelectAllProperties}
                                            >
                                                {selectedProperties.length === mockProperties.length ? "Tout désélectionner" : "Tout sélectionner"}
                                            </Button>
                                        </div>
                                        
                                        {mockProperties.map((property) => (
                                            <div
                                                key={property.id}
                                                className="flex items-center justify-between p-2 rounded hover:bg-gray-50"
                                            >
                                                <Label className="flex items-center flex-1 gap-2 cursor-pointer">
                                                    <input
                                                        type="checkbox"
                                                        checked={selectedProperties.includes(property.id)}
                                                        onChange={() => handlePropertySelection(property.id)}
                                                        className="border-gray-300 rounded"
                                                    />
                                                    <span className="text-sm">
                                                        {property.name} ({property.area}m²)
                                                    </span>
                                                    <Badge variant={property.status === "BATI" ? "default" : "secondary"}>
                                                        {property.status}
                                                    </Badge>
                                                </Label>
                                            </div>
                                        ))}
                                    </div>
                                </div> */}

                                {/* Options avancées */}
                                {/* <div className="space-y-4">
                                    <Button
                                        variant="outline"
                                        className="w-full"
                                        onClick={() => setShowAdvancedOptions(!showAdvancedOptions)}
                                    >
                                        <Settings className="w-4 h-4 mr-2" />
                                        {showAdvancedOptions ? "Masquer les options avancées" : "Options avancées"}
                                    </Button>

                                    {showAdvancedOptions && (
                                        <div className="p-4 space-y-4 border rounded-md">
                                            <div className="space-y-2">
                                                <Label>Filtres avancés</Label>
                                                <div className="grid grid-cols-2 gap-3">
                                                    <Select
                                                        value={dataFilters.region}
                                                        onValueChange={(value) => handleFilterChange('region', value)}
                                                    >
                                                        <SelectTrigger>
                                                            <SelectValue placeholder="Région" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="region1">Région 1</SelectItem>
                                                            <SelectItem value="region2">Région 2</SelectItem>
                                                        </SelectContent>
                                                    </Select>

                                                    <Select
                                                        value={dataFilters.propertyType}
                                                        onValueChange={(value) => handleFilterChange('propertyType', value)}
                                                    >
                                                        <SelectTrigger>
                                                            <SelectValue placeholder="Type" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="BATI">Bâti</SelectItem>
                                                            <SelectItem value="NON_BATI">Non bâti</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div> */}

                                {/* Actions */}
                                <div className="flex gap-3 pt-4 border-t">
                                    <Button
                                        variant="outline"
                                        onClick={handleResetConfig}
                                        disabled={isGenerating}
                                        className="flex-1"
                                    >
                                        Réinitialiser
                                    </Button>
                                    <Button
                                        onClick={generatePDF}
                                        disabled={isGenerating}
                                        className="flex-1"
                                    >
                                        {isGenerating ? (
                                            <>
                                                <div className="w-4 h-4 mr-2 border-b-2 border-white rounded-full animate-spin" />
                                                Génération...
                                            </>
                                        ) : (
                                            <>
                                                <Download className="w-4 h-4 mr-2" />
                                                Exporter en PDF
                                            </>
                                        )}
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </motion.div>
        </AnimatePresence>
    );
}

export default ExportMenu;