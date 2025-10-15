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
  Home,
  Plus,
  Eye,
  EyeOff,
  Users,
  Type
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
import HousingEstateFormModal from "../../components/modals/HousingEstateFormModal";
import ConfirmDialog from "../../components/dialogs/ConfirmDialog";
import { 
  clearCurrentHousingEstate, 
  createHousingEstate, 
  deleteHousingEstate, 
  fetchHousingEstateById, 
  fetchHousingEstates, 
  selectCurrentHousingEstate, 
  selectHousingEstates, 
  selectHousingEstatesError, 
  selectHousingEstatesLoading, 
  updateHousingEstate 
} from "../../app/store/slices/housingEstateSlice";

interface HousingEstate {
  id: string;
  name: string;
  region: string;
  town: string;
  department: string;
  arrondissement: string;
  place: string;
  buildingsType: 'COLLECTIVE' | 'INDIVIDUAL';
  status: 'ACTIVE' | 'INACTIVE';
  createdAt: string;
  updatedAt: string;
  regionName?: string;
  departmentName?: string;
  townName?: string;
}

const AdminHousingEstatesPage = () => {
  const [housingEstates, setHousingEstates] = useState<HousingEstate[]>([]);
  const [filteredHousingEstates, setFilteredHousingEstates] = useState<HousingEstate[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [isLoading, setIsLoading] = useState(true);
  const [isHousingEstateFormOpen, setIsHousingEstateFormOpen] = useState(false);
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);
  const [housingEstateToDelete, setHousingEstateToDelete] = useState<string | null>(null);

  const { toast } = useToast();
  const dispatch = useDispatch();
  const housingEstatesFromState = useSelector(selectHousingEstates);
  const currentHousingEstateFromState = useSelector(selectCurrentHousingEstate);
  const housingEstatesErrorFromState = useSelector(selectHousingEstatesError);
  const housingEstatesLoadingFromState = useSelector(selectHousingEstatesLoading);

  const loadHousingEstatesData = async () => {
    setIsLoading(true);
    try {
      await dispatch(fetchHousingEstates());
    } catch (error) {
      console.error("Failed to load housing estates", error);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadHousingEstatesData();
  }, []);

  useEffect(() => {
    setHousingEstates(housingEstatesFromState || []);
    setFilteredHousingEstates(housingEstatesFromState || []);
  }, [housingEstatesFromState]);

  // Filtrage des cités
  useEffect(() => {
    let result = housingEstates;

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(estate => 
        estate.name.toLowerCase().includes(query) ||
        estate.place.toLowerCase().includes(query) ||
        estate.townName?.toLowerCase().includes(query) ||
        estate.departmentName?.toLowerCase().includes(query) ||
        estate.regionName?.toLowerCase().includes(query)
      );
    }

    if (typeFilter !== "all") {
      result = result.filter(estate => estate.buildingsType === typeFilter);
    }

    if (statusFilter !== "all") {
      result = result.filter(estate => estate.status === statusFilter);
    }

    setFilteredHousingEstates(result);
  }, [searchQuery, typeFilter, statusFilter, housingEstates]);

  const handleStatusChange = async (housingEstateId: string, newStatus: HousingEstate["status"]) => {
    const data = {
      id: housingEstateId,
      housingEstateData: {
        status: newStatus
      }
    }

    await dispatch(updateHousingEstate(data));

    if (!housingEstatesErrorFromState) {
      toast({
        title: "Statut modifié",
        description: `Le statut de la cité a été changé en ${newStatus === 'ACTIVE' ? 'Actif' : 'Inactif'}.`,
      });
      loadHousingEstatesData();
    }
  };

  const handleTypeChange = async (housingEstateId: string, newType: HousingEstate["buildingsType"]) => {
    const data = {
      id: housingEstateId,
      housingEstateData: {
        buildingsType: newType
      }
    }

    await dispatch(updateHousingEstate(data));

    if (!housingEstatesErrorFromState) {
      toast({
        title: "Type modifié",
        description: `Le type de bâtiment a été changé en ${newType === 'COLLECTIVE' ? 'Collectif' : 'Individuel'}.`,
      });
      loadHousingEstatesData();
    }
  };

  const handleOpenDeleteConfirm = (housingEstateId: string) => {
    setHousingEstateToDelete(housingEstateId);
    setIsConfirmDialogOpen(true);
  };
  
  const handleConfirmDelete = async () => {
    if (housingEstateToDelete) {
      await handleDeleteHousingEstate(housingEstateToDelete);
      setIsConfirmDialogOpen(false);
      setHousingEstateToDelete(null);
    }
  };

  const handleStartCreatingHousingEstate = () => {
    dispatch(clearCurrentHousingEstate());
    setIsHousingEstateFormOpen(true);
  };

  const handleCreate = async (formData: any) => {
    await dispatch(createHousingEstate(formData));

    if (!housingEstatesErrorFromState) {
      setIsHousingEstateFormOpen(false);
      toast({
        title: "Cité créée",
        description: "La cité a été créée avec succès.",
      });
      loadHousingEstatesData();
    }
  }

  const handleUpdate = async (formData: any) => {
    const data = {
      id: currentHousingEstateFromState?.id,
      housingEstateData: formData
    }

    await dispatch(updateHousingEstate(data));

    if (!housingEstatesErrorFromState) {
      setIsHousingEstateFormOpen(false);
      toast({
        title: "Cité modifiée",
        description: "La cité a été modifiée avec succès.",
      });
      loadHousingEstatesData();
    }
  }

  const handleStartEditingHousingEstate = async (housingEstateId: string) => {
    await dispatch(fetchHousingEstateById(housingEstateId));
    setIsHousingEstateFormOpen(true);
  };

  const handleDeleteHousingEstate = async (housingEstateId: string) => {
    await dispatch(deleteHousingEstate(housingEstateId));
    
    if (!housingEstatesErrorFromState) {
      toast({
        title: "Cité supprimée",
        description: "La cité a été supprimée avec succès.",
      });
      loadHousingEstatesData();
    }
  };

  const getStatusBadgeVariant = (status: HousingEstate["status"]) => {
    switch (status) {
      case "ACTIVE": return "default";
      case "INACTIVE": return "secondary";
      default: return "outline";
    }
  };

  const getTypeBadgeVariant = (type: HousingEstate["buildingsType"]) => {
    switch (type) {
      case "COLLECTIVE": return "default";
      case "INDIVIDUAL": return "outline";
      default: return "outline";
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Chargement des cités...</div>
      </div>
    );
  }

  return (
    <div className="container p-1 mx-auto space-y-6 md:p-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Gestion des Cités</h1>
          <p className="text-muted-foreground">
            Administrez les cités, leurs types et leurs statuts
          </p>
        </div>
        <Button onClick={handleStartCreatingHousingEstate} className="cursor-pointer">
          <Plus className="w-4 h-4 mr-2" />
          Nouvelle cité
        </Button>
      </div>

      <HousingEstateFormModal
        isOpen={isHousingEstateFormOpen}
        onClose={() => setIsHousingEstateFormOpen(false)}
        onUpdate={(data) => handleUpdate(data)}
        onCreate={(data) => handleCreate(data)}
        housingEstate={currentHousingEstateFromState}
        isLoading={housingEstatesLoadingFromState}
      />

      <ConfirmDialog
        isOpen={isConfirmDialogOpen}
        onClose={() => setIsConfirmDialogOpen(false)}
        onConfirm={handleConfirmDelete}
        title="Supprimer la cité"
        description="Êtes-vous sûr de vouloir supprimer cette cité ? Cette action est irréversible."
        confirmText="Supprimer"
        cancelText="Annuler"
        variant="destructive"
        isLoading={housingEstatesLoadingFromState}
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
                placeholder="Rechercher par nom, lieu, ville, département ou région..."
                className="pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les types</SelectItem>
                  <SelectItem value="COLLECTIVE">Collectif</SelectItem>
                  <SelectItem value="INDIVIDUAL">Individuel</SelectItem>
                </SelectContent>
              </Select>

              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[130px]">
                  <SelectValue placeholder="Statut" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les statuts</SelectItem>
                  <SelectItem value="ACTIVE">Actif</SelectItem>
                  <SelectItem value="INACTIVE">Inactif</SelectItem>
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
                  <th className="p-4 font-medium text-left">Cité</th>
                  <th className="p-4 font-medium text-left">Localisation</th>
                  <th className="p-4 font-medium text-left">Type</th>
                  <th className="p-4 font-medium text-left">Statut</th>
                  <th className="p-4 font-medium text-left">Date de création</th>
                  <th className="p-4 font-medium text-left">Dernière modification</th>
                  <th className="p-4 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredHousingEstates.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-muted-foreground">
                      Aucune cité trouvée
                    </td>
                  </tr>
                ) : (
                  filteredHousingEstates.map((estate) => (
                    <motion.tr 
                      key={estate.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="border-b hover:bg-muted/30"
                    >
                      <td className="p-4">
                        <div>
                          <div className="flex items-center gap-2 font-medium">
                            <Building className="w-4 h-4" />
                            {estate.name}
                          </div>
                          <div className="text-sm text-muted-foreground">{estate.place}</div>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="text-sm">
                          <div className="font-medium">
                            {estate.townName || (typeof estate.town === 'object' ? estate.town?.name : estate.town)}
                          </div>
                          <div className="text-muted-foreground">
                            {estate.departmentName || (typeof estate.department === 'object' ? estate.department?.name : estate.department)} • {estate.regionName || (typeof estate.region === 'object' ? estate.region?.name : estate.region)}
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <Badge variant={getTypeBadgeVariant(estate.buildingsType)}>
                          {estate.buildingsType === "COLLECTIVE" && <Users className="w-3 h-3 mr-1" />}
                          {estate.buildingsType === "INDIVIDUAL" && <Home className="w-3 h-3 mr-1" />}
                          {estate.buildingsType === "COLLECTIVE" ? "Collectif" : "Individuel"}
                        </Badge>
                      </td>
                      <td className="p-4">
                        <Badge variant={getStatusBadgeVariant(estate.status)}>
                          {estate.status === "ACTIVE" && <Eye className="w-3 h-3 mr-1" />}
                          {estate.status === "INACTIVE" && <EyeOff className="w-3 h-3 mr-1" />}
                          {estate.status === "ACTIVE" ? "Actif" : "Inactif"}
                        </Badge>
                      </td>
                      <td className="p-4 text-sm">{formatDate(estate.createdAt)}</td>
                      <td className="p-4 text-sm">{formatDate(estate.updatedAt)}</td>
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
                              Changer le type
                            </DropdownMenuLabel>
                            <DropdownMenuItem onClick={() => handleTypeChange(estate.id, "COLLECTIVE")}>
                              <Users className="w-4 h-4 mr-2" />
                              Collectif
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleTypeChange(estate.id, "INDIVIDUAL")}>
                              <Home className="w-4 h-4 mr-2" />
                              Individuel
                            </DropdownMenuItem>
                            
                            <DropdownMenuSeparator />
                            
                            <DropdownMenuLabel className="text-xs text-muted-foreground">
                              Changer le statut
                            </DropdownMenuLabel>
                            <DropdownMenuItem onClick={() => handleStatusChange(estate.id, "ACTIVE")}>
                              <Eye className="w-4 h-4 mr-2" />
                              Activer
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleStatusChange(estate.id, "INACTIVE")}>
                              <EyeOff className="w-4 h-4 mr-2" />
                              Désactiver
                            </DropdownMenuItem>
                            
                            <DropdownMenuSeparator />
                            
                            <DropdownMenuItem onClick={async () => { await handleStartEditingHousingEstate(estate.id) }}>
                              <Edit className="w-4 h-4 mr-2" />
                              Modifier
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              className="text-destructive"
                              onClick={() => handleOpenDeleteConfirm(estate.id)}
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

export default AdminHousingEstatesPage;