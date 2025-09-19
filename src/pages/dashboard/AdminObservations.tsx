import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  Search, 
  Filter, 
  MoreVertical, 
  Edit, 
  Trash2, 
  Eye,
  User,
  Plus,
  Palette,
  Gauge,
  FileText,
  Calendar
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
import { createObs, deleteObs, fetchObservations, selectObservations, selectObservationsError, selectObservationsLoading, updateObs } from "../../app/store/slices/observationsSlice";
import { useDispatch, useSelector } from "react-redux";
import ObservationFormModal from "../../components/modals/ObservationFormModal";
import { fetchUsers, selectUsers } from "../../app/store/slices/usersSlice";
import ConfirmDialog from "../../components/dialogs/ConfirmDialog";
import ObservationDetailsModal from "../../components/modals/ModalDetailsObservation";

// Types basés sur votre modèle Observation
interface User {
  id: string;
  username: string;
  email: string;
}

interface Observation {
  id: string;
  category: "PAINT";
  scale: number;
  content: string;
  userId: string;
  User?: User;
  createdAt: string;
  updatedAt: string;
}

type ObservationFormData = {
  category: "PAINT";
  scale: number;
  content: string;
  userId: string;
};


const AdminObservations = () => {
  const [observations, setObservations] = useState<Observation[]>([]);
  const [filteredObservations, setFilteredObservations] = useState<Observation[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [scaleFilter, setScaleFilter] = useState<string>("all");
  const [isLoading, setIsLoading] = useState(true);
  const [isObservationFormOpen, setIsObservationFormOpen] = useState(false);
  const [isObservationDetailFormOpen, setIsObservationDetailFormOpen] = useState(false);
    const [selectedObservation, setSelectedObservation] = useState<Observation | null>(null);
    const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);
    const [observationToDelete, setObservationToDelete] = useState<string | null>(null);
  const { toast } = useToast();

  const dispatch = useDispatch();
  const observationsFromState = useSelector(selectObservations);
  const usersFromState = useSelector(selectUsers);
  const obsErrorFromState = useSelector(selectObservationsError);
  const obsLoadingFromState = useSelector(selectObservationsLoading);


    const loadObservations = async () => {
        const response = await dispatch(fetchObservations());
        await dispatch(fetchUsers());
        
        console.log("RESPONSE", response);
    }

    useEffect(() => {
        loadObservations();
    }, []);
    
    // Données simulées - à remplacer par un appel API réel
    useEffect(() => {
    console.log("OBSERVATIONS FROM STATE", observationsFromState);
    setObservations(observationsFromState);
    setFilteredObservations(observationsFromState);
    setIsLoading(false);
    }, [observationsFromState]);


  // Filtrage des observations
  useEffect(() => {
    let result = observations;

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(observation => 
        observation.content.toLowerCase().includes(query) ||
        observation.User?.username.toLowerCase().includes(query) ||
        observation.User?.email.toLowerCase().includes(query)
      );
    }

    if (categoryFilter !== "all") {
      result = result.filter(observation => observation.category === categoryFilter);
    }

    if (scaleFilter !== "all") {
      const scaleValue = parseInt(scaleFilter);
      if (scaleValue === 0) {
        result = result.filter(observation => observation.scale < 5);
      } else if (scaleValue === 1) {
        result = result.filter(observation => observation.scale >= 5 && observation.scale < 7);
      } else if (scaleValue === 2) {
        result = result.filter(observation => observation.scale >= 7);
      }
    }

    setFilteredObservations(result);
  }, [searchQuery, categoryFilter, scaleFilter, observations]);

  const handleOpenDeleteConfirm = (observationId: string) => {
    setObservationToDelete(observationId);
    setIsConfirmDialogOpen(true);
  };
  
  const handleStartCreatingObservation = () => {
    setSelectedObservation(null);
    setIsObservationFormOpen(true);
  };
  
  const handleStartEditingObservation = (observation: Observation) => {
    setSelectedObservation(observation);
    setIsObservationFormOpen(true);
  };

  const handleShowObservationDetails = (observation: Observation) => {
    setSelectedObservation(observation);
    setIsObservationDetailFormOpen(true);
  };

  const handleCreateObservation = async (formData: ObservationFormData) => {
    await dispatch(createObs(formData));

    if(!obsErrorFromState) {
        setIsObservationFormOpen(false);
        await loadObservations();
    }
  };
  
  const handleUpdateObservation = async (formData: ObservationFormData) => {
    await dispatch(updateObs({ "id": selectedObservation.id, "obsData": formData}));

    if(!obsErrorFromState) {
        setIsObservationFormOpen(false);
        await loadObservations();
    }
  };

  const handleDeleteObservation = async (observationId: string) => {
    //setObservations(prev => prev.filter(obs => obs.id !== observationId));
    
    await dispatch(deleteObs(observationId));

    if(!obsErrorFromState) {
        toast({
          title: "Observation supprimée",
          description: "L'observation a été supprimée avec succès.",
        });
        await loadObservations();
    }
  };

  const handleConfirmDelete = async () => {
    if (observationToDelete) {
      // Implémentez la logique de suppression ici
      await handleDeleteObservation(observationToDelete);
      setIsConfirmDialogOpen(false);
      setObservationToDelete(null);
    }
  };
  
  const getScaleBadgeVariant = (scale: number) => {
    if (scale < 5) return "destructive";
    if (scale < 7) return "secondary";
    return "default";
  };

  const getScaleLabel = (scale: number) => {
    if (scale < 5) return "Critique";
    if (scale < 7) return "Moyen";
    return "Bon";
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Chargement des observations...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* En-tête de page */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Gestion des Observations</h1>
          <p className="text-muted-foreground">
            Gérez et consultez toutes les observations enregistrées dans le système
          </p>
        </div>
        <Button onClick={handleStartCreatingObservation}>
          <Plus className="w-4 h-4 mr-2" />
          Nouvelle observation
        </Button>
      </div>

        <ConfirmDialog
            isOpen={isConfirmDialogOpen}
            onClose={() => setIsConfirmDialogOpen(false)}
            onConfirm={handleConfirmDelete}
            title="Supprimer l'observation"
            description="Êtes-vous sûr de vouloir supprimer cette observation ? Cette action est irréversible."
            confirmText="Supprimer"
            cancelText="Annuler"
            variant="destructive"
            isLoading={obsLoadingFromState} // À adapter selon votre état de chargement
        />

        <ObservationFormModal 
            isOpen={isObservationFormOpen}
            onClose={() => setIsObservationFormOpen(false)}
            onUpdate={handleUpdateObservation}
            onCreate={handleCreateObservation}
            observation={selectedObservation}
            isLoading={obsLoadingFromState} // À adapter selon votre état de chargement
            users={usersFromState} // Passez la liste des utilisateurs disponibles
        />

        <ObservationDetailsModal 
            isOpen={isObservationDetailFormOpen}
            observation={selectedObservation}
            onClose={() => setIsObservationDetailFormOpen(false)}
        />
      {/* Filtres et recherche */}
      <Card>
        <CardHeader>
          <CardTitle>Filtres et recherche</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4 md:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher par contenu, utilisateur..."
                className="pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-[130px]">
                  <SelectValue placeholder="Catégorie" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes catégories</SelectItem>
                  <SelectItem value="PAINT">Peinture</SelectItem>
                </SelectContent>
              </Select>

              <Select value={scaleFilter} onValueChange={setScaleFilter}>
                <SelectTrigger className="w-[130px]">
                  <SelectValue placeholder="État" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous états</SelectItem>
                  <SelectItem value="0">Critique (&lt; 5)</SelectItem>
                  <SelectItem value="1">Moyen (5-7)</SelectItem>
                  <SelectItem value="2">Bon (&gt;= 7)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Statistiques */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total observations</p>
                <p className="text-2xl font-bold">{observations.length}</p>
              </div>
              <div className="p-3 text-blue-600 bg-blue-100 rounded-full">
                <FileText className="w-6 h-6" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Moyenne d'état</p>
                <p className="text-2xl font-bold">
                  {observations.length > 0 
                    ? (observations.reduce((sum, obs) => sum + obs.scale, 0) / observations.length).toFixed(1)
                    : "0.0"
                  }
                </p>
              </div>
              <div className="p-3 text-green-600 bg-green-100 rounded-full">
                <Gauge className="w-6 h-6" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Observations aujourd'hui</p>
                <p className="text-2xl font-bold">
                  {
                    observations.filter(obs => {
                      const obsDate = new Date(obs.createdAt);
                      const today = new Date();
                      return (
                        obsDate.getFullYear() === today.getFullYear() &&
                        obsDate.getMonth() === today.getMonth() &&
                        obsDate.getDate() === today.getDate()
                      );
                    }).length
                  }
                </p>
              </div>
              <div className="p-3 text-orange-600 bg-orange-100 rounded-full">
                <Calendar className="w-6 h-6" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Liste des observations */}
      <Card>
        <CardHeader>
          <CardTitle>Liste des observations</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredObservations.length === 0 ? (
            <div className="py-12 text-center">
              <Palette className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <h3 className="text-lg font-medium text-gray-900">Aucune observation trouvée</h3>
              <p className="mt-2 text-gray-500">
                Aucune observation ne correspond à vos critères de recherche.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredObservations.map((observation) => (
                <motion.div 
                  key={observation.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex flex-col p-4 border rounded-lg hover:bg-gray-50 md:flex-row md:items-center"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <Badge variant="outline" className="flex items-center gap-1">
                        <Palette className="w-3 h-3" />
                        {observation.category}
                      </Badge>
                      <Badge variant={getScaleBadgeVariant(observation.scale)} className="flex items-center gap-1">
                        <Gauge className="w-3 h-3" />
                        {observation.scale} - {getScaleLabel(observation.scale)}
                      </Badge>
                    </div>
                    
                    <p className="mb-2 font-medium">{observation.content}</p>
                    
                    <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                      <div className="flex items-center gap-1">
                        <User className="w-4 h-4" />
                        <span>{observation.User?.username}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        <span>{formatDate(observation.createdAt)}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-4 md:mt-0 md:ml-4">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => handleShowObservationDetails(observation)}>
                          <Eye className="w-4 h-4 mr-2" />
                          Voir les détails
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleStartEditingObservation(observation)}>
                          <Edit className="w-4 h-4 mr-2" />
                          Modifier
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem 
                          className="text-destructive"
                          onClick={() => handleOpenDeleteConfirm(observation.id)}
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Supprimer
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminObservations;