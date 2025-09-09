import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent } from "../ui/card";
import { Button } from "../ui/button";
import { Download, File, X, Save, Building } from "lucide-react";
import { closeMenu } from "../../app/store/slices/settingSlice";
import { useDispatch } from "react-redux";
import { useToast } from "../../hooks/useToast";
import { useState } from "react";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { createHousingEstate } from "../../app/store/slices/housingEstateSlice";
import { createPlot } from "../../app/store/slices/plotSlice";

interface GeoJsonInformations {
    name: string;
    size: number;
    type: string;
    featureCount: number;
    geometryTypesText: string;
    propertiesText: string;
    crs: string;
}

interface HousingEstateFormData {
    name: string;
    region: string;
    city: string;
    department: string;
    district: string;
    place: string;
    buildingsType: 'COLLECTIVE' | 'INDIVIDUAL';
}

interface FeatureData {
    code: string;
    geom: Record<string, unknown>;
    region?: string;
    city?: string;
    department?: string;
    district?: string;
    place?: string;
    TFnumber?: string;
    acquiredYear?: number;
    classification?: number;
    area?: number;
    price?: number;
    marketValue?: number;
    observations?: string;
    status?: "BATI" | "NON BATI";
    housingEstateId?: number;
}

const FileMenu = () => {
    const dispatch = useDispatch();
    const { toast } = useToast();
    const [importedFile, setImportedFile] = useState<GeoJsonInformations | null>(null);
    const [geojsonData, setGeojsonData] = useState<Record<string, unknown> | null>(null);
    const [showHousingEstateForm, setShowHousingEstateForm] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [housingEstateForm, setHousingEstateForm] = useState<HousingEstateFormData>({
        name: "",
        region: '',
        city: '',
        department: '',
        district: '',
        place: '',
        buildingsType: 'COLLECTIVE'
    });

    // Helper function to format file size
    const formatFileSize = (bytes: number): string => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    // Helper function to analyze GeoJSON structure
    const analyzeGeoJSON = (geojson: Record<string, unknown>) => {
        const info = {
            type: geojson.type || 'Unknown',
            featureCount: 0,
            geometryTypes: new Set<string>(),
            properties: new Set<string>(),
            bounds: null as unknown
        };

        if (geojson.type === 'FeatureCollection' && Array.isArray(geojson.features)) {
            info.featureCount = geojson.features.length;
            
            geojson.features.forEach((feature: Record<string, unknown>) => {
                const geometry = feature.geometry as Record<string, unknown>;
                const properties = feature.properties as Record<string, unknown>;
                
                if (geometry && geometry.type) {
                    info.geometryTypes.add(geometry.type as string);
                }
                if (properties) {
                    Object.keys(properties).forEach(prop => info.properties.add(prop));
                }
            });
        } else if (geojson.type === 'Feature') {
            info.featureCount = 1;
            const geometry = geojson.geometry as Record<string, unknown>;
            const properties = geojson.properties as Record<string, unknown>;
            
            if (geometry && geometry.type) {
                info.geometryTypes.add(geometry.type as string);
            }
            if (properties) {
                Object.keys(properties).forEach(prop => info.properties.add(prop));
            }
        }

        return info;
    };

    // Fonction pour générer un code unique
    const generateUniqueCode = (): string => {
        const timestamp = Date.now().toString(36);
        const randomStr = Math.random().toString(36).substring(2, 8);
        return `PROP_${timestamp}_${randomStr}`.toUpperCase();
    };

    // Fonction pour convertir Polygon en MultiPolygon
    const convertToMultiPolygon = (geometry: Record<string, unknown>): Record<string, unknown> => {
        if (geometry.type === 'Polygon') {
            return {
                type: 'MultiPolygon',
                coordinates: [geometry.coordinates]
            };
        }
        if (geometry.type === 'MultiPolygon') {
            return geometry;
        }
        throw new Error(`Type de géométrie non supporté: ${geometry.type}`);
    };

    // Fonction pour extraire les données des features
    const extractFeaturesData = (geojson: Record<string, unknown>): FeatureData[] => {
        const features: FeatureData[] = [];
        
        if (geojson.type === 'FeatureCollection' && Array.isArray(geojson.features)) {
            geojson.features.forEach((feature: Record<string, unknown>) => {
                const properties = (feature.properties as Record<string, unknown>) || {};
                const geometry = feature.geometry;
                
                if (geometry) {
                    const featureData: FeatureData = {
                        code: (properties.code as string) || generateUniqueCode(),
                        geom: convertToMultiPolygon(geometry as Record<string, unknown>),
                        region: (properties.region as string) || undefined,
                        city: (properties.city as string) || undefined,
                        department: (properties.department as string) || undefined,
                        district: (properties.district as string) || undefined,
                        place: (properties.place as string) || undefined,
                        TFnumber: (properties.TFnumber as string) || (properties.tfnumber as string) || undefined,
                        acquiredYear: (properties.acquiredYear as number) || (properties.year as number) || undefined,
                        classification: (properties.classification as number) || undefined,
                        area: (properties.area as number) || undefined,
                        price: (properties.price as number) || undefined,
                        marketValue: (properties.marketValue as number) || (properties.market_value as number) || undefined,
                        observations: (properties.observations as string) || undefined,
                        status: (properties.status as "BATI" | "NON BATI") || undefined,
                        housingEstateId: undefined
                    };
                    features.push(featureData);
                }
            });
        } else if (geojson.type === 'Feature') {
            const properties = (geojson.properties as Record<string, unknown>) || {};
            const geometry = geojson.geometry;
            
            if (geometry) {
                const featureData: FeatureData = {
                    code: (properties.code as string) || generateUniqueCode(),
                    geom: convertToMultiPolygon(geometry as Record<string, unknown>),
                    region: (properties.region as string) || undefined,
                    city: (properties.city as string) || undefined,
                    department: (properties.department as string) || undefined,
                    district: (properties.district as string) || undefined,
                    place: (properties.place as string) || undefined,
                    TFnumber: (properties.TFnumber as string) || (properties.tfnumber as string) || undefined,
                    acquiredYear: (properties.acquiredYear as number) || (properties.year as number) || undefined,
                    classification: (properties.classification as number) || undefined,
                    area: (properties.area as number) || undefined,
                    price: (properties.price as number) || undefined,
                    marketValue: (properties.marketValue as number) || (properties.market_value as number) || undefined,
                    observations: (properties.observations as string) || undefined,
                    status: (properties.status as "BATI" | "NON BATI") || undefined,
                    housingEstateId: undefined
                };
                features.push(featureData);
            }
        }
        
        return features;
    };

    // Fonction pour créer un housing estate via l'API
    const createHE = async (formData: HousingEstateFormData): Promise<string | null> => {
        try {
            const response = await dispatch(createHousingEstate(formData));
            
            if(response.type.includes("rejected"))
            {
                throw new Error('Erreur lors de l\'envoi des données');
            }

            return (response.payload as { housingEstate: { id: string } }).housingEstate.id;
        } catch (error) {
            console.error('Erreur:', error);
            toast({
                title: "Erreur",
                description: "Impossible de créer la cité",
                variant: "destructive"
            });
            return null;
        }
    };

    // Fonction pour envoyer les features à l'API
    const sendFeaturesToAPI = async (features: FeatureData[], housingEstateId: string | null = null, housingEstateData: HousingEstateFormData | null = null) => {
        try {
            const results = [];
            
            for (const feature of features) {
                const updatedFeature = {
                    ...feature,
                    housingEstateId: housingEstateId ? parseInt(housingEstateId) : feature.housingEstateId
                };

                // Si un housing estate est spécifié, reporter ses attributs sur les features enfants
                if (housingEstateId && housingEstateData) {
                    updatedFeature.region = housingEstateData.region || feature.region;
                    updatedFeature.department = housingEstateData.department || feature.department;
                    updatedFeature.district = housingEstateData.district || feature.district;
                    updatedFeature.place = housingEstateData.place || feature.place;
                }

                const response = await dispatch(createPlot(updatedFeature));
                
                if(response.type.includes("rejected"))
                {
                    throw new Error('Erreur lors de l\'envoi des données');
                }

                results.push(response.payload);
            }

            return results;

            /*const response = await fetch('/api/features', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(featuresToSend)
            });

            if (!response.ok) {
                throw new Error('Erreur lors de l\'envoi des données');
            }

            return await response.json();*/
        } catch (error) {
            console.error('Erreur lors de l\'envoi des features:', error);
            throw error;
        }
    };

    // Fonction pour sauvegarder les données
    const handleSaveData = async () => {
        if (!geojsonData) return;

        setIsSubmitting(true);
        try {
            const features = extractFeaturesData(geojsonData);
            let housingEstateId: string | null = null;

            // Si le formulaire housing estate est rempli, on le crée d'abord
            if (showHousingEstateForm && 
                (housingEstateForm.region || housingEstateForm.city || housingEstateForm.department)) {
                
                housingEstateId = await createHE(housingEstateForm);
                if (!housingEstateId) {
                    setIsSubmitting(false);
                    return;
                }
            }

            // Envoi des features à l'API
            await sendFeaturesToAPI(features, housingEstateId, showHousingEstateForm ? housingEstateForm : null);
            
            toast({
                title: "Succès",
                description: `${features.length} feature(s) ont été sauvegardées avec succès`,
                variant: "default"
            });

            // Réinitialiser l'état
            setImportedFile(null);
            setGeojsonData(null);
            setShowHousingEstateForm(false);
            setHousingEstateForm({
                name: '',
                region: '',
                city: '',
                department: '',
                district: '',
                place: '',
                buildingsType: 'COLLECTIVE'
            });

        } catch (error) {
            toast({
                title: "Erreur",
                description: "Une erreur est survenue lors de la sauvegarde",
                variant: "destructive"
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleImportGeoJson = () => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.geojson,application/geo+json,application/json';
        input.onchange = (e: Event) => {
            const target = e.target as HTMLInputElement;
            const file = target.files?.[0];
            if (file) {
                const maxSize = 7 * 1024 * 1024;
                if (file.size > maxSize) {
                    toast({
                        title: "Fichier trop volumineux",
                        description: `Le fichier fait ${formatFileSize(file.size)}. La taille maximale autorisée est de 7 MB.`,
                        variant: "destructive"
                    });
                    return;
                }

                const reader = new FileReader();
                reader.onload = (event) => {
                    try {
                        const result = event.target?.result;
                        if (typeof result !== 'string') {
                            throw new Error('Invalid file content');
                        }
                        const geojson = JSON.parse(result);
                        
                        if (!geojson.type || !['Feature', 'FeatureCollection', 'Geometry'].includes(geojson.type)) {
                            toast({
                                title: "Format GeoJSON invalide",
                                description: "Le fichier ne semble pas être un GeoJSON valide.",
                                variant: "destructive"
                            });
                            return;
                        }

                        const analysis = analyzeGeoJSON(geojson);
                        const geometryTypesText = Array.from(analysis.geometryTypes).join(', ') || 'Aucun';
                        const propertiesText = Array.from(analysis.properties).slice(0, 5).join(', ') + 
                            (analysis.properties.size > 5 ? ` (+${analysis.properties.size - 5} autres)` : '');

                        setImportedFile({
                            name: file.name,
                            size: file.size,
                            type: analysis.type,
                            featureCount: analysis.featureCount,
                            geometryTypesText,
                            propertiesText,
                            crs: (geojson.crs as { properties?: { name?: string } })?.properties?.name || "Inconnu"
                        });

                        setGeojsonData(geojson);
                        
                        toast({
                            title: "GeoJSON importé avec succès !",
                            description: `Prêt à sauvegarder ${analysis.featureCount} feature(s)`
                        });

                    } catch (error) {
                        console.error('Erreur lors de l\'import:', error);
                        toast({
                            title: "Erreur lors de l'import",
                            description: "Le fichier n'est pas un JSON valide ou n'est pas un GeoJSON correct.",
                            variant: "destructive"
                        });
                    }
                };
                reader.readAsText(file);
            }
        };
        input.click();
    };

    const handleHousingEstateFormChange = (field: keyof HousingEstateFormData, value: string) => {
        setHousingEstateForm(prev => ({
            ...prev,
            [field]: value
        }));
    };

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0, y: 100 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 0 }}
                className="absolute z-[1100] md:max-w-xl md:min-w-sm md:w-auto w-[90%] bottom-4 left-1/2 -translate-x-1/2 max-h-[400px]"
            >
                <Card className="py-2">
                    <CardContent className="p-4">
                        <div className="flex flex-col items-start justify-between max-h-[300px] overflow-y-auto">
                            <h1 className="relative flex flex-row items-center w-full mb-4 font-bold text-gray-500">
                                <Button 
                                    className="absolute flex items-center justify-center font-bold text-black bg-transparent shadow-none cursor-pointer right-2 hover:bg-gray-300/90"
                                    onClick={() => dispatch(closeMenu())}
                                >
                                    <X className="w-4 h-4" />
                                </Button>
                                <File className="w-4 h-4 mr-2" />
                                FILE MENU
                            </h1>
                            <div className="w-full overflow-auto ">
                                {importedFile ? (
                                    <div className="mb-4">
                                        <h2 className="mb-2 font-semibold text-md">Informations du fichier importé</h2>
                                        <ul className="text-sm text-gray-700 dark:text-gray-300">
                                            <li><span className="font-medium">Nom:</span> {importedFile.name}</li>
                                            <li><span className="font-medium">Taille:</span> {formatFileSize(importedFile.size)}</li>
                                            <li><span className="font-medium">Type:</span> {importedFile.type}</li>
                                            <li><span className="font-medium">Features:</span> {importedFile.featureCount}</li>
                                            <li><span className="font-medium">CRS:</span> {importedFile.crs || "Inconnu"}</li>
                                        </ul>

                                        <Button
                                            variant="outline"
                                            className="mt-2 cursor-pointer"
                                            onClick={() => setShowHousingEstateForm(!showHousingEstateForm)}
                                        >
                                            <Building className="w-4 h-4 mr-2" />
                                            {showHousingEstateForm ? 'Masquer X' : 'Ajouter à une cité'}
                                        </Button>

                                        {showHousingEstateForm && (
                                            <div className="p-4 mt-4 border rounded-md">
                                                <h3 className="mb-3 font-semibold">Informations sur la cité</h3>
                                                <div className="grid grid-cols-1 gap-3 mb-2">
                                                    <div className="space-y-2">
                                                        <Label>Nom</Label>
                                                        <Input
                                                            value={housingEstateForm.name}
                                                            onChange={(e) => handleHousingEstateFormChange('name', e.target.value)}
                                                        />
                                                    </div>
                                                </div>
                                                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                                                    <div className="space-y-2">
                                                        <Label>Région</Label>
                                                        <Input
                                                            value={housingEstateForm.region}
                                                            onChange={(e) => handleHousingEstateFormChange('region', e.target.value)}
                                                        />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <Label>Ville</Label>
                                                        <Input
                                                            value={housingEstateForm.city}
                                                            onChange={(e) => handleHousingEstateFormChange('city', e.target.value)}
                                                        />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <Label>Département</Label>
                                                        <Input
                                                            value={housingEstateForm.department}
                                                            onChange={(e) => handleHousingEstateFormChange('department', e.target.value)}
                                                        />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <Label>District</Label>
                                                        <Input
                                                            value={housingEstateForm.district}
                                                            onChange={(e) => handleHousingEstateFormChange('district', e.target.value)}
                                                        />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <Label>Lieu</Label>
                                                        <Input
                                                            value={housingEstateForm.place}
                                                            onChange={(e) => handleHousingEstateFormChange('place', e.target.value)}
                                                        />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <Label>Type de bâtiment</Label>
                                                        <Select
                                                            value={housingEstateForm.buildingsType}
                                                            onValueChange={(value: 'COLLECTIVE' | 'INDIVIDUAL') => 
                                                                handleHousingEstateFormChange('buildingsType', value)}
                                                        >
                                                            <SelectTrigger className="w-full">
                                                                <SelectValue />
                                                            </SelectTrigger>
                                                            <SelectContent className="z-[1200] w-full">
                                                                <SelectItem value="COLLECTIVE">Collectif</SelectItem>
                                                                <SelectItem value="INDIVIDUAL">Individuel</SelectItem>
                                                            </SelectContent>
                                                        </Select>
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        <Button
                                            className="w-full mt-4 cursor-pointer"
                                            onClick={handleSaveData}
                                            disabled={isSubmitting}
                                        >
                                            <Save className="w-4 h-4 mr-2" />
                                            {isSubmitting ? 'Sauvegarde...' : 'Sauvegarder les données'}
                                        </Button>
                                    </div>
                                ) : (
                                    <Button
                                        variant="ghost"
                                        className="flex flex-row ml-2 cursor-pointer active:bg-secondary"
                                        onClick={handleImportGeoJson}
                                    >
                                        <Download className="w-4 h-4 mr-2" />
                                        Importer GeoJSON (taille &lt; 7 MB)
                                    </Button>
                                )}
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </motion.div>
        </AnimatePresence>
    );
}

export default FileMenu;