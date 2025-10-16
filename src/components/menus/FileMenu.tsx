import { motion, AnimatePresence, number } from "framer-motion";
import { Card, CardContent } from "../ui/card";
import { Button } from "../ui/button";
import { Download, File, X, Save, Building, Map, Satellite, Layers, Landmark } from "lucide-react";
import { closeMenu } from "../../app/store/slices/settingSlice";
import { useDispatch, useSelector } from "react-redux";
import { useToast } from "../../hooks/useToast";
import { useEffect, useState } from "react";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Select, SelectContent, SelectGroup, SelectItem, SelectSeparator, SelectTrigger, SelectValue } from "../ui/select";
import { clearCaracteritics, createHousingEstate, fetchHousingEstates, hasMassPlan, hasOrthoPhoto, hasPlot, selectHEHasMassPlan, selectHEHasOrthoPhoto, selectHEHasPlot, selectHousingEstates } from "../../app/store/slices/housingEstateSlice";
import { createPlot, fetchPlots, selectPlots, selectPlotsFilters } from "../../app/store/slices/plotSlice";
import { getArronds, getDepts, getRegions, getTowns, selectArrondState, selectDeptState, selectRegionsState, selectTokens, selectTownsState } from "../../app/store/slices/authSlice";
import { Separator } from "@radix-ui/react-dropdown-menu";
import { createBuilding, createPlan } from "../../app/store/slices/planSlice";
import { multiPolygonToPolygon } from "../../utils/tools";

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
    town: string;
    department: string;
    arrondissement: string;
    place: string;
    buildingsType: 'COLLECTIVE' | 'INDIVIDUAL';
}

interface PlotFormData {
    housingEstateId: string;
    type: 'PLAN_DE_MASSE' | 'ORTHO_PHOTO' | 'PERSO';
    area?: number;
    TFnumber?: string;
    acquiredYear?: number;
    classification?: number;
    plotArea?: number;
    price?: number;
    marketValue?: number;
    observations?: string;
    status?: "BATI" | "NON BATI";
    buildings?: any[];
    max?: number;
}

interface PlotData {
    housingEstateId: number;
    type: 'PLAN_DE_MASSE' | 'ORTHO_PHOTO' | 'PERSO';
    area?: number;
    TFnumber?: string;
    acquiredYear?: number;
    classification?: number;
    plotArea?: number;
    price?: number;
    marketValue?: number;
    observations?: string;
    status?: "BATI" | "NON BATI";
    buildings?: any[];
    max?: number;
    geom: Record<string, unknown>;
    code: string;
}

const FileMenu = () => {
    const dispatch = useDispatch();
    const { toast } = useToast();
    const [importedFile, setImportedFile] = useState<GeoJsonInformations | null>(null);
    const [tfImported, setTfImported] = useState<GeoJsonInformations | null>(null);
    const [geojsonData, setGeojsonData] = useState<Record<string, unknown> | null>(null);
    const [tfData, setTFData] = useState<Record<string, unknown> | null>(null);
    const [showHousingEstateForm, setShowHousingEstateForm] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [selectedHousingEstate, setSelectedHousingEstate] = useState<string>("");
    const [importType, setImportType] = useState<'PLAN_DE_MASSE' | 'ORTHO_PHOTO' | 'PERSO' | null>(null);
    const [hasTitreFoncier, setHasTitreFoncier] = useState<boolean>(false);
    
    const [housingEstateForm, setHousingEstateForm] = useState<HousingEstateFormData>({
        name: "",
        region: '',
        town: '',
        department: '',
        arrondissement: '',
        place: '',
        buildingsType: 'COLLECTIVE'
    });

    const [plotForm, setPlotForm] = useState<PlotFormData>({
        housingEstateId: '',
        type: 'PLAN_DE_MASSE',
        area: undefined,
        TFnumber: '',
        acquiredYear: undefined,
        classification: undefined,
        plotArea: undefined,
        price: undefined,
        marketValue: undefined,
        observations: '',
        status: undefined,
        buildings: [],
        max: 200
    });

    const regionsFromState = useSelector(selectRegionsState);
    const deptsFromStates = useSelector(selectDeptState);
    const districtsFromStates = useSelector(selectArrondState);
    const townsFromStates = useSelector(selectTownsState);
    const housingEstates = useSelector(selectHousingEstates);

    const selectPlotsFilterFS = useSelector(selectPlotsFilters);
    const selectPlotsFS = useSelector(selectPlots);

    const maxMo = 10;

    const [hasExistingMassePlan, setHasExistingMassePlan] = useState(false);
    const [hasExistingOrthophoto, setHasExistingOrthophoto] = useState(false);
    const [hasExistingPlot, setHasExistingPlot] = useState(false);

    const selectHasMassPlan = useSelector(selectHEHasMassPlan);
    const selectHasOrthoPhoto = useSelector(selectHEHasOrthoPhoto);
    const selectHasPlot = useSelector(selectHEHasPlot);

    const loadHousingEstates = async () => {
        try {
            const response = await dispatch(fetchHousingEstates());
            console.log("LOADED HOUSING ESTATES", response);
        } catch (err) {
            console.log("FAILED TO LOAD HOUSING ESTATES", err);
        }
    }

    // Use Effect
    useEffect(() => {
        const loadRegions = async () => {
            try {
                const response = await dispatch(getRegions());
            } catch (err) {
                console.log("FAILED TO LOAD REGIONS", err);
            }
        }

        loadRegions();
        loadHousingEstates();
    }, []);

    useEffect(() => {
        const loadDepts = async () => {
            const response = await dispatch(getDepts({ "regionId": housingEstateForm.region}));
        }
        loadDepts();
    }, [housingEstateForm.region]);

    useEffect(() => {
        const loadArronds = async () => {
            const response = await dispatch(getArronds({ "deptId": housingEstateForm.department }));
        }
        loadArronds();
    }, [housingEstateForm.department]);

    useEffect(() => {
        const loadTowns = async () => {
            const response = await dispatch(getTowns({ "arrondId": housingEstateForm.arrondissement }));
        }
        loadTowns();
    }, [housingEstateForm.arrondissement]);

    const checkHasMassPlan = async (id : number) => {
        const response = await dispatch(hasMassPlan(id));
        console.log("HAS MAS PLANE RESPONSE", response);
    }

    const checkHasOrthoPhoto = async (id : number) => {
        const response = await dispatch(hasOrthoPhoto(id));
        console.log("HAS ORTHO PHOTO RESPONSE", response);
    }

    const checkHasPlot = async (id : number) => {
        const response = await dispatch(hasPlot(id));
        console.log("HAS PLOT RESPONSE", response);
    }

    // Mettre à jour l'état des plans existants quand la cité sélectionnée change
    useEffect(() => {
        if (selectedHousingEstate && selectedHousingEstate !== "new") {
            const id = parseInt(selectedHousingEstate);

            checkHasMassPlan(id);
            checkHasOrthoPhoto(id);
            checkHasPlot(id);
        } else {
            dispatch(clearCaracteritics());
        }
    }, [selectedHousingEstate]);

    useEffect(() => {
        setHasExistingMassePlan(selectHasMassPlan);
    }, [selectHasMassPlan]);

    useEffect(() => {
        setHasExistingOrthophoto(selectHasOrthoPhoto);
    }, [selectHasOrthoPhoto]);

    useEffect(() => {
        setHasExistingPlot(selectHasPlot);
    }, [selectHasPlot]);

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

    // Fonction pour extraire les polygones des features
    const extractPolygonsFromGeoJSON = (geojson: Record<string, unknown>): any[] => {
        const polygons: any[] = [];
        console.log("EXTRACT", geojson);
        if (geojson?.type === 'FeatureCollection' && Array.isArray(geojson?.features)) {
            geojson?.features.forEach((feature: Record<string, unknown>) => {
                const geometry = feature.geometry as Record<string, unknown>;
                
                if (geometry && (geometry.type === 'Polygon' || geometry.type === 'MultiPolygon')) {
                    polygons.push(geometry);
                }
            });
        } else if (geojson.type === 'Feature') {
            const geometry = geojson.geometry as Record<string, unknown>;
            
            if (geometry && (geometry.type === 'Polygon' || geometry.type === 'MultiPolygon')) {
                polygons.push(geometry);
            }
        }
        
        return polygons;
    };

    // Fonction pour créer un housing estate via l'API
    const createHE = async (formData: HousingEstateFormData): Promise<string | null> => {
        try {
            const datas = {
                ...formData,
                regionId: formData.region,
                departmentId: formData.department,
                arrondissementId: formData.arrondissement,
                townId: formData.town
            }
            console.log("CREATING DATAS", datas);
            const response = await dispatch(createHousingEstate(datas));
            
            console.log("RESPONSE CREATING HE", response);
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

    const createPlotMethod = async (formData: PlotFormData): Promise<string | null> => {
        try {
            const response = await dispatch(createPlot(formData));
            
            if(response.type.includes("rejected"))
            {
                throw new Error('Erreur lors de l\'envoi des données');
            }
        } catch (error) {
            console.error('Erreur:', error);
            toast({
                title: "Erreur",
                description: "Impossible de créer la parcelle",
                variant: "destructive"
            });
        }
    };

    // Fonction pour envoyer le plot à l'API
    const sendPlotToAPI = async (plotData: PlotData) => {
        try {
            const { buildings, geom, ...planData } = plotData;

            console.log("PLAN DATA SENT", planData);
            // Pour les autres types, utiliser createPlan
            const response = await dispatch(createPlan(planData));
            console.log("CREATING PLAN RESPONSE", response);
            
            if(response.type.includes("fulfilled")) {
                //const plotId = response.payload.data.plots[0].id;
                const planId = response.payload.data.plan.id;

                let total = 0;
                for (const building of buildings ?? []) {
                    const buildingData = {
                        //plotId,
                        planId,
                        geom: multiPolygonToPolygon(building),

                    }

                    //console.log("BUILDING DATA   ", buildingData);
                    //const response2 = await dispatch(createBuilding(buildingData));
                    const response2 = await dispatch(createBuilding(buildingData));
                    total++;

                    if(total >= plotData.max) break;
                }
            }

            if(response.type.includes("rejected")) {
                throw new Error('Erreur lors de l\'envoi des données');
            }

            return response.payload;
        } catch (error) {
            console.error('Erreur lors de l\'envoi du plot:', error);
            throw error;
        }
    };

    // Fonction pour sauvegarder les données
    const handleSaveData = async () => {
        if (!geojsonData || !importType) return;

        setIsSubmitting(true);
        try {
            let housingEstateId: string | null = selectedHousingEstate;

            // Si le formulaire housing estate est rempli, on le crée d'abord
            console.log("HE ID", housingEstateId, "     SELECTED HE", selectedHousingEstate);
            console.log("SHOW HE", showHousingEstateForm);
            console.log("IS NUMBER", !Number.isInteger(Number(selectedHousingEstate)));
            
            if (!Number.isInteger(Number(selectedHousingEstate))) {
                
                housingEstateId = await createHE(housingEstateForm);
                if (!housingEstateId) {
                    setIsSubmitting(false);
                    return;
                }
            }

            if (!housingEstateId) {
                toast({
                    title: "Erreur",
                    description: "Aucune cité sélectionnée",
                    variant: "destructive"
                });
                setIsSubmitting(false);
                return;
            }

            // Importation des titres fonctiers (parcelles)
            if(tfData != null) {
                const tempPolygons = extractPolygonsFromGeoJSON(tfData)
                console.log("TEMP POLYGONS FOR TF", tempPolygons, "TF DATA  ", tfData);
                for(let tmpPol of tempPolygons) {
                    const dt = {
                        housingEstateId: parseInt(housingEstateId),
                        geom: multiPolygonToPolygon(tmpPol),
                        TFnumber: tmpPol.properties?.TFnumber ?? undefined,
                        acquiredYear: tmpPol.properties?.acquiredYear ?? undefined,
                        classification: tmpPol.properties?.classification ?? undefined,
                        area: tmpPol.properties?.area ?? undefined,
                        price: tmpPol.properties?.price ?? undefined,
                        marketValue: tmpPol.properties?.marketValue ?? undefined,
                        observations: tmpPol.properties?.observations ?? undefined,
                        status: tmpPol.properties?.status ?? undefined,
                        code: tmpPol.properties?.code ?? generateUniqueCode()
                    }
    
                    await createPlotMethod(dt);
                }
            }

            // Extraire les polygones pour les bâtiments
            const buildings = extractPolygonsFromGeoJSON(geojsonData);

            // Préparer les données du plot selon le format attendu par l'API
            const plotData: PlotData = {
                housingEstateId: parseInt(housingEstateId),
                type: importType,
                geom: geojsonData,
                code: generateUniqueCode(),
                buildings: buildings
            };

            // Envoi du plot à l'API
            await sendPlotToAPI(plotData);
            
            toast({
                title: "Succès",
                description: `${getImportTypeLabel(importType)} a été sauvegardé avec succès`,
                variant: "default"
            });

            // Réinitialiser l'état
            /*setImportedFile(null);
            setTfImported(null);
            setGeojsonData(null);
            setShowHousingEstateForm(false);
            setImportType(null);
            setHousingEstateForm({
                name: '',
                region: '',
                town: '',
                department: '',
                arrondissement: '',
                place: '',
                buildingsType: 'COLLECTIVE'
            });
            setPlotForm({
                housingEstateId: '',
                type: 'PLAN_DE_MASSE',
                area: undefined,
                TFnumber: '',
                acquiredYear: undefined,
                classification: undefined,
                plotArea: undefined,
                price: undefined,
                marketValue: undefined,
                observations: '',
                status: undefined,
                buildings: [],
                max: 200
            });*/

        } catch (error) {
            console.log("ERROR", error);
            toast({
                title: "Erreur",
                description: "Une erreur est survenue lors de la sauvegarde",
                variant: "destructive"
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleImportGeoJson = (type: 'PLAN_DE_MASSE' | 'ORTHO_PHOTO' | 'PERSO' | null = null, isTF : boolean = false) => {
        if(type !== null)
            setImportType(type);
        
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.geojson,application/geo+json,application/json';
        input.onchange = (e: Event) => {
            const target = e.target as HTMLInputElement;
            const file = target.files?.[0];
            if (file) {
                const maxSize = maxMo * 1024 * 1024;
                if (file.size > maxSize) {
                    toast({
                        title: "Fichier trop volumineux",
                        description: `Le fichier fait ${formatFileSize(file.size)}. La taille maximale autorisée est de ${maxMo} MB.`,
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

                        if(!isTF)
                        {
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
                        } else {
                            setTfImported({
                                name: file.name,
                                size: file.size,
                                type: analysis.type,
                                featureCount: analysis.featureCount,
                                geometryTypesText,
                                propertiesText,
                                crs: (geojson.crs as { properties?: { name?: string } })?.properties?.name || "Inconnu"
                            });

                            setTFData(geojson);
                        }

                        //setGeojsonData(geojson);
                        
                        toast({
                            title: "GeoJSON importé avec succès !",
                            description: `Prêt à sauvegarder ${analysis.featureCount} feature(s) comme ${getImportTypeLabel(type || "PLAN_DE_MASSE")}`
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

    const handlePlotFormChange = (field: keyof PlotFormData, value: any) => {
        setPlotForm(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const getImportTypeLabel = (type: 'PLAN_DE_MASSE' | 'ORTHO_PHOTO' | 'PERSO') => {
        switch (type) {
            case 'PLAN_DE_MASSE': return 'Plan de masse';
            case 'ORTHO_PHOTO': return 'Orthophoto';
            case 'PERSO': return 'Couche personnalisée';
            // case 'TITRE_FONCIER': return 'Titre foncier';
            default: return '';
        }
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
                            <div className="w-full overflow-auto">
                                <div className="flex flex-col space-y-4">
                                    <div>
                                        <h2 className="mb-2 font-semibold">Sélection de la cité</h2>
                                        <div className="flex flex-col space-y-2">
                                            <Select
                                                value={selectedHousingEstate}
                                                onValueChange={(value) => {
                                                    setSelectedHousingEstate(value);
                                                    if(value !== "new") setShowHousingEstateForm(false);
                                                }}
                                            >
                                                <SelectTrigger className="w-full">
                                                    <SelectValue placeholder="Sélectionnez une cité" />
                                                </SelectTrigger>
                                                <SelectContent className="z-[1500]">
                                                    <SelectGroup>
                                                        <SelectItem value="new">Créer une nouvelle cité</SelectItem>
                                                    </SelectGroup>
                                                    <SelectSeparator />
                                                    <SelectGroup>
                                                        {housingEstates?.map((estate: any) => (
                                                            <SelectItem key={estate.id} value={estate.id.toString()}>
                                                                {estate.name}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectGroup>
                                                </SelectContent>
                                            </Select>
                                            
                                            <div className="grid grid-cols-1 gap-3 mb-2">
                                                <Button
                                                    variant={hasExistingPlot ? "destructive" : "default"}
                                                    className={ `cursor-pointer  ${(!selectedHousingEstate && !showHousingEstateForm) == true ? `hidden` : `flex flex-row` }`}
                                                    onClick={() => handleImportGeoJson(null, true)}
                                                    disabled={!selectedHousingEstate && !showHousingEstateForm}
                                                >
                                                    <Landmark className="w-4 h-4 mr-2" />
                                                    {hasExistingPlot ? 'Ajouter les titres fonciers' : 'Importer les titres fonciers'}
                                                    {hasExistingPlot && <span className="ml-2">⚠️</span>}
                                                </Button>
                                            </div>
                                            {tfImported && (
                                                <div className="mt-2 mb-4">
                                                    <h2 className="text-md">{tfImported.featureCount} titres fonciers pret a etre importes</h2>
                                                </div>
                                            )}

                                            {selectedHousingEstate === "new" && (
                                                <div className="p-4 mt-2 border rounded-md">
                                                    <h3 className="mb-3 font-semibold">Nouvelle cité</h3>
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
                                                            <Select
                                                                value={housingEstateForm.region}
                                                                onValueChange={(value) => handleHousingEstateFormChange('region', value)}
                                                            >
                                                                <SelectTrigger className="w-full">
                                                                    <SelectValue placeholder="Sélectionnez une région" />
                                                                </SelectTrigger>
                                                                <SelectContent className="z-[1500] w-full">
                                                                    {regionsFromState?.map((region) => (
                                                                        <SelectItem key={region?.id} value={region?.id}>{region?.name}</SelectItem>
                                                                    ))}
                                                                </SelectContent>
                                                            </Select>
                                                        </div>
                                                        <div className="space-y-2">
                                                            <Label>Département</Label>
                                                            <Select
                                                                value={housingEstateForm.department}
                                                                onValueChange={(value) => handleHousingEstateFormChange('department', value)}
                                                            >
                                                                <SelectTrigger className="w-full">
                                                                    <SelectValue placeholder="Sélectionnez un département" />
                                                                </SelectTrigger>
                                                                <SelectContent className="z-[1500] w-full">
                                                                    {deptsFromStates?.map((dept) => (
                                                                        <SelectItem key={dept.id} value={dept?.id}>{dept?.name}</SelectItem>
                                                                    ))}
                                                                </SelectContent>
                                                            </Select>
                                                        </div>
                                                        <div className="space-y-2">
                                                            <Label>District</Label>
                                                            <Select
                                                                value={housingEstateForm.arrondissement}
                                                                onValueChange={(value) => handleHousingEstateFormChange('arrondissement', value)}
                                                            >
                                                                <SelectTrigger className="w-full">
                                                                    <SelectValue placeholder="Sélectionnez un arrondissement" />
                                                                </SelectTrigger>
                                                                <SelectContent className="z-[1500] w-full">
                                                                    {districtsFromStates?.map((arrondissement) => (
                                                                        <SelectItem key={arrondissement.id} value={arrondissement?.id}>{arrondissement?.name}</SelectItem>
                                                                    ))}
                                                                </SelectContent>
                                                            </Select>
                                                        </div>
                                                        <div className="space-y-2">
                                                            <Label>Ville</Label>
                                                            <Select
                                                                value={housingEstateForm.town}
                                                                onValueChange={(value) => handleHousingEstateFormChange('town', value)}
                                                            >
                                                                <SelectTrigger className="w-full">
                                                                    <SelectValue placeholder="Sélectionnez une ville" />
                                                                </SelectTrigger>
                                                                <SelectContent className="z-[1500] w-full">
                                                                    {Array.isArray(townsFromStates) && townsFromStates?.map((town) => (
                                                                        <SelectItem key={town?.id} value={town?.id}>{town?.name}</SelectItem>
                                                                    ))}
                                                                </SelectContent>
                                                            </Select>
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
                                                                onValueChange={(value: 'COLLECTIVE' | 'INDIVIDUAL') => handleHousingEstateFormChange('buildingsType', value)}
                                                            >
                                                                <SelectTrigger className="w-full">
                                                                    <SelectValue />
                                                                </SelectTrigger>
                                                                <SelectContent className="z-[1500] w-full">
                                                                    <SelectItem value="COLLECTIVE">Collectif</SelectItem>
                                                                    <SelectItem value="INDIVIDUAL">Individuel</SelectItem>
                                                                </SelectContent>
                                                            </Select>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {((selectedHousingEstate || showHousingEstateForm) && !importedFile) && (
                                        <div>
                                            <h2 className="mb-2 font-semibold">Importation de données (geojson)</h2>
                                            <div className="grid grid-cols-1 gap-2">
                                                <Button
                                                    variant={hasExistingMassePlan ? "destructive" : "default"}
                                                    className="flex flex-row cursor-pointer"
                                                    onClick={() => handleImportGeoJson('PLAN_DE_MASSE')}
                                                    disabled={!selectedHousingEstate && !showHousingEstateForm}
                                                >
                                                    <Map className="w-4 h-4 mr-2" />
                                                    {hasExistingMassePlan ? 'Remplacer le plan de masse' : 'Importer le plan de masse'}
                                                    {hasExistingMassePlan && <span className="ml-2">⚠️</span>}
                                                </Button>
                                                
                                                <Button
                                                    variant={hasExistingOrthophoto ? "destructive" : "default"}
                                                    className="flex flex-row cursor-pointer"
                                                    onClick={() => handleImportGeoJson('ORTHO_PHOTO')}
                                                    disabled={!selectedHousingEstate && !showHousingEstateForm}
                                                >
                                                    <Satellite className="w-4 h-4 mr-2" />
                                                    {hasExistingOrthophoto ? 'Remplacer l\'orthophoto' : 'Importer les données de l\'orthophoto'}
                                                    {hasExistingOrthophoto && <span className="ml-2">⚠️</span>}
                                                </Button>
                                                
                                                <Button
                                                    variant="outline"
                                                    className="flex flex-row cursor-pointer"
                                                    onClick={() => handleImportGeoJson('PERSO')}
                                                    disabled={!selectedHousingEstate && !showHousingEstateForm}
                                                >
                                                    <Layers className="w-4 h-4 mr-2" />
                                                    Importer une couche personnalisée
                                                </Button>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {importedFile && (
                                    <div className="mt-2 mb-4">
                                        <h2 className="mb-2 font-semibold text-md">Informations du fichier importé</h2>
                                        <ul className="text-sm text-gray-700 dark:text-gray-300">
                                            <li><span className="font-medium">Nom:</span> {importedFile.name}</li>
                                            <li><span className="font-medium">Taille:</span> {formatFileSize(importedFile.size)}</li>
                                            <li><span className="font-medium">Type:</span> {importedFile.type}</li>
                                            <li><span className="font-medium">Features:</span> {importedFile.featureCount}</li>
                                            <li><span className="font-medium">CRS:</span> {importedFile.crs || "Inconnu"}</li>
                                            <li><span className="font-medium">Import comme:</span> {getImportTypeLabel(importType!)}</li>
                                        </ul>

                                        <Button
                                            className="w-full mt-4 cursor-pointer"
                                            onClick={handleSaveData}
                                            disabled={isSubmitting}
                                        >
                                            <Save className="w-4 h-4 mr-2" />
                                            {isSubmitting ? 'Sauvegarde...' : `Sauvegarder ${getImportTypeLabel(importType!)}`}
                                        </Button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </motion.div>
        </AnimatePresence>
    );
};

export default FileMenu;