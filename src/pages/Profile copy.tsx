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
  Activity
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

const UserProfile = () => {
  const [activeTab, setActiveTab] = useState("general");
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState("");
  const { toast } = useToast();

  const authUser = useSelector(selectUser);
  
  // Données utilisateur adaptées au projet de cartographie immobilière
  const [userData, setUserData] = useState({
    firstName: "Thomas",
    lastName: "Martin",
    email: "thomas.martin@agence-territoriale.gab",
    phone: "+241 01 23 45 67",
    organization: "Agence Territoriale du Gabon",
    position: "Géomaticien Senior",
    avatar: "/avatars/thomas-martin.jpg",
    role: "Expert",
    lastLogin: "2024-01-15T14:30:00Z",
    specialization: "Cartographie immobilière et gestion foncière",
    region: "Libreville",
    department: "Estuaire",
    mapPreferences: {
      defaultView: "satellite",
      measurementUnit: "hectares",
      defaultRegion: "Libreville",
      coordinateSystem: "WGS84"
    },
    permissions: {
      canCreatePlots: true,
      canEditPlots: true,
      canDeletePlots: false,
      canManageUsers: false,
      canExportData: true,
      canGenerateReports: true
    }
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setUserData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result);
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

  const handleCancel = () => {
    setIsEditing(false);
    setAvatarPreview("");
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
                <AvatarImage src={avatarPreview || userData.avatar} />
                <AvatarFallback className="text-3xl bg-blue-100">
                  {userData.firstName[0]}{userData.lastName[0]}
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
              <h2 className="text-2xl font-bold">{userData.firstName} {userData.lastName}</h2>
              <p className="text-gray-600">{userData.position}</p>
              <p className="text-sm text-gray-500">{userData.organization}</p>
              <div className="inline-flex items-center px-3 py-1 mt-2 text-sm text-blue-800 bg-blue-100 rounded-full">
                <Shield className="w-4 h-4 mr-1" />
                {userData.role}
              </div>
              <div className="inline-flex items-center px-3 py-1 mt-2 text-sm text-green-800 bg-green-100 rounded-full">
                <MapPin className="w-4 h-4 mr-1" />
                {userData.region}, {userData.department}
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
              <p>Membre depuis: Janvier 2024</p>
              <p>Dernière connexion: {new Date(userData.lastLogin).toLocaleDateString('fr-FR')}</p>
            </div>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-1 mb-6 md:grid-cols-4">
            <TabsTrigger value="general">Informations générales</TabsTrigger>
            <TabsTrigger value="preferences">Préférences carto</TabsTrigger>
            <TabsTrigger value="permissions">Permissions</TabsTrigger>
            <TabsTrigger value="activity">Activité</TabsTrigger>
          </TabsList>

          {/* Informations générales */}
          <TabsContent value="general">
            <Card>
              <CardHeader>
                <CardTitle>Informations personnelles</CardTitle>
                <CardDescription>
                  Gérez vos informations de contact et votre profil professionnel
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">Prénom</Label>
                    <Input
                      id="firstName"
                      name="firstName"
                      value={userData.firstName}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                      prefixIcon={<User className="w-4 h-4" />}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Nom</Label>
                    <Input
                      id="lastName"
                      name="lastName"
                      value={userData.lastName}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
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
                  <div className="space-y-2">
                    <Label htmlFor="phone">Téléphone</Label>
                    <Input
                      id="phone"
                      name="phone"
                      value={userData.phone}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                      prefixIcon={<Phone className="w-4 h-4" />}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="organization">Organisation</Label>
                    <Input
                      id="organization"
                      name="organization"
                      value={userData.organization}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                      prefixIcon={<Building className="w-4 h-4" />}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="position">Poste</Label>
                    <Input
                      id="position"
                      name="position"
                      value={userData.position}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="region">Région</Label>
                    <Input
                      id="region"
                      name="region"
                      value={userData.region}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                      prefixIcon={<MapPin className="w-4 h-4" />}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="department">Département</Label>
                    <Input
                      id="department"
                      name="department"
                      value={userData.department}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                      prefixIcon={<MapPin className="w-4 h-4" />}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="specialization">Spécialisation</Label>
                  <Input
                    id="specialization"
                    name="specialization"
                    value={userData.specialization}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                    prefixIcon={<Map className="w-4 h-4" />}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Préférences cartographiques */}
          <TabsContent value="preferences">
            <Card>
              <CardHeader>
                <CardTitle>Préférences cartographiques</CardTitle>
                <CardDescription>
                  Personnalisez votre expérience de cartographie et de gestion des parcelles immobilières
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="defaultView">Vue cartographique par défaut</Label>
                    <select 
                      id="defaultView" 
                      className="flex w-full h-10 px-3 py-2 text-sm border rounded-md border-input bg-background"
                      disabled={!isEditing}
                      value={userData.mapPreferences.defaultView}
                    >
                      <option value="satellite">Satellite</option>
                      <option value="topographic">Topographique</option>
                      <option value="hybrid">Hybride</option>
                      <option value="terrain">Terrain</option>
                      <option value="street">Plan de ville</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="measurementUnit">Unité de mesure</Label>
                    <select 
                      id="measurementUnit" 
                      className="flex w-full h-10 px-3 py-2 text-sm border rounded-md border-input bg-background"
                      disabled={!isEditing}
                      value={userData.mapPreferences.measurementUnit}
                    >
                      <option value="hectares">Hectares</option>
                      <option value="acres">Acres</option>
                      <option value="squareMeters">Mètres carrés</option>
                      <option value="squareFeet">Pieds carrés</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="defaultRegion">Région par défaut</Label>
                    <select 
                      id="defaultRegion" 
                      className="flex w-full h-10 px-3 py-2 text-sm border rounded-md border-input bg-background"
                      disabled={!isEditing}
                      value={userData.mapPreferences.defaultRegion}
                    >
                      <option value="Libreville">Libreville</option>
                      <option value="Port-Gentil">Port-Gentil</option>
                      <option value="Franceville">Franceville</option>
                      <option value="Oyem">Oyem</option>
                      <option value="Moanda">Moanda</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="coordinateSystem">Système de coordonnées</Label>
                    <select 
                      id="coordinateSystem" 
                      className="flex w-full h-10 px-3 py-2 text-sm border rounded-md border-input bg-background"
                      disabled={!isEditing}
                      value={userData.mapPreferences.coordinateSystem}
                    >
                      <option value="WGS84">WGS84 (GPS)</option>
                      <option value="UTM">UTM Zone 32N</option>
                      <option value="Gabon">Système Gabon</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Couches par défaut</Label>
                  <div className="flex flex-wrap gap-4">
                    {['Parcelles', 'Lotissements', 'Limites administratives', 'Réseau hydrographique', 'Voies de communication', 'Bâtiments', 'Terrains vagues'].map(layer => (
                      <label key={layer} className="flex items-center space-x-2">
                        <input 
                          type="checkbox" 
                          className="text-blue-600 rounded" 
                          disabled={!isEditing}
                          defaultChecked
                        />
                        <span>{layer}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Permissions */}
          <TabsContent value="permissions">
            <Card>
              <CardHeader>
                <CardTitle>Permissions et accès</CardTitle>
                <CardDescription>
                  Aperçu de vos droits d'accès sur la plateforme de gestion foncière
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="p-4 border border-green-200 rounded-lg bg-green-50">
                    <div className="flex items-center">
                      <Shield className="w-5 h-5 mr-3 text-green-600" />
                      <div>
                        <h4 className="font-medium text-green-800">Accès autorisés</h4>
                        <p className="text-sm text-green-700">Vous pouvez effectuer ces actions</p>
                      </div>
                    </div>
                  </div>
                  <div className="p-4 border border-red-200 rounded-lg bg-red-50">
                    <div className="flex items-center">
                      <Shield className="w-5 h-5 mr-3 text-red-600" />
                      <div>
                        <h4 className="font-medium text-red-800">Accès restreints</h4>
                        <p className="text-sm text-red-700">Ces actions nécessitent des droits supplémentaires</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="space-y-3">
                    <h4 className="font-medium text-gray-900">Gestion des parcelles</h4>
                    <div className="space-y-2">
                      {[
                        { name: "Créer des parcelles", allowed: userData.permissions.canCreatePlots },
                        { name: "Modifier des parcelles", allowed: userData.permissions.canEditPlots },
                        { name: "Supprimer des parcelles", allowed: userData.permissions.canDeletePlots }
                      ].map((permission, index) => (
                        <div key={index} className="flex items-center justify-between">
                          <span className="text-sm text-gray-700">{permission.name}</span>
                          <div className={`w-3 h-3 rounded-full ${permission.allowed ? 'bg-green-500' : 'bg-red-500'}`}></div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <h4 className="font-medium text-gray-900">Fonctionnalités avancées</h4>
                    <div className="space-y-2">
                      {[
                        { name: "Gérer les utilisateurs", allowed: userData.permissions.canManageUsers },
                        { name: "Exporter des données", allowed: userData.permissions.canExportData },
                        { name: "Générer des rapports", allowed: userData.permissions.canGenerateReports }
                      ].map((permission, index) => (
                        <div key={index} className="flex items-center justify-between">
                          <span className="text-sm text-gray-700">{permission.name}</span>
                          <div className={`w-3 h-3 rounded-full ${permission.allowed ? 'bg-green-500' : 'bg-red-500'}`}></div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="p-4 border border-blue-200 rounded-lg bg-blue-50">
                  <div className="flex items-start">
                    <Settings className="w-5 h-5 mr-3 text-blue-500 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-blue-800">Demande de permissions</h4>
                      <p className="text-sm text-blue-700">
                        Si vous avez besoin de droits supplémentaires, contactez votre administrateur système.
                      </p>
                    </div>
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
                  Historique de vos actions sur la plateforme de gestion foncière
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    { action: "Création de parcelle", date: "2024-01-20T09:30:00Z", details: "Parcelle #LBR-2024-001", icon: <Home className="w-4 h-4 text-blue-600" /> },
                    { action: "Modification de limites", date: "2024-01-19T14:22:00Z", details: "Parcelle #LBR-2023-089", icon: <MapPin className="w-4 h-4 text-green-600" /> },
                    { action: "Export de données", date: "2024-01-18T11:05:00Z", details: "Format Shapefile - Lotissement Centre", icon: <FileText className="w-4 h-4 text-purple-600" /> },
                    { action: "Génération de rapport", date: "2024-01-17T16:40:00Z", details: "Rapport mensuel - Janvier 2024", icon: <BarChart3 className="w-4 h-4 text-orange-600" /> },
                    { action: "Import de données", date: "2024-01-16T10:15:00Z", details: "Fichier CSV - 25 nouvelles parcelles", icon: <Layers className="w-4 h-4 text-indigo-600" /> },
                    { action: "Validation de lotissement", date: "2024-01-15T08:45:00Z", details: "Lotissement Akanda - 15 parcelles", icon: <Building className="w-4 h-4 text-teal-600" /> }
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