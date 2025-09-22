import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  Plus, 
  Trash2, 
  Eye, 
  Edit, 
  Send,
  Palette,
  Gauge,
  FileText,
  Calendar,
  User,
  Search,
  Filter
} from "lucide-react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Textarea } from "../components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { useToast } from "../hooks/useToast";
import { useDispatch, useSelector } from "react-redux";
import { selectAuthUser, selectUser } from "../app/store/slices/authSlice";
import { createObs, deleteObs, fetchObservations, selectObservations, selectObservationsError, selectObservationsLoading, updateObs } from "../app/store/slices/observationsSlice";
import ConfirmDialog from "../components/dialogs/ConfirmDialog";

// Types basés sur votre modèle Observation
interface Observation {
  id: string;
  category: "PAINT";
  scale: number;
  content: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

const UserObservationsPage = () => {
  const [observations, setObservations] = useState<Observation[]>([]);
  const [filteredObservations, setFilteredObservations] = useState<Observation[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [scaleFilter, setScaleFilter] = useState<string>("all");
  const [isLoading, setIsLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingObservation, setEditingObservation] = useState<Observation | null>(null);

  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);
  const [observationToDelete, setObservationToDelete] = useState<string | null>(null);

  const { toast } = useToast();
  const user = useSelector(selectUser);
  const dispatch = useDispatch();
  
  const observationsFromState = useSelector(selectObservations);
  const observationsLoadingFromState = useSelector(selectObservationsLoading);
  const observationsErrorFromState = useSelector(selectObservationsError);

  // État du formulaire
  const [formData, setFormData] = useState({
    category: "PAINT" as "PAINT",
    scale: 5,
    content: ""
  });

  const loadObservations = async () => {
    await dispatch(fetchObservations({ userId: user?.id }));
  }

  // Données simulées - à remplacer par un appel API réel
  useEffect(() => {
    const mockObservations: Observation[] = [
      {
        id: "1",
        category: "PAINT",
        scale: 8.5,
        content: "Peinture écaillée sur la façade nord du bâtiment principal",
        userId: user?.id || "1",
        createdAt: "2024-01-15T10:30:00Z",
        updatedAt: "2024-01-15T10:30:00Z"
      },
      {
        id: "2",
        category: "PAINT",
        scale: 6.2,
        content: "Décoloration de la peinture due à l'exposition au soleil",
        userId: user?.id || "1",
        createdAt: "2024-01-14T14:22:00Z",
        updatedAt: "2024-01-14T14:22:00Z"
      },
      {
        id: "3",
        category: "PAINT",
        scale: 3.8,
        content: "Tâches d'humidité affectant la couche de peinture",
        userId: user?.id || "1",
        createdAt: "2024-01-13T16:45:00Z",
        updatedAt: "2024-01-13T16:45:00Z"
      }
    ];

    loadObservations();
    setObservations(mockObservations);
    setFilteredObservations(mockObservations);
    setIsLoading(false);
  }, [user]);

  useEffect(() => {
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
        observation.content.toLowerCase().includes(query)
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
  
  const handleConfirmDelete = async () => {
    if (observationToDelete) {
      await handleDeleteObservation(observationToDelete);
      setIsConfirmDialogOpen(false);
      setObservationToDelete(null);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleScaleChange = (value: string) => {
    setFormData(prev => ({
      ...prev,
      scale: parseFloat(value)
    }));
  };

  const handleSubmitObservation = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (editingObservation) {
      // Mise à jour d'une observation existante
      console.log("EDITING OBSERVATION", editingObservation);
      console.log("FORM DATA", formData);
      await dispatch(updateObs({ id: editingObservation.id, obsData: formData }));
      
      if(!observationsErrorFromState) {
        await loadObservations();
        toast({
          title: "Observation modifiée",
          description: "Votre observation a été mise à jour avec succès.",
        });
      }
    } else {
      // Création d'une nouvelle observation
      console.log("CREATING OBSERVATION", editingObservation);
      console.log("FORM DATA", formData);
      const data = {
        ...formData,
        userId: user?.id
      };

      await dispatch(createObs(data));
      
      if(!observationsErrorFromState) {
        await loadObservations();
        toast({
          title: "Observation envoyée",
          description: "Votre observation a été enregistrée avec succès.",
        });
      }
    }
    
    // Réinitialiser le formulaire
    setFormData({
      category: "PAINT",
      scale: 5,
      content: ""
    });
    setEditingObservation(null);
    setIsFormOpen(false);
  };

  const handleEditObservation = (observation: Observation) => {
    setFormData({
      category: observation.category,
      scale: observation.scale,
      content: observation.content
    });
    setEditingObservation(observation);
    setIsFormOpen(true);
  };

  const handleDeleteObservation = async (observationId: string) => {
    await dispatch(deleteObs(observationId));
    
    if(!observationsErrorFromState) {
      await loadObservations();
      toast({
        title: "Observation supprimée",
        description: "Votre observation a été supprimée avec succès.",
      });
    }
  };

  const cancelForm = () => {
    setFormData({
      category: "PAINT",
      scale: 5,
      content: ""
    });
    setEditingObservation(null);
    setIsFormOpen(false);
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
      day: 'numeric'
    });
  };

  if (isLoading) {
    return (
      <div className="container max-w-4xl px-4 py-8 mx-auto">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Chargement de vos observations...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="container max-w-4xl px-4 py-8 mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="space-y-8"
      >
        {/* En-tête */}
        <div className="text-center">
          <h1 className="text-3xl font-bold tracking-tight">Mes Observations</h1>
          <p className="mt-2 text-muted-foreground">
            Gérez et consultez toutes vos observations enregistrées
          </p>
        </div>

        {/* Bouton pour ajouter une observation */}
        {!isFormOpen && (
          <div className="text-center">
            <Button 
              onClick={() => setIsFormOpen(true)}
              size="lg"
              className="flex items-center gap-2 mx-auto"
            >
              <Plus className="w-5 h-5" />
              Nouvelle observation
            </Button>
          </div>
        )}

        <ConfirmDialog
          isOpen={isConfirmDialogOpen}
          onClose={() => setIsConfirmDialogOpen(false)}
          onConfirm={handleConfirmDelete}
          title="Supprimer l'observation"
          description="Êtes-vous sûr de vouloir supprimer cette observation ? Cette action est irréversible."
          confirmText="Supprimer"
          cancelText="Annuler"
          variant="destructive"
          isLoading={observationsLoadingFromState}
        />

        {/* Formulaire d'observation */}
        {isFormOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            transition={{ duration: 0.3 }}
          >
            <Card>
              <CardHeader>
                <CardTitle>
                  {editingObservation ? "Modifier l'observation" : "Nouvelle observation"}
                </CardTitle>
                <CardDescription>
                  Remplissez les détails de votre observation
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmitObservation} className="space-y-4">
                  <div className="space-y-2">
                    <label htmlFor="category" className="text-sm font-medium">
                      Catégorie
                    </label>
                    <Select 
                      value={formData.category} 
                      onValueChange={(value: "PAINT") => setFormData(prev => ({ ...prev, category: value }))}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Sélectionnez une catégorie" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="PAINT">Peinture</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="scale" className="text-sm font-medium">
                      État (sur 10)
                    </label>
                    <div className="space-y-2">
                      <input
                        type="range"
                        id="scale"
                        name="scale"
                        min="0"
                        max="10"
                        step="0.1"
                        value={formData.scale}
                        onChange={(e) => setFormData(prev => ({ ...prev, scale: parseFloat(e.target.value) }))}
                        className="w-full"
                      />
                      <div className="flex justify-between text-sm text-gray-500">
                        <span>0 (Critique)</span>
                        <span className="font-medium">{formData.scale}/10</span>
                        <span>10 (Excellent)</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="content" className="text-sm font-medium">
                      Description détaillée
                    </label>
                    <Textarea
                      id="content"
                      name="content"
                      value={formData.content}
                      onChange={handleInputChange}
                      placeholder="Décrivez en détail ce que vous avez observé..."
                      rows={4}
                      required
                    />
                  </div>

                  <div className="flex gap-2 pt-4">
                    <Button type="submit" className="flex items-center gap-2">
                      {editingObservation ? <Edit className="w-4 h-4" /> : <Send className="w-4 h-4" />}
                      {editingObservation ? "Modifier" : "Envoyer"}
                    </Button>
                    <Button type="button" variant="outline" onClick={cancelForm}>
                      Annuler
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Filtres et recherche */}
        {observations.length > 0 && !isFormOpen && (
          <Card>
            <CardHeader>
              <CardTitle>Filtres</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-4 md:flex-row">
                <div className="relative flex-1">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Rechercher dans vos observations..."
                    className="pl-8"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <div className="flex gap-2">
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
        )}

        {/* Liste des observations */}
        {observations.length > 0 ? (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Vos observations ({filteredObservations.length})</h2>
            
            {filteredObservations.length === 0 ? (
              <div className="py-12 text-center">
                <Search className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                <h3 className="text-lg font-medium text-gray-900">Aucune observation trouvée</h3>
                <p className="mt-2 text-gray-500">
                  Aucune observation ne correspond à vos critères de recherche.
                </p>
              </div>
            ) : (
              filteredObservations.map((observation) => (
                <motion.div 
                  key={observation.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.3 }}
                  className="p-4 border rounded-lg hover:bg-gray-50"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <Badge variant="outline" className="flex items-center gap-1">
                      <Palette className="w-3 h-3" />
                      {observation.category}
                    </Badge>
                    <Badge variant={getScaleBadgeVariant(observation.scale)} className="flex items-center gap-1">
                      <Gauge className="w-3 h-3" />
                      {observation.scale} - {getScaleLabel(observation.scale)}
                    </Badge>
                    <span className="ml-auto text-sm text-gray-500">
                      {formatDate(observation.createdAt)}
                    </span>
                  </div>
                  
                  <p className="mb-4">{observation.content}</p>
                  
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleEditObservation(observation)}
                    >
                      <Edit className="w-4 h-4 mr-1" />
                      Modifier
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleOpenDeleteConfirm(observation.id)}
                    >
                      <Trash2 className="w-4 h-4 mr-1" />
                      Supprimer
                    </Button>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        ) : !isFormOpen && (
          <div className="py-12 text-center">
            <FileText className="w-12 h-12 mx-auto mb-4 text-gray-400" />
            <h3 className="text-lg font-medium text-gray-900">Aucune observation</h3>
            <p className="mt-2 text-gray-500">
              Vous n'avez pas encore créé d'observation. Commencez par en ajouter une !
            </p>
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default UserObservationsPage;