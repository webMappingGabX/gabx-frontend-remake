import { motion } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { getArronds, getDepts, getRegions, getTowns, selectArrondState, selectDeptState, selectRegionsState, selectTownsState } from "../app/store/slices/authSlice";
import { createHousingEstate, fetchHousingEstates, selectHousingEstates, selectHousingEstatesLoading } from "../app/store/slices/housingEstateSlice";
import { Label } from "../components/ui/label";
import { Input } from "../components/ui/input";
import { Button } from "../components/ui/button";
import { Textarea } from "../components/ui/textarea";
import { useToast } from "../hooks/useToast";
import { createPlot, fetchPlotById, selectCurrentPlot, selectPlotsLoading, setCurrentPlot, updatePlot } from "../app/store/slices/plotSlice";
import { useLocation, useNavigate } from "react-router-dom";
import DrawableLeafletMap from "../components/maps/DrawableLeafletMap";
import { convertToGeometryCollection } from "../utils/tools";
import { PlusCircle } from "lucide-react";
import HousingEstateFormModal from "../components/modals/HousingEstateFormModal";

export interface PlotFormData {
    id?: string;
    code: string;
    geom?: Record<string, unknown>;
    region: string;
    department: string;
    arrondissement: string;
    town: string;
    place: string;
    TFnumber?: string;
    acquiredYear?: string;
    classification?: string;
    area?: string;
    price?: string;
    marketValue?: string;
    observations?: string;
    status?: "BATI" | "NON BATI";
    housingEstate: string | null;
}

interface PlotEditionPageProps {
    plotId?: string | null;
    onCancel?: () => void;
    onSuccess?: () => void;
}

