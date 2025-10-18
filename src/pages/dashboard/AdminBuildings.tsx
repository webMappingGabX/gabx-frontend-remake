import { useState, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { 
  Search, 
  Filter, 
  MoreVertical, 
  Edit, 
  Trash2, 
  Building,
  MapPin,
  Layers,
  Hash,
  Eye,
  EyeOff,
  AlertTriangle,
  Plus,
  CheckCircle,
  XCircle
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../../components/ui/dialog";
import { Label } from "../../components/ui/label";
import ConfirmDialog from "../../components/dialogs/ConfirmDialog";
import { 
  clearCurrentBuilding, 
  createBuilding, 
  deleteBuilding, 
  fetchBuildingById, 
  fetchBuildings, 
  selectCurrentBuilding, 
  selectBuildings, 
  selectBuildingsError, 
  selectBuildingsLoading, 
  updateBuilding 
} from "../../app/store/slices/buildingSlice";
import BuildingFormModal from "../../components/modals/BuildingFormModal";

interface Building {
  id: string;
  geom: any; // Géométrie du bâtiment (GeoJSON ou autre format)
  code: string;
  state: 'CONSTRUCTED' | 'UNDER_CONSTRUCTION' | 'PLANNED' | 'DEMOLISHED';
  nbLevels: number;
  fraud: boolean;
  plotId: string;
  planId: string;
  createdAt: string;
  updatedAt: string;
  plot?: {
    id: string;
    code: string;
    name: string;
  };
  plan?: {
    id: string;
    name: string;
    description?: string;
  };
}

const AdminBuildingsPage = () => {
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [filteredBuildings, setFilteredBuildings] = useState<Building[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [stateFilter, setStateFilter] = useState<string>("all");
  const [fraudFilter, setFraudFilter] = useState<string>("all");
  const [isLoading, setIsLoading] = useState(true);
  const [isBuildingFormOpen, setIsBuildingFormOpen] = useState(false);
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);
  const [buildingToDelete, setBuildingToDelete] = useState<string | null>(null);

  const { toast } = useToast();
  const dispatch = useDispatch();
  const buildingsFromState = useSelector(selectBuildings);
  const currentBuildingFromState = useSelector(selectCurrentBuilding);
  const buildingsErrorFromState = useSelector(selectBuildingsError);
  const buildingsLoadingFromState = useSelector(selectBuildingsLoading);

  const loadBuildingsData = async () => {
    setIsLoading(true);
    try {
      await dispatch(fetchBuildings());
    } catch (error) {
      console.error("Failed to load buildings", error);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadBuildingsData();
  }, []);

  useEffect(() => {
    setBuildings(buildingsFromState || []);
    setFilteredBuildings(buildingsFromState || []);
  }, [buildingsFromState]);

  // Filtrage des bâtiments
  useEffect(() => {
    let result = buildings;

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(building => 
        building.code.toLowerCase().includes(query) ||
        building.plot?.name?.toLowerCase().includes(query) ||
        building.plot?.code?.toLowerCase().includes(query) ||
        building.plan?.name?.toLowerCase().includes(query)
      );
    }

    if (stateFilter !== "all") {
      result = result.filter(building => building.state === stateFilter);
    }

    if (fraudFilter !== "all") {
      const fraudBoolean = fraudFilter === "true";
      result = result.filter(building => building.fraud === fraudBoolean);
    }

    setFilteredBuildings(result);
  }, [searchQuery, stateFilter, fraudFilter, buildings]);

  const handleStateChange = async (buildingId: string, newState: Building["state"]) => {
    const data = {
      id: buildingId,
      buildingData: {
        state: newState
      }
    }

    await dispatch(updateBuilding(data));

    if (!buildingsErrorFromState) {
      toast({
        title: "État modifié",
        description: `L'état du bâtiment a été changé en ${getStateLabel(newState)}.`,
      });
      loadBuildingsData();
    }
  };

  const handleFraudChange = async (buildingId: string, newFraudStatus: boolean) => {
    const data = {
      id: buildingId,
      buildingData: {
        fraud: newFraudStatus
      }
    }

    await dispatch(updateBuilding(data));

    if (!buildingsErrorFromState) {
      toast({
        title: "Statut fraude modifié",
        description: `Le statut fraude a été changé en ${newFraudStatus ? 'Frauduleux' : 'Conforme'}.`,
      });
      loadBuildingsData();
    }
  };

  const handleOpenDeleteConfirm = (buildingId: string) => {
    setBuildingToDelete(buildingId);
    setIsConfirmDialogOpen(true);
  };
  
  const handleConfirmDelete = async () => {
    if (buildingToDelete) {
      await handleDeleteBuilding(buildingToDelete);
      setIsConfirmDialogOpen(false);
      setBuildingToDelete(null);
    }
  };

  const handleStartCreatingBuilding = () => {
    dispatch(clearCurrentBuilding());
    setIsBuildingFormOpen(true);
  };

  const handleCreate = async (formData: any) => {
    await dispatch(createBuilding(formData));

    if (!buildingsErrorFromState) {
      setIsBuildingFormOpen(false);
      toast({
        title: "Bâtiment créé",
        description: "Le bâtiment a été créé avec succès.",
      });
      loadBuildingsData();
    }
  }

  const handleUpdate = async (formData: any) => {
    const data = {
      id: currentBuildingFromState?.id,
      buildingData: formData
    }

    await dispatch(updateBuilding(data));

    if (!buildingsErrorFromState) {
      setIsBuildingFormOpen(false);
      toast({
        title: "Bâtiment modifié",
        description: "Le bâtiment a été modifié avec succès.",
      });
      loadBuildingsData();
    }
  }

  const handleStartEditingBuilding = async (buildingId: string) => {
    await dispatch(fetchBuildingById(buildingId));
    setIsBuildingFormOpen(true);
  };

  const handleDeleteBuilding = async (buildingId: string) => {
    await dispatch(deleteBuilding(buildingId));
    
    if (!buildingsErrorFromState) {
      toast({
        title: "Bâtiment supprimé",
        description: "Le bâtiment a été supprimé avec succès.",
      });
      loadBuildingsData();
    }
  };

  const getStateBadgeVariant = (state: Building["state"]) => {
    switch (state) {
      case "CONSTRUCTED": return "default";
      case "UNDER_CONSTRUCTION": return "secondary";
      case "PLANNED": return "outline";
      case "DEMOLISHED": return "destructive";
      default: return "outline";
    }
  };

  const getStateLabel = (state: Building["state"]) => {
    switch (state) {
      case "CONSTRUCTED": return "Construit";
      case "UNDER_CONSTRUCTION": return "En construction";
      case "PLANNED": return "Planifié";
      case "DEMOLISHED": return "Démoli";
      default: return state;
    }
  };

  const getFraudBadgeVariant = (fraud: boolean) => {
    return fraud ? "destructive" : "default";
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (buildingsLoadingFromState) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Chargement des bâtiments...</div>
      </div>
    );
  }

  return (
    <div className="container p-1 mx-auto space-y-6 md:p-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Gestion des Bâtiments</h1>
          <p className="text-muted-foreground">
            Administrez les bâtiments, leurs états et statuts fraude
          </p>
        </div>
        <Button onClick={handleStartCreatingBuilding} className="cursor-pointer">
          <Plus className="w-4 h-4 mr-2" />
          Nouveau bâtiment
        </Button>
      </div>

      <BuildingFormModal
        isOpen={isBuildingFormOpen}
        onClose={() => setIsBuildingFormOpen(false)}
        onUpdate={(data) => handleUpdate(data)}
        onCreate={(data) => handleCreate(data)}
        building={currentBuildingFromState}
        isLoading={buildingsLoadingFromState}
      />

      <ConfirmDialog
        isOpen={isConfirmDialogOpen}
        onClose={() => setIsConfirmDialogOpen(false)}
        onConfirm={handleConfirmDelete}
        title="Supprimer le bâtiment"
        description="Êtes-vous sûr de vouloir supprimer ce bâtiment ? Cette action est irréversible."
        confirmText="Supprimer"
        cancelText="Annuler"
        variant="destructive"
        isLoading={buildingsLoadingFromState}
      />
      
      <Card>
        <CardHeader>
          <CardTitle>Filtres et recherche</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4 md:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher par code, parcelle ou plan..."
                className="pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <Select value={stateFilter} onValueChange={setStateFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="État" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les états</SelectItem>
                  <SelectItem value="CONSTRUCTED">Construit</SelectItem>
                  <SelectItem value="UNDER_CONSTRUCTION">En construction</SelectItem>
                  <SelectItem value="PLANNED">Planifié</SelectItem>
                  <SelectItem value="DEMOLISHED">Démoli</SelectItem>
                </SelectContent>
              </Select>

              <Select value={fraudFilter} onValueChange={setFraudFilter}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Fraude" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous</SelectItem>
                  <SelectItem value="true">Frauduleux</SelectItem>
                  <SelectItem value="false">Conforme</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="p-4 font-medium text-left">Code</th>
                  <th className="p-4 font-medium text-left">État</th>
                  <th className="p-4 font-medium text-left">Niveaux</th>
                  <th className="p-4 font-medium text-left">Fraude</th>
                  <th className="p-4 font-medium text-left">Parcelle</th>
                  <th className="p-4 font-medium text-left">Plan</th>
                  <th className="p-4 font-medium text-left">Date de création</th>
                  <th className="p-4 font-medium text-left">Dernière modification</th>
                  <th className="p-4 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredBuildings.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="p-8 text-center text-muted-foreground">
                      Aucun bâtiment trouvé
                    </td>
                  </tr>
                ) : (
                  filteredBuildings.map((building) => (
                    <motion.tr 
                      key={building.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="border-b hover:bg-muted/30"
                    >
                      <td className="p-4">
                        <div className="flex items-center gap-2 font-medium">
                          <Hash className="w-4 h-4" />
                          {building.code}
                        </div>
                      </td>
                      <td className="p-4">
                        <Badge variant={getStateBadgeVariant(building.state)}>
                          {building.state === "CONSTRUCTED" && <Building className="w-3 h-3 mr-1" />}
                          {building.state === "UNDER_CONSTRUCTION" && <Layers className="w-3 h-3 mr-1" />}
                          {building.state === "PLANNED" && <Eye className="w-3 h-3 mr-1" />}
                          {building.state === "DEMOLISHED" && <XCircle className="w-3 h-3 mr-1" />}
                          {getStateLabel(building.state)}
                        </Badge>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-1">
                          <Layers className="w-4 h-4 text-muted-foreground" />
                          <span>{building.nbLevels}</span>
                        </div>
                      </td>
                      <td className="p-4">
                        <Badge variant={getFraudBadgeVariant(building.fraud)}>
                          {building.fraud ? (
                            <>
                              <AlertTriangle className="w-3 h-3 mr-1" />
                              Frauduleux
                            </>
                          ) : (
                            <>
                              <CheckCircle className="w-3 h-3 mr-1" />
                              Conforme
                            </>
                          )}
                        </Badge>
                      </td>
                      <td className="p-4">
                        <div className="text-sm">
                          <div className="font-medium">
                            {building.plot?.code || building.plotId}
                          </div>
                          {building.plot?.name && (
                            <div className="text-muted-foreground">{building.plot.name}</div>
                          )}
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="text-sm">
                          {building.plan?.name || building.planId}
                        </div>
                      </td>
                      <td className="p-4 text-sm">{formatDate(building.createdAt)}</td>
                      <td className="p-4 text-sm">{formatDate(building.updatedAt)}</td>
                      <td className="p-4 text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            
                            <DropdownMenuLabel className="text-xs text-muted-foreground">
                              Changer l'état
                            </DropdownMenuLabel>
                            <DropdownMenuItem onClick={() => handleStateChange(building.id, "CONSTRUCTED")}>
                              <Building className="w-4 h-4 mr-2" />
                              Construit
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleStateChange(building.id, "UNDER_CONSTRUCTION")}>
                              <Layers className="w-4 h-4 mr-2" />
                              En construction
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleStateChange(building.id, "PLANNED")}>
                              <Eye className="w-4 h-4 mr-2" />
                              Planifié
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleStateChange(building.id, "DEMOLISHED")}>
                              <XCircle className="w-4 h-4 mr-2" />
                              Démoli
                            </DropdownMenuItem>
                            
                            <DropdownMenuSeparator />
                            
                            <DropdownMenuLabel className="text-xs text-muted-foreground">
                              Statut fraude
                            </DropdownMenuLabel>
                            <DropdownMenuItem onClick={() => handleFraudChange(building.id, true)}>
                              <AlertTriangle className="w-4 h-4 mr-2" />
                              Marquer comme frauduleux
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleFraudChange(building.id, false)}>
                              <CheckCircle className="w-4 h-4 mr-2" />
                              Marquer comme conforme
                            </DropdownMenuItem>
                            
                            <DropdownMenuSeparator />
                            
                            <DropdownMenuItem onClick={async () => { await handleStartEditingBuilding(building.id) }}>
                              <Edit className="w-4 h-4 mr-2" />
                              Modifier
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              className="text-destructive"
                              onClick={() => handleOpenDeleteConfirm(building.id)}
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Supprimer
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </motion.tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminBuildingsPage;