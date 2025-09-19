import { useState, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { 
  Search, 
  Filter, 
  MoreVertical, 
  Edit, 
  Trash2, 
  UserPlus,
  Shield,
  UserCheck,
  UserX,
  Eye,
  EyeOff,
  X,
  User,
  Mail,
  Briefcase
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
import { clearCurrentUser, createUser, deleteUser, fetchUserById, fetchUsers, selectCurrentUser, selectUsers, selectUsersError, selectUsersLoading, setCurrentUser, updateUser } from "../../app/store/slices/usersSlice";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../../components/ui/dialog";
import { Textarea } from "../../components/ui/textarea";
import { Label } from "../../components/ui/label";
import { selectUser } from "../../app/store/slices/authSlice";
import UserFormModal from "../../components/modals/UserFormModal";
import ConfirmDialog from "../../components/dialogs/ConfirmDialog";


const AdminUsersPage = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [isLoading, setIsLoading] = useState(true);
  const [isUserFormOpen, setIsUserFormOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);
const [userToDelete, setUserToDelete] = useState<string | null>(null);

  const { toast } = useToast();
  const dispatch = useDispatch();
  const usersFromState = useSelector(selectUsers);
  const currentUserFromState = useSelector(selectCurrentUser);
  const userErrorFromState = useSelector(selectUsersError);
  const userLoadingFromState = useSelector(selectUsersLoading);
  // Données simulées - à remplacer par un appel API réel
  const loadUsersDatas = async () => {

    const responseUsers = await dispatch(fetchUsers());
    
    /*setUsers(mockUsers);
    setFilteredUsers(mockUsers);
    setIsLoading(false);*/
  }

  useEffect(() => {
    loadUsersDatas();
  }, []);

  useEffect(() => {
    //console.log("SELECTED USERS", usersFromState)
    setUsers(usersFromState);
    setFilteredUsers(usersFromState);
    setIsLoading(false);
  }, [usersFromState]);

  // Filtrage des utilisateurs
  useEffect(() => {
    let result = users;

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(user => 
        user.username.toLowerCase().includes(query) ||
        user.email.toLowerCase().includes(query) ||
        user.profession?.toLowerCase().includes(query)
      );
    }

    if (roleFilter !== "all") {
      result = result.filter(user => user.role === roleFilter);
    }

    if (statusFilter !== "all") {
      result = result.filter(user => user.status === statusFilter);
    }

    setFilteredUsers(result);
  }, [searchQuery, roleFilter, statusFilter, users]);

  const handleStatusChange = async (userId: string, newStatus: User["status"]) => {
    /*setUsers(prevUsers => 
      prevUsers.map(user => 
        user.id === userId ? { ...user, status: newStatus } : user
      )
    );*/

    const data = {
      "id": userId,
      "userData": {
        "status": newStatus
      }
    }

    await dispatch(updateUser(data));

    if(!userErrorFromState) {
      toast({
        title: "Statut modifié",
        description: `Le statut de l'utilisateur a été changé en ${newStatus}.`,
      });

      loadUsersDatas();
    }
  };

  const handleRoleChange = async (userId: string, newRole: User["role"]) => {
    /*setUsers(prevUsers => 
      prevUsers.map(user => 
        user.id === userId ? { ...user, role: newRole } : user
      )
    );*/

    const data = {
      "id": userId,
      "userData": {
        "role": newRole
      }
    }

    await dispatch(updateUser(data));

    if(!userErrorFromState) {
      toast({
        title: "Rôle modifié",
        description: `Le rôle de l'utilisateur a été changé en ${newRole}.`,
      });

      loadUsersDatas();
    }
  };

  const handleOpenDeleteConfirm = (userId: string) => {
    setUserToDelete(userId);
    setIsConfirmDialogOpen(true);
  };
  
  const handleConfirmDelete = async () => {
    if (userToDelete) {
      await handleDeleteUser(userToDelete);
      setIsConfirmDialogOpen(false);
      setUserToDelete(null);
    }
  };

  const handleStartCreatingUser = () => {
    setSelectedUser(null);
    dispatch(clearCurrentUser())
    setIsUserFormOpen(true);
  };

  const handleCreate = async (formData) => {
    await dispatch(createUser(formData));

    if(!userErrorFromState) {
      setIsUserFormOpen(false);

      loadUsersDatas();
    }
  }

  const handleUpdate = async (formData) => {
    const data = {
      "id": currentUserFromState?.id,
      "userData": formData
    }

    await dispatch(updateUser(data));

    if(!userErrorFromState) {
      setIsUserFormOpen(false);

      loadUsersDatas();
    }
  }

  const handleStartEditingUser = async (userId: string) => {
    await dispatch(fetchUserById(userId));
    setIsUserFormOpen(true);
  };

  useEffect(() => {
    setSelectedUser(currentUserFromState);
  }, [currentUserFromState]);

  const handleDeleteUser = async (userId: string) => {
    await dispatch(deleteUser(userId));
    
    if(!userErrorFromState) {
      toast({
        title: "Utilisateur supprimé",
        description: "L'utilisateur a été supprimé avec succès.",
      });

      loadUsersDatas();
    }
  };

  const getStatusBadgeVariant = (status: User["status"]) => {
    switch (status) {
      case "ACTIVE": return "default";
      case "INACTIVE": return "secondary";
      case "SUSPEND": return "destructive";
      default: return "outline";
    }
  };

  const getRoleBadgeVariant = (role: User["role"]) => {
    switch (role) {
      case "ADMIN": return "destructive";
      case "EXPERT": return "default";
      case "TENANT": return "outline";
      case "DEFAULT": return "secondary";
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
        <div className="text-lg">Chargement...</div>
      </div>
    );
  }

  return (
    <div className="container p-1 mx-auto space-y-6 md:p-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Gestion des Utilisateurs</h1>
          <p className="text-muted-foreground">
            Administrez les utilisateurs, leurs rôles et leurs statuts
          </p>
        </div>
        <Button onClick={handleStartCreatingUser} className="cursor-pointer">
          <UserPlus className="w-4 h-4 mr-2" />
          Nouvel utilisateur
        </Button>
      </div>

      <UserFormModal
        isOpen={isUserFormOpen}
        onClose={() => setIsUserFormOpen(false)}
        onUpdate={(data) => handleUpdate(data)}
        onCreate={(data) => handleCreate(data)}
        user={currentUserFromState}
        isLoading={userLoadingFromState}
      />

      <ConfirmDialog
        isOpen={isConfirmDialogOpen}
        onClose={() => setIsConfirmDialogOpen(false)}
        onConfirm={handleConfirmDelete}
        title="Supprimer l'utilisateur"
        description="Êtes-vous sûr de vouloir supprimer cet utilisateur ? Cette action est irréversible."
        confirmText="Supprimer"
        cancelText="Annuler"
        variant="destructive"
        isLoading={userLoadingFromState} // Utilisez l'état de chargement existant
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
                placeholder="Rechercher par nom, email ou profession..."
                className="pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger className="w-[130px]">
                  <SelectValue placeholder="Rôle" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les rôles</SelectItem>
                  <SelectItem value="ADMIN">Admin</SelectItem>
                  <SelectItem value="EXPERT">Expert</SelectItem>
                  <SelectItem value="TENANT">Locataire</SelectItem>
                  <SelectItem value="DEFAULT">Utilisateur</SelectItem>
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
                  <SelectItem value="SUSPEND">Suspendu</SelectItem>
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
                  <th className="p-4 font-medium text-left">Utilisateur</th>
                  <th className="p-4 font-medium text-left">Rôle</th>
                  <th className="p-4 font-medium text-left">Statut</th>
                  <th className="p-4 font-medium text-left">Date de création</th>
                  <th className="p-4 font-medium text-left">Dernière modification</th>
                  <th className="p-4 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-muted-foreground">
                      Aucun utilisateur trouvé
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((user) => (
                    <motion.tr 
                      key={user.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="border-b hover:bg-muted/30"
                    >
                      <td className="p-4">
                        <div>
                          <div className="font-medium">{user.username}</div>
                          <div className="text-sm text-muted-foreground">{user.email}</div>
                          {user.profession && (
                            <div className="text-sm text-muted-foreground">{user.profession}</div>
                          )}
                        </div>
                      </td>
                      <td className="p-4">
                        <Badge variant={getRoleBadgeVariant(user.role)}>
                          {user.role === "ADMIN" && <Shield className="w-3 h-3 mr-1" />}
                          {user.role === "DEFAULT" && "USER"}
                          {user.role !== "DEFAULT" && user.role}
                        </Badge>
                      </td>
                      <td className="p-4">
                        <Badge variant={getStatusBadgeVariant(user.status)}>
                          {user.status === "ACTIVE" && <UserCheck className="w-3 h-3 mr-1" />}
                          {user.status === "INACTIVE" && <EyeOff className="w-3 h-3 mr-1" />}
                          {user.status === "SUSPEND" && <UserX className="w-3 h-3 mr-1" />}
                          {user.status}
                        </Badge>
                      </td>
                      <td className="p-4 text-sm">{formatDate(user.createdAt)}</td>
                      <td className="p-4 text-sm">{formatDate(user.updatedAt)}</td>
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
                              Changer le rôle
                            </DropdownMenuLabel>
                            <DropdownMenuItem onClick={() => handleRoleChange(user.id, "ADMIN")}>
                              <Shield className="w-4 h-4 mr-2" />
                              Administrateur
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleRoleChange(user.id, "EXPERT")}>
                              Expert
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleRoleChange(user.id, "TENANT")}>
                              Locataire
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleRoleChange(user.id, "DEFAULT")}>
                              Utilisateur
                            </DropdownMenuItem>
                            
                            <DropdownMenuSeparator />
                            
                            <DropdownMenuLabel className="text-xs text-muted-foreground">
                              Changer le statut
                            </DropdownMenuLabel>
                            <DropdownMenuItem onClick={() => handleStatusChange(user.id, "ACTIVE")}>
                              <UserCheck className="w-4 h-4 mr-2" />
                              Actif
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleStatusChange(user.id, "INACTIVE")}>
                              <EyeOff className="w-4 h-4 mr-2" />
                              Inactif
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleStatusChange(user.id, "SUSPEND")}>
                              <UserX className="w-4 h-4 mr-2" />
                              Suspendu
                            </DropdownMenuItem>
                            
                            <DropdownMenuSeparator />
                            
                            <DropdownMenuItem onClick={async () => { await handleStartEditingUser(user.id) }}>
                              <Edit className="w-4 h-4 mr-2" />
                              Modifier
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              className="text-destructive"
                              onClick={() => handleOpenDeleteConfirm(user.id)}
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

export default AdminUsersPage;