const PlotEditionPage = ({ onCancel, onSuccess }: PlotEditionPageProps) => {
    const [formData, setFormData] = useState<PlotFormData>({
        code: "",
        region: '',
        department: '',
        arrondissement: "",
        town: "",
        place: "",
        TFnumber: "",
        acquiredYear: "",
        classification: "",
        area: "",
        price: "",
        marketValue: "",
        observations: "",
        status: "BATI",
        housingEstate: null
    });

    const dispatch = useDispatch();
    const { toast } = useToast();

    const [currentEditionPoint, setCurrentEditionPoint] = useState(null);
    const [currentEditionFig, setCurrentEditionFig] = useState(null);

    const [isHEModalOpen, setIsHEModalOpen] = useState(false);
  
    const currentPlot = useSelector(selectCurrentPlot);
    const isLoading = useSelector(selectPlotsLoading);

    const regionsFromState = useSelector(selectRegionsState);
    const deptsFromStates = useSelector(selectDeptState);
    const arrondsFromStates = useSelector(selectArrondState);
    const townsFromStates = useSelector(selectTownsState);
    const housingEstatesFromState = useSelector(selectHousingEstates);

    const loadingHEFromState = useSelector(selectHousingEstatesLoading);

    const navigate = useNavigate();

    const location = useLocation();
    const editingMode = location.state?.editingMode;
    // Charger les données de la parcelle si en mode édition
    
    // Mettre à jour le formulaire avec les données de la parcelle
    useEffect(() => {
        if (currentPlot) {
            console.log("CURRENT PLOT", currentPlot);
            
            setFormData({
                code: currentPlot.code || "",
                region: currentPlot.regionId?.toString() || "",
                department: currentPlot.departmentId?.toString() || "",
                arrondissement: currentPlot.arrondissementId?.toString() || "",
                town: currentPlot.townId?.toString() || "",
                place: currentPlot.place || "",
                TFnumber: currentPlot.TFnumber || "",
                acquiredYear: currentPlot.acquiredYear || "",
                classification: currentPlot.classification || "",
                area: currentPlot.area || "",
                price: currentPlot.price || "",
                marketValue: currentPlot.marketValue || "",
                observations: currentPlot.observations || "",
                status: currentPlot.status || "BATI",
                housingEstate: currentPlot.housingEstateId?.toString() || ""
            });
        }
    }, [currentPlot]);

    // Charger les régions
    useEffect(() => {
        const loadRegions = async () => {
            try {
                await dispatch(getRegions() as any);

            } catch (err) {
                console.log("FAILED TO LOAD REGIONS", err);
                toast({
                    title: "Erreur",
                    description: "Impossible de charger les régions",
                    variant: "destructive"
                });
            }
        }

        loadRegions();
    }, [dispatch, toast]);

    // Charger les départements quand la région change
    useEffect(() => {
        const loadDepts = async () => {
            try {
                await dispatch(getDepts({ regionId: formData.region }) as any);
                
            } catch (err) {
                console.log("FAILED TO LOAD DEPARTMENTS", err);
            }
        }

        loadDepts();
    }, [formData.region, dispatch]);
    
    // Charger les arrondissements quand le département change
    useEffect(() => {
        const loadArronds = async () => {
            try {
                await dispatch(getArronds({ deptId: formData.department }) as any);
            } catch (err) {
                console.log("FAILED TO LOAD ARRONDISSEMENTS", err);
            }
        }

        loadArronds();
    }, [formData.department, dispatch]);

    // Charger les communes quand l'arrondissement change
    useEffect(() => {
        const loadTowns = async () => {
            try {
                await dispatch(getTowns({ arrondId: formData.arrondissement }) as any);
            } catch (err) {
                console.log("FAILED TO LOAD TOWNS", err);
            }
        }

        loadTowns();

    }, [formData.arrondissement, dispatch]);

    // Load Housing estates
    const loadHousingEstates = async () => {
        try {
            const params = {
                /*region: formData.region,
                department: formData.department,
                district: formData.arrondissement,
                town: formData.town*/
            }

            await dispatch(fetchHousingEstates(params) as any);
            
        } catch (err) {
            console.log("FAILED TO LOAD HOUSING ESTATES", err);
        }
    }

    // Charger les cités quand la commune change
    useEffect(() => {
        loadHousingEstates();
    }, [dispatch]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        setFormData(prevData => ({
            ...prevData,
            [e.target.name]: e.target.value
        }));
    }

    const handleSelectChange = (field: keyof PlotFormData, value: string) => {
        
        if(value.trim() != "")
        {
            setFormData(prevData => ({
                ...prevData,
                [field]: value
            }));
    
            if (field === 'housingEstate') {
                // Find the selected housing estate from the list
                const selectedHE = housingEstatesFromState?.find(
                    (he: any) => he.id.toString() === value
                );
                if (selectedHE) {
                    setFormData(prevData => ({
                        ...prevData,
                        [field]: value,
                        // Propagate region, department, arrondissement, place if available
                        region: selectedHE.regionId ? selectedHE.regionId.toString() : prevData.region,
                        department: selectedHE.departmentId ? selectedHE.departmentId.toString() : prevData.department,
                        arrondissement: selectedHE.arrondissementId ? selectedHE.arrondissementId.toString() : prevData.arrondissement,
                        town: selectedHE.townId ? selectedHE.townId.toString() : prevData.town,
                        place: selectedHE.place ?? prevData.place
                    }));
                    return;
                }
            }
        }
    }

    const handleSubmitPlot = async (e: React.FormEvent) => {
        e.preventDefault();
        
        try {
            console.log("IN EDITING MODE : ", editingMode);
            if (editingMode) {
                // Mode édition
                // await dispatch(updatePlot({ id: currentPlot.id, plotData: formData }) as any);
                
                const response = await dispatch(updatePlot({ code: currentPlot?.code, updateData: {
                    ...formData,
                    geom: currentEditionFig == null ? null : convertToGeometryCollection(currentEditionFig),
                    regionId: formData.region,
                    departmentId: formData.department,
                    arrondissementId: formData.arrondissement,
                    townId: formData.town,
                    housingEstateId: formData.housingEstate
                } }) as any);
                
                if(response.type.includes("fulfilled"))
                {
                    toast({
                        title: "Succès",
                        description: "Parcelle mise à jour avec succès"
                    });

                    navigate("/map/2D");
                } else {
                    toast({
                        title: "Erreur",
                        description: "Error lors de la mise a jour de la parcelle",
                        variant: "destructive"
                    });
                }
            } else {
                // Mode création
                const response = await dispatch(createPlot({
                    ...formData,
                    geom: currentEditionFig == null ? null : convertToGeometryCollection(currentEditionFig),
                    regionId: formData.region,
                    departmentId: formData.department,
                    arrondissementId: formData.arrondissement,
                    townId: formData.town,
                    housingEstateId: formData.housingEstate
                }) as any);

                // console.log("CREATE PLOT RESPONSE", response);
                if(response.type.includes("fulfilled")) {
                    toast({
                        title: "Succès",
                        description: "Parcelle créée avec succès"
                    });

                    navigate("/map/2D");
                } else {
                    toast({
                        title: "Error",
                        description: "Erreur pendant la creation de la parcelle"
                    });
                }
            }
            
            if (onSuccess) {
                onSuccess();
            }
        } catch (error) {
            toast({
                title: "Erreur",
                description: "Une erreur s'est produite lors de l'enregistrement",
                variant: "destructive"
            });
        }
    }

    const cancelForm = async () => {
        if (onCancel) {
            onCancel();
        }
        await dispatch(setCurrentPlot(null));
        navigate("/map/2D");
    }

    const handleOnCreateHE = async (HEFormData) => {
        try {
            const datas = {
                ...HEFormData,
                regionId: HEFormData.region,
                departmentId: HEFormData.department,
                arrondissementId: HEFormData.arrondissement,
                townId: HEFormData.town
                /*regionId: parseInt(HEFormData.region),
                departmentId: parseInt(HEFormData.department),
                arrondissementId: parseInt(HEFormData.arrondissement),
                townId: parseInt(HEFormData.town)*/
            }
            const response = await dispatch(createHousingEstate(datas));
            
            if(response.type.includes("fulfilled"))
            {
                setIsHEModalOpen(false);
                loadHousingEstates();
                toast({
                    title: "Succès",
                    description: "Cité créée avec succès"
                });
            }
            
            if(response.type.includes("rejected"))
            {
                // console.log("CREATE HE RESPONSE", response);
                toast({
                    title: "Erreur",
                    description: "Impossible de créer la cité",
                    variant: "destructive"
                });
            }

        } catch (error) {
            console.error('Erreur:', error);
            toast({
                title: "Erreur",
                description: "Impossible de créer la cité",
                variant: "destructive"
            });
        }
    }

    useEffect(() => {
        //console.log("FORM DATA CHANGED", formData);
    }, [formData]);
    
    return (
        <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            transition={{ duration: 0.3 }}
        >
            {/* Add Drawable leaflet map */}
            <DrawableLeafletMap 
                currentPlot={currentPlot}
                currentEditionFig={currentEditionFig}
                setCurrentEditionFig={setCurrentEditionFig}
                currentEditionPoint={currentEditionPoint}
                setCurrentEditionPoint={setCurrentEditionPoint}
            />
            
            {/* Modal for Housing Estate */}
            <HousingEstateFormModal 
                isOpen={isHEModalOpen}
                onClose={() => setIsHEModalOpen(false)}
                onCreate={handleOnCreateHE}
                onUpdate={() => {alert("NO UPDATE OPERATION SET")}}
                isLoading={loadingHEFromState}
            />

            {/* Editable Form */}
            <Card className="m-4">
                <CardHeader>
                    <CardTitle>
                        {editingMode ? "Modifier les infos de la parcelle" : "Créer une nouvelle parcelle"}
                    </CardTitle>
                    <CardDescription>
                        Remplissez les détails de votre parcelle
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmitPlot} className="space-y-4">
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                            {/* Code de la parcelle */}
                            <div className="space-y-2">
                                <Label htmlFor="code">Code de la parcelle *</Label>
                                <Input
                                    id="code"
                                    name="code"
                                    value={formData.code}
                                    onChange={handleInputChange}
                                    placeholder="Code de la parcelle"
                                    required
                                />
                            </div>

                            {/* Statut de la parcelle */}
                            <div className="space-y-2">
                                <Label htmlFor="status">Statut *</Label>
                                <Select
                                    value={formData.status}
                                    onValueChange={(value: "BATI" | "NON BATI") => handleSelectChange('status', value)}
                                >
                                    <SelectTrigger className="w-full">
                                        <SelectValue placeholder="Sélectionnez un statut" />
                                    </SelectTrigger>
                                    <SelectContent className="z-[1500]">
                                        <SelectItem key={1} value="BATI" defaultChecked>Bâti</SelectItem>
                                        <SelectItem key={2} value="NON BATI">Non bâti</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        {/* Cité */}
                        <div className="space-y-2">
                            <Label>Cité</Label>
                            <div className="flex items-end gap-2">
                                <div className="flex-1">
                                    <Select
                                        value={formData.housingEstate}
                                        onValueChange={(value) => handleSelectChange('housingEstate', value)}
                                    >
                                        <SelectTrigger className="w-full">
                                            <SelectValue placeholder="Sélectionnez une cité" />
                                        </SelectTrigger>
                                        <SelectContent className="z-[1500]">
                                            {housingEstatesFromState?.map((he, index) => (
                                                <SelectItem key={`he-${he.id}-${index}`} value={he.id?.toString()}>
                                                    {he.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <button
                                    type="button"
                                    className="inline-flex items-center justify-center p-2 text-white transition-colors bg-blue-500 rounded hover:bg-blue-600"
                                    title="Ajouter une nouvelle cité"
                                    onClick={() => setIsHEModalOpen(true)}
                                >
                                    <span className="text-lg font-bold cursor-pointer"><PlusCircle /></span>
                                </button>
                            </div>
                        </div>

                        {/* Hide the following block if a cité (he) is specified */}
                        { !formData.housingEstate && (
                          <>
                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                {/* Région */}
                                <div className="space-y-2">
                                    <Label>Région</Label>
                                    <Select
                                        value={formData.region}
                                        onValueChange={(value) => handleSelectChange('region', value)}
                                    >
                                        <SelectTrigger className="w-full">
                                            <SelectValue placeholder="Sélectionnez une région" />
                                        </SelectTrigger>
                                        <SelectContent className="z-[1500]">
                                            {regionsFromState?.map((region, index) => {
                                                return (
                                                    <SelectItem key={`reg-${region.id}-${index}`} value={region.id.toString()}>
                                                        {region.name}
                                                    </SelectItem>
                                                )
                                            })}
                                        </SelectContent>
                                    </Select>
                                </div>

                                {/* Département */}
                                <div className="space-y-2">
                                    <Label>Département</Label>
                                    <Select
                                        value={formData.department}
                                        onValueChange={(value) => handleSelectChange('department', value)}
                                        disabled={!formData.region}
                                    >
                                        <SelectTrigger className="w-full">
                                            <SelectValue placeholder="Sélectionnez un département" />
                                        </SelectTrigger>
                                        <SelectContent className="z-[1500]">
                                            {deptsFromStates?.map((department, index) => (
                                                <SelectItem key={`dept-${department.id}-${index}`} value={department.id.toString()}>
                                                    {department.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                {/* Arrondissement */}
                                <div className="space-y-2">
                                    <Label>Arrondissement</Label>
                                    <Select
                                        value={formData.arrondissement}
                                        onValueChange={(value) => handleSelectChange('arrondissement', value)}
                                        disabled={!formData.department}
                                    >
                                        <SelectTrigger className="w-full">
                                            <SelectValue placeholder="Sélectionnez un arrondissement" />
                                        </SelectTrigger>
                                        <SelectContent className="z-[1500]">
                                            {arrondsFromStates?.map((arrond, index) => (
                                                <SelectItem key={`arrond-${arrond.id}-${index}`} value={arrond.id.toString()}>
                                                    {arrond.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                {/* Commune */}
                                <div className="space-y-2">
                                    <Label>Ville</Label>
                                    <Select
                                        value={formData.town}
                                        onValueChange={(value) => handleSelectChange('town', value)}
                                        disabled={!formData.arrondissement}
                                    >
                                        <SelectTrigger className="w-full">
                                            <SelectValue placeholder="Sélectionnez une ville" />
                                        </SelectTrigger>
                                        <SelectContent className="z-[1500]">
                                            {townsFromStates?.map((town, index) => (
                                                <SelectItem key={`town-${town.id}-${index}`} value={town.id.toString()}>
                                                    {town.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                          
                            {/* Lieu-dit */}
                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="place">Lieu-dit</Label>
                                    <Input
                                        id="place"
                                        name="place"
                                        value={formData.place}
                                        onChange={handleInputChange}
                                        placeholder="Lieu-dit"
                                    />
                                </div>
                            </div>
                          </>
                        )}


                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                            {/* Numéro TF */}
                            <div className="space-y-2">
                                <Label htmlFor="TFnumber">Numéro TF</Label>
                                <Input
                                    id="TFnumber"
                                    name="TFnumber"
                                    value={formData.TFnumber}
                                    onChange={handleInputChange}
                                    placeholder="Numéro de titre foncier"
                                />
                            </div>

                            {/* Année d'acquisition */}
                            <div className="space-y-2">
                                <Label htmlFor="acquiredYear">Année d'acquisition</Label>
                                <Input
                                    id="acquiredYear"
                                    name="acquiredYear"
                                    type="number"
                                    value={formData.acquiredYear}
                                    onChange={handleInputChange}
                                    placeholder="Année d'acquisition"
                                    min="1900"
                                    max={new Date().getFullYear()}
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                            {/* Classification */}
                            <div className="space-y-2">
                                <Label htmlFor="classification">Classification</Label>
                                <Input
                                    id="classification"
                                    type="number"
                                    name="classification"
                                    value={formData.classification}
                                    onChange={handleInputChange}
                                    placeholder="Classification"
                                />
                            </div>

                            {/* Superficie */}
                            <div className="space-y-2">
                                <Label htmlFor="area">Superficie (m²)</Label>
                                <Input
                                    id="area"
                                    name="area"
                                    type="number"
                                    value={formData.area}
                                    onChange={handleInputChange}
                                    placeholder="Superficie en m²"
                                    min="0"
                                    step="0.01"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                            {/* Prix d'acquisition */}
                            <div className="space-y-2">
                                <Label htmlFor="price">Prix d'acquisition (FCFA)</Label>
                                <Input
                                    id="price"
                                    name="price"
                                    type="number"
                                    value={formData.price}
                                    onChange={handleInputChange}
                                    placeholder="Prix d'acquisition"
                                    min="0"
                                    step="0.01"
                                />
                            </div>

                            {/* Valeur marchande */}
                            <div className="space-y-2">
                                <Label htmlFor="marketValue">Valeur marchande (FCFA)</Label>
                                <Input
                                    id="marketValue"
                                    name="marketValue"
                                    type="number"
                                    value={formData.marketValue}
                                    onChange={handleInputChange}
                                    placeholder="Valeur marchande"
                                    min="0"
                                    step="0.01"
                                />
                            </div>
                        </div>

                        {/* Observations */}
                        <div className="space-y-2">
                            <Label htmlFor="observations">Observations</Label>
                            <Textarea
                                id="observations"
                                name="observations"
                                value={formData.observations}
                                onChange={handleInputChange}
                                placeholder="Observations sur la parcelle"
                                rows={3}
                            />
                        </div>

                        <div className="flex gap-2 pt-4">
                            <Button type="submit" className="cursor-pointer" disabled={isLoading}>
                                {isLoading ? "Enregistrement..." : (editingMode ? "Mettre à jour" : "Créer")}
                            </Button>
                            <Button type="button" variant="outline" onClick={cancelForm} className="cursor-pointer" disabled={isLoading} className="cursor-pointer">
                                Annuler
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </motion.div>
    );
}

export default PlotEditionPage;