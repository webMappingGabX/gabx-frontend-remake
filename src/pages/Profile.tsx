import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  User, 
  Mail, 
  Phone, 
  Map, 
  Building, 
  Save, 
  Edit, 
  Upload,
  Shield,
  Key,
  Globe,
  Layers,
  Home,
  MapPin,
  BarChart3,
  FileText,
  Settings,
  Activity,
  Lock,
  RefreshCw,
  Eye,
  EyeOff,
  Download
} from "lucide-react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "../components/ui/avatar";
import { useToast } from "../hooks/useToast";
import { useSelector } from "react-redux";
import { selectUser } from "../app/store/slices/authSlice";

// Types basés sur votre modèle User
interface UserProfile {
  id: string;
  username: string;
  email: string;
  password?: string;
  role: "DEFAULT" | "EXPERT" | "ADMIN";
  profession: string;
  status: "ACTIVE" | "INACTIVE" | "SUSPEND";
  resetCode?: string;
  resetCodeExpiresAt?: string;
  locationCode?: string;
  createdAt: string;
  updatedAt: string;
}

const UserProfile = () => {
  const [activeTab, setActiveTab] = useState("general");
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const { toast } = useToast();

  const authUser = useSelector(selectUser);
  
  // Données utilisateur adaptées à votre modèle
  const [userData, setUserData] = useState<UserProfile>({
    id: "1",
    username: "thomas_martin",
    email: "thomas.martin@agence-territoriale.gab",
    role: "EXPERT",
    profession: "Géomaticien Senior",
    status: "ACTIVE",
    locationCode: "LBV-EST-001",
    createdAt: "2024-01-15T10:30:00Z",
    updatedAt: "2024-01-20T14:22:00Z"
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setUserData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    setIsLoading(true);
    // Simulation de sauvegarde
    setTimeout(() => {
      setIsLoading(false);
      setIsEditing(false);
      toast({
        title: "Profil mis à jour",
        description: "Vos informations ont été enregistrées avec succès.",
      });
    }, 1500);
  };

  const handlePasswordSave = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast({
        title: "Erreur",
        description: "Les mots de passe ne correspondent pas.",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    // Simulation de changement de mot de passe
    setTimeout(() => {
      setIsLoading(false);
      setPasswordData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: ""
      });
      toast({
        title: "Mot de passe modifié",
        description: "Votre mot de passe a été changé avec succès.",
      });
    }, 1500);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setAvatarPreview("");
  };

  const requestPasswordReset = () => {
    toast({
      title: "Demande envoyée",
      description: "Un code de réinitialisation a été envoyé à votre email.",
    });
  };

  const getStatusBadgeVariant = (status: UserProfile["status"]) => {
    switch (status) {
      case "ACTIVE": return "default";
      case "INACTIVE": return "secondary";
      case "SUSPEND": return "destructive";
      default: return "outline";
    }
  };

  const getRoleLabel = (role: UserProfile["role"]) => {
    switch (role) {
      case "ADMIN": return "Administrateur";
      case "EXPERT": return "Expert";
      case "DEFAULT": return "Utilisateur";
      default: return role;
    }
  };

  const getStatusLabel = (status: UserProfile["status"]) => {
    switch (status) {
      case "ACTIVE": return "Actif";
      case "INACTIVE": return "Inactif";
      case "SUSPEND": return "Suspendu";
      default: return status;
    }
  };

  return (
    <div className="container max-w-6xl px-2 py-8 mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="flex flex-col gap-6 mb-8 md:flex-row md:items-start">
          {/* Photo de profil */}
          <div className="flex flex-col items-center gap-4">
            <div className="relative">
              <Avatar className="w-32 h-32 border-4 border-white shadow-lg">
                <AvatarImage src={avatarPreview || "/avatars/thomas-martin.jpg"} />
                <AvatarFallback className="text-3xl bg-blue-100">
                  {userData.username[0]?.toUpperCase()}
                </AvatarFallback>
              </Avatar>
              
              {isEditing && (
                <label 
                  htmlFor="avatar-upload"
                  className="absolute bottom-0 right-0 p-2 bg-blue-600 rounded-full shadow-md cursor-pointer"
                >
                  <Upload className="w-5 h-5 text-white" />
                  <input
                    id="avatar-upload"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleAvatarChange}
                  />
                </label>
              )}
            </div>
            
            <div className="text-center">
              <h2 className="text-2xl font-bold">{userData.username}</h2>
              <p className="text-gray-600">{userData.profession}</p>
              <div className="flex flex-col gap-2 mt-3">
                <div className="inline-flex items-center px-3 py-1 text-sm text-blue-800 bg-blue-100 rounded-full">
                  <Shield className="w-4 h-4 mr-1" />
                  {getRoleLabel(userData.role)}
                </div>
                <div className="inline-flex items-center px-3 py-1 text-sm text-green-800 bg-green-100 rounded-full">
                  <Activity className="w-4 h-4 mr-1" />
                  {getStatusLabel(userData.status)}
                </div>
                {userData.locationCode && (
                  <div className="inline-flex items-center px-3 py-1 text-sm text-purple-800 bg-purple-100 rounded-full">
                    <MapPin className="w-4 h-4 mr-1" />
                    {userData.locationCode}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-4 md:ml-auto">
            {isEditing ? (
              <div className="flex gap-2">
                <Button 
                  onClick={handleSave} 
                  disabled={isLoading}
                  className="flex items-center gap-2"
                >
                  {isLoading ? (
                    <div className="w-4 h-4 border-2 border-white rounded-full border-t-transparent animate-spin"></div>
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  Enregistrer
                </Button>
                <Button variant="outline" onClick={handleCancel}>
                  Annuler
                </Button>
              </div>
            ) : (
              <Button 
                onClick={() => setIsEditing(true)}
                className="flex items-center gap-2"
              >
                <Edit className="w-4 h-4" />
                Modifier le profil
              </Button>
            )}
            
            <div className="text-sm text-gray-500">
              <p>Membre depuis: {new Date(userData.createdAt).toLocaleDateString('fr-FR')}</p>
              <p>Dernière modification: {new Date(userData.updatedAt).toLocaleDateString('fr-FR')}</p>
            </div>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-1 mb-6 md:grid-cols-4">
            <TabsTrigger value="general">Informations générales</TabsTrigger>
            <TabsTrigger value="security">Sécurité</TabsTrigger>
            <TabsTrigger value="preferences">Préférences</TabsTrigger>
            <TabsTrigger value="activity">Activité</TabsTrigger>
          </TabsList>

          {/* Informations générales */}
          <TabsContent value="general">
            <Card>
              <CardHeader>
                <CardTitle>Informations personnelles</CardTitle>
                <CardDescription>
                  Gérez vos informations de compte et votre profil professionnel
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="username">Nom d'utilisateur</Label>
                    <Input
                      id="username"
                      name="username"
                      value={userData.username}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                      prefixIcon={<User className="w-4 h-4" />}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      value={userData.email}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                      prefixIcon={<Mail className="w-4 h-4" />}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="profession">Profession</Label>
                    <Input
                      id="profession"
                      name="profession"
                      value={userData.profession}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                      prefixIcon={<Building className="w-4 h-4" />}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="locationCode">Code de localisation</Label>
                    <Input
                      id="locationCode"
                      name="locationCode"
                      value={userData.locationCode || ""}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                      prefixIcon={<MapPin className="w-4 h-4" />}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Rôle</Label>
                    <div className="flex items-center px-3 py-2 border rounded-md border-input bg-muted">
                      <Shield className="w-4 h-4 mr-2" />
                      <span>{getRoleLabel(userData.role)}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Le rôle ne peut être modifié que par un administrateur
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label>Statut du compte</Label>
                    <div className="flex items-center px-3 py-2 border rounded-md border-input bg-muted">
                      <Activity className="w-4 h-4 mr-2" />
                      <span>{getStatusLabel(userData.status)}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Le statut ne peut être modifié que par un administrateur
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Sécurité */}
          <TabsContent value="security">
            <Card>
              <CardHeader>
                <CardTitle>Sécurité du compte</CardTitle>
                <CardDescription>
                  Gérez votre mot de passe et les paramètres de sécurité
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="p-4 border rounded-lg">
                  <h4 className="mb-3 font-medium">Changer le mot de passe</h4>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="currentPassword">Mot de passe actuel</Label>
                      <div className="relative">
                        <Input
                          id="currentPassword"
                          name="currentPassword"
                          type={showPassword ? "text" : "password"}
                          value={passwordData.currentPassword}
                          onChange={handlePasswordChange}
                          prefixIcon={<Lock className="w-4 h-4" />}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="absolute top-0 right-0 h-full px-3 py-2 hover:bg-transparent"
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="newPassword">Nouveau mot de passe</Label>
                      <Input
                        id="newPassword"
                        name="newPassword"
                        type={showPassword ? "text" : "password"}
                        value={passwordData.newPassword}
                        onChange={handlePasswordChange}
                        prefixIcon={<Key className="w-4 h-4" />}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="confirmPassword">Confirmer le nouveau mot de passe</Label>
                      <Input
                        id="confirmPassword"
                        name="confirmPassword"
                        type={showPassword ? "text" : "password"}
                        value={passwordData.confirmPassword}
                        onChange={handlePasswordChange}
                        prefixIcon={<Key className="w-4 h-4" />}
                      />
                    </div>

                    <Button 
                      onClick={handlePasswordSave}
                      disabled={isLoading}
                      className="flex items-center gap-2"
                    >
                      {isLoading ? (
                        <div className="w-4 h-4 border-2 border-white rounded-full border-t-transparent animate-spin"></div>
                      ) : (
                        <Save className="w-4 h-4" />
                      )}
                      Changer le mot de passe
                    </Button>
                  </div>
                </div>

                <div className="p-4 border rounded-lg">
                  <h4 className="mb-3 font-medium">Réinitialisation du mot de passe</h4>
                  <p className="mb-3 text-sm text-muted-foreground">
                    Si vous avez oublié votre mot de passe, vous pouvez demander une réinitialisation.
                  </p>
                  <Button 
                    variant="outline" 
                    onClick={requestPasswordReset}
                    className="flex items-center gap-2"
                  >
                    <RefreshCw className="w-4 h-4" />
                    Demander une réinitialisation
                  </Button>
                </div>

                {userData.resetCode && (
                  <div className="p-4 border rounded-lg">
                    <h4 className="mb-3 font-medium">Code de réinitialisation actif</h4>
                    <p className="mb-2 text-sm text-muted-foreground">
                      Un code de réinitialisation a été généré le {userData.resetCodeExpiresAt && new Date(userData.resetCodeExpiresAt).toLocaleDateString('fr-FR')}.
                    </p>
                    <div className="flex items-center gap-2">
                      <Input
                        value={userData.resetCode}
                        readOnly
                        className="font-mono"
                      />
                      <Button variant="outline" size="icon">
                        <Eye className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Préférences */}
          <TabsContent value="preferences">
            <Card>
              <CardHeader>
                <CardTitle>Préférences</CardTitle>
                <CardDescription>
                  Personnalisez votre expérience sur la plateforme
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 border rounded-lg">
                  <h4 className="mb-3 font-medium">Préférences d'affichage</h4>
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="language">Langue</Label>
                      <select 
                        id="language" 
                        className="flex w-full h-10 px-3 py-2 text-sm border rounded-md border-input bg-background"
                      >
                        <option value="fr">Français</option>
                        <option value="en">English</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="theme">Thème</Label>
                      <select 
                        id="theme" 
                        className="flex w-full h-10 px-3 py-2 text-sm border rounded-md border-input bg-background"
                      >
                        <option value="light">Clair</option>
                        <option value="dark">Sombre</option>
                        <option value="system">Système</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="p-4 border rounded-lg">
                  <h4 className="mb-3 font-medium">Notifications</h4>
                  <div className="space-y-3">
                    {[
                      { id: "notif-email", label: "Notifications par email", defaultChecked: true },
                      { id: "notif-updates", label: "Mises à jour du système", defaultChecked: true },
                      { id: "notif-security", label: "Alertes de sécurité", defaultChecked: true },
                      { id: "notif-news", label: "Nouvelles et annonces", defaultChecked: false },
                    ].map((notif) => (
                      <label key={notif.id} className="flex items-center space-x-2">
                        <input 
                          type="checkbox" 
                          id={notif.id}
                          defaultChecked={notif.defaultChecked}
                          className="text-blue-600 rounded" 
                        />
                        <span className="text-sm">{notif.label}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Activité */}
          <TabsContent value="activity">
            <Card>
              <CardHeader>
                <CardTitle>Activité récente</CardTitle>
                <CardDescription>
                  Historique de vos actions sur la plateforme
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    { action: "Connexion au compte", date: "2024-01-20T14:22:00Z", details: "IP: 192.168.1.1", icon: <User className="w-4 h-4 text-blue-600" /> },
                    { action: "Modification du profil", date: "2024-01-19T11:05:00Z", details: "Informations professionnelles", icon: <Edit className="w-4 h-4 text-green-600" /> },
                    { action: "Consultation de carte", date: "2024-01-18T16:40:00Z", details: "Région de Libreville", icon: <Map className="w-4 h-4 text-purple-600" /> },
                    { action: "Génération de rapport", date: "2024-01-17T10:15:00Z", details: "Rapport mensuel - Janvier 2024", icon: <FileText className="w-4 h-4 text-orange-600" /> },
                    { action: "Export de données", date: "2024-01-16T08:45:00Z", details: "Format CSV - 15 enregistrements", icon: <Download className="w-4 h-4 text-indigo-600" /> },
                  ].map((activity, index) => (
                    <div key={index} className="flex items-start p-3 transition-colors border rounded-lg hover:bg-gray-50">
                      <div className="flex items-center justify-center w-8 h-8 mr-3 bg-gray-100 rounded-full">
                        {activity.icon}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium">{activity.action}</p>
                        <p className="text-sm text-gray-500">{activity.details}</p>
                        <p className="text-xs text-gray-400">
                          {new Date(activity.date).toLocaleDateString('fr-FR')} à {new Date(activity.date).toLocaleTimeString('fr-FR')}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </motion.div>
    </div>
  );
};

export default UserProfile;