// AdminDashboard.tsx
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { 
  Users, 
  Binoculars, 
  Map, 
  FileText,
  TrendingUp,
  AlertTriangle,
  UserCheck,
  UserX,
  Shield,
  BarChart3,
  PieChart,
  Activity
} from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { 
  fetchDashboardStats, 
  selectDashboardStats, 
  selectDashboardLoading, 
  selectDashboardError 
} from "../../app/store/slices/dashboardSlice";
import { useToast } from "../../hooks/useToast";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Pie,
  Cell,
  LineChart,
  Line,
  AreaChart,
  Area
} from 'recharts';

// Define types for our additional stats
interface ExtendedDashboardStats {
  totalUsers: number;
  totalObservations: number;
  totalPlots: number;
  totalHE: number;
  activeUsers: number;
  inactiveUsers: number;
  suspendedUsers: number;
  adminUsers: number;
  expertUsers: number;
  defaultUsers: number;
  tenantUsers: number;
  builtPlots: number;
  unbuiltPlots: number;
  totalPlotArea: number;
  totalMarketValue: number;
  observationsByCategory: { category: string; count: number }[];
  userActivity: { date: string; count: number }[];
  loading: boolean;
  error: string | null;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

const AdminDashboard = () => {
  const dispatch = useDispatch();
  //const { totalUsers, totalObservations, totalPlots, totalHE, loading, error } = useSelector(selectDashboardStats);
  const { loadSucceed, loading, error, ...extendedStats } = useSelector(selectDashboardStats);
  // const dashboard = useSelector(selectDashboardStats);
  const { toast } = useToast();
  
  useEffect(() => {
    console.log("DASHBOARD DATAS", extendedStats);
  }, []);
  // State for extended stats (you'll need to update your slice to fetch these)
  /*const [extendedStats, setExtendedStats] = useState<ExtendedDashboardStats>({
    totalUsers: 0,
    totalObservations: 0,
    totalPlots: 0,
    totalHE: 0,
    activeUsers: 0,
    inactiveUsers: 0,
    suspendedUsers: 0,
    adminUsers: 0,
    expertUsers: 0,
    defaultUsers: 0,
    tenantUsers: 0,
    builtPlots: 0,
    unbuiltPlots: 0,
    totalPlotArea: 0,
    totalMarketValue: 0,
    observationsByCategory: [{ category: "PAINT", count: 7 }],
    userActivity: [],
    loading: true,
    error: null
  });*/

  const fetchDashboardDatas = async () => {
    //await dispatch(fetchDashboardStats() as any);

    /*setExtendedStats({
      ...dashboard,
      ...extendedStats
    });*/
  }

  useEffect(() => {
    dispatch(fetchDashboardStats() as any);
    // In a real app, you'd fetch the extended stats here
    // For now, we'll simulate the data
    /*setTimeout(() => {
      setExtendedStats({
        totalUsers: 1248,
        totalObservations: 5678,
        totalPlots: 892,
        totalHE: 156,
        activeUsers: 985,
        inactiveUsers: 210,
        suspendedUsers: 53,
        adminUsers: 12,
        expertUsers: 45,
        defaultUsers: 980,
        tenantUsers: 211,
        builtPlots: 567,
        unbuiltPlots: 325,
        totalPlotArea: 245670,
        totalMarketValue: 45678900,
        observationsByCategory: [
          { category: "Construction", count: 1567 },
          { category: "Vegetation", count: 2345 },
          { category: "Infrastructure", count: 987 },
          { category: "Other", count: 779 }
        ],
        userActivity: [
          { date: "2024-01-01", count: 45 },
          { date: "2024-01-02", count: 52 },
          { date: "2024-01-03", count: 48 },
          { date: "2024-01-04", count: 67 },
          { date: "2024-01-05", count: 59 },
          { date: "2024-01-06", count: 73 },
          { date: "2024-01-07", count: 81 }
        ],
        loading: false,
        error: null
      });
    }, 1000);*/

  }, [dispatch]);

  /*useEffect(() => {
    if(loadSucceed) {
      fetchDashboardDatas();
      console.log("LOAD SUCCEED", extendedStats);
    }
  }, [loadSucceed]);*/

  useEffect(() => {
    if (error) {
      toast({
        title: "Erreur",
        description: "Impossible de charger les statistiques du tableau de bord.",
        variant: "destructive"
      });
    }
  }, [error, toast]);

  const stats = [
    {
      title: "Utilisateurs totaux",
      value: extendedStats.totalUsers.toLocaleString(),
      change: "+12% ce mois",
      icon: Users,
      color: "text-blue-600",
      detail: `${extendedStats.activeUsers} actifs, ${extendedStats.inactiveUsers} inactifs, ${extendedStats.suspendedUsers} suspendus`
    },
    {
      title: "Observations",
      value: extendedStats.totalObservations.toLocaleString(),
      change: "+8% ce mois",
      icon: Binoculars,
      color: "text-green-600",
      detail: `${extendedStats.observationsByCategory.reduce((sum, cat) => sum + cat.count, 0)} au total`
    },
    {
      title: "Parcelles enregistrées",
      value: extendedStats.totalPlots.toLocaleString(),
      change: "+15% ce mois",
      icon: Map,
      color: "text-purple-600",
      detail: `${extendedStats.builtPlots} bâties, ${extendedStats.unbuiltPlots} non bâties`
    },
    {
      title: "Citées créées",
      value: extendedStats.totalHE.toLocaleString(),
      change: "+3% ce mois",
      icon: FileText,
      color: "text-orange-600",
      detail: `${extendedStats.totalPlotArea.toLocaleString()} m² total, ${extendedStats.totalMarketValue.toLocaleString()} € valeur`
    },
    {
      title: "Utilisateurs actifs",
      value: extendedStats.activeUsers.toLocaleString(),
      change: "+5% ce mois",
      icon: UserCheck,
      color: "text-teal-600",
      detail: `${Math.round((extendedStats.activeUsers / extendedStats.totalUsers) * 100)}% des utilisateurs`
    },
    {
      title: "Administrateurs",
      value: extendedStats.adminUsers.toLocaleString(),
      change: "+0% ce mois",
      icon: Shield,
      color: "text-red-600",
      detail: `${extendedStats.expertUsers} experts, ${extendedStats.tenantUsers} locataires`
    }
  ];

  /*
  const recentActivities = [
    {
      user: "Marie Ndong",
      action: "a créé une nouvelle observation",
      time: "Il y a 2 minutes",
      type: "observation"
    },
    {
      user: "Paul Biyoghé",
      action: "a modifié ses informations de profil",
      time: "Il y a 15 minutes",
      type: "profile"
    },
    {
      user: "Admin System",
      action: "a généré un rapport mensuel",
      time: "Il y a 1 heure",
      type: "report"
    },
    {
      user: "Lucie Mba",
      action: "a ajouté une nouvelle parcelle",
      time: "Il y a 2 heures",
      type: "map"
    },
    {
      user: "Jean Okou",
      action: "a signalé un problème technique",
      time: "Il y a 3 heures",
      type: "issue"
    }
  ];
  */

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Chargement des statistiques...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome banner */}
      <div className="p-6 text-white rounded-lg bg-gradient-to-r from-blue-600 to-purple-600">
        <h2 className="mb-2 text-2xl font-bold">Bienvenue dans l'administration GabX</h2>
        <p className="opacity-90">Gérez vos utilisateurs, observations et données cartographiques en temps réel.</p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card key={index} className="overflow-hidden">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                    <p className="text-2xl font-bold">{stat.value}</p>
                    <p className="text-xs text-green-600">{stat.change}</p>
                    <p className="mt-1 text-xs text-gray-500">{stat.detail}</p>
                  </div>
                  <div className={`p-3 rounded-full bg-gray-100 ${stat.color}`}>
                    <Icon className="w-6 h-6" />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* User activity chart */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle>Activité des utilisateurs (7 jours)</CardTitle>
            <Activity className="w-5 h-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={extendedStats.userActivity}
                  margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Area type="monotone" dataKey="count" stroke="#8884d8" fill="#8884d8" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Observations by category */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle>Observations par catégorie</CardTitle>
            <PieChart className="w-5 h-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="h-80">
              {/* <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={extendedStats.observationsByCategory}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="count"
                  >
                    {extendedStats.observationsByCategory.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer> */}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">

        {/* User distribution */}
        {/* <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle>Répartition des utilisateurs</CardTitle>
            <BarChart3 className="w-5 h-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={[
                    { name: 'Admins', value: extendedStats.adminUsers },
                    { name: 'Experts', value: extendedStats.expertUsers },
                    { name: 'Utilisateurs', value: extendedStats.defaultUsers },
                    { name: 'Locataires', value: extendedStats.tenantUsers },
                  ]}
                  margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="value" fill="#8884d8" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card> */}

        {/* Recent activities */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Activités récentes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* {recentActivities.map((activity, index) => ( */}
              {extendedStats.recentActivies?.map((activity, index) => (
                <div key={index} className="flex items-start space-x-3">
                  <div className="flex-shrink-0">
                    <div className="flex items-center justify-center w-10 h-10 bg-blue-100 rounded-full">
                      <span className="font-medium text-blue-600">
                        {activity?.user?.username?.split(' ').map(n => n[0]).join('') || `#`}
                      </span>
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900">
                      {activity?.user?.username}
                      <span className="font-normal text-gray-600">
                        {(() => {
                          switch (activity.type) {
                            case "user_register":
                              return " a créé un compte";
                            case "observation_created":
                              return " a ajouté une observation";
                            case "plot_created":
                              return "Nouvelle parcelle créée";
                            case "building_created":
                              return "Nouveuw bâtiment créé";
                            case "housing_estate_created":
                              return "Nouvelle cité créée";
                            default:
                              return activity.type;
                          }
                        })()}
                      </span>
                    </p>
                    <p className="text-xs text-gray-500">
                      {activity.createdAt
                        ? new Date(activity.createdAt).toLocaleString('fr-FR', {
                            year: 'numeric',
                            month: 'short',
                            day: '2-digit',
                            hour: '2-digit',
                            minute: '2-digit',
                          })
                        : ''}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

    </div>
  );
};

export default AdminDashboard;