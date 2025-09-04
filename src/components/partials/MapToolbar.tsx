import { useState } from "react";
import { motion } from "framer-motion";
import {
  Layers,
  Ruler,
  Download,
  Search,
  Eye,
  EyeOff,
  MapPin,
  Filter,
  Settings,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { Button } from "../../components/ui/button";
import { Toggle } from "../../components/ui/toggle";
import { useToast } from "../../hooks/useToast";

interface MapToolbarProps {
  onToggleSearch?: () => void;
  onToggleLayers?: () => void;
  onMeasure?: () => void;
  onExport?: () => void;
  isSearchVisible?: boolean;
  isLayersVisible?: boolean;
}

const MapToolbar = ({
  onToggleSearch,
  onToggleLayers,
  onMeasure,
  onExport,
  isSearchVisible = false,
  isLayersVisible = false
}: MapToolbarProps) => {
  const [activeTool, setActiveTool] = useState<string | null>(null);
  const [scrollPosition, setScrollPosition] = useState(0);
  const { toast } = useToast();

  // Options de couches disponibles
  const [activeLayers, setActiveLayers] = useState({
    parcelles: true,
    limites: true,
    batiments: false,
    reseauHydro: false,
    voiesCommunication: false,
    orthophotos: false
  });

  // Outils disponibles dans la toolbar
  const tools = [
    {
      id: "search",
      icon: Search,
      label: "Recherche",
      action: onToggleSearch,
      active: isSearchVisible
    },
    {
      id: "layers",
      icon: Layers,
      label: "Couches",
      action: onToggleLayers,
      active: isLayersVisible
    },
    {
      id: "measure",
      icon: Ruler,
      label: "Mesurer",
      action: onMeasure
    },
    {
      id: "export",
      icon: Download,
      label: "Exporter",
      action: onExport
    },
    {
      id: "marker",
      icon: MapPin,
      label: "Marqueurs",
      action: () => toast({ title: "Fonctionnalité à venir", description: "Gestion des marqueurs" })
    },
    {
      id: "filter",
      icon: Filter,
      label: "Filtres",
      action: () => toast({ title: "Fonctionnalité à venir", description: "Filtres avancés" })
    },
    {
      id: "settings",
      icon: Settings,
      label: "Paramètres",
      action: () => toast({ title: "Fonctionnalité à venir", description: "Paramètres de la carte" })
    }
  ];

  const handleScroll = (direction: 'left' | 'right') => {
    const container = document.getElementById('map-toolbar-scroll');
    if (container) {
      const scrollAmount = 200;
      const newPosition = direction === 'right' 
        ? scrollPosition + scrollAmount 
        : scrollPosition - scrollAmount;
      
      container.scrollTo({ left: newPosition, behavior: 'smooth' });
      setScrollPosition(newPosition);
    }
  };

  const handleToolClick = (toolId: string, action?: () => void) => {
    setActiveTool(activeTool === toolId ? null : toolId);
    if (action) action();
  };

  const toggleLayer = (layer: keyof typeof activeLayers) => {
    setActiveLayers(prev => ({
      ...prev,
      [layer]: !prev[layer]
    }));
  };

  return (
    <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-[1000] w-full max-w-4xl px-4">
      {/* Conteneur principal avec défilement */}
      <div className="relative overflow-hidden border shadow-lg bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm rounded-xl border-slate-200 dark:border-slate-700">
        
        {/* Boutons de navigation (flèches) */}
        {scrollPosition > 0 && (
          <button
            onClick={() => handleScroll('left')}
            className="absolute z-10 p-1 transform -translate-y-1/2 bg-white rounded-full shadow-md left-2 top-1/2 dark:bg-slate-700"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
        )}
        
        <button
          onClick={() => handleScroll('right')}
          className="absolute z-10 p-1 transform -translate-y-1/2 bg-white rounded-full shadow-md right-2 top-1/2 dark:bg-slate-700"
        >
          <ChevronRight className="w-5 h-5" />
        </button>

        {/* Barre d'outils scrollable */}
        <div
          id="map-toolbar-scroll"
          className="flex px-2 py-3 overflow-x-auto scrollbar-hide"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          <div className="flex px-4 space-x-2">
            {tools.map((tool) => {
              const Icon = tool.icon;
              return (
                <motion.div
                  key={tool.id}
                  whileHover={{ y: -2 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Button
                    variant={activeTool === tool.id ? "default" : "outline"}
                    size="sm"
                    className="flex flex-col items-center p-0 h-14 w-14"
                    onClick={() => handleToolClick(tool.id, tool.action)}
                  >
                    <Icon className="w-5 h-5 mb-1" />
                    <span className="text-xs">{tool.label}</span>
                  </Button>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Panneau d'options pour l'outil Couches */}
        {activeTool === 'layers' && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="absolute left-0 right-0 p-4 mb-2 bg-white border rounded-lg shadow-lg bottom-full dark:bg-slate-800 border-slate-200 dark:border-slate-700"
          >
            <h3 className="mb-3 font-semibold text-slate-800 dark:text-slate-200">Gestion des couches</h3>
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(activeLayers).map(([layer, isActive]) => (
                <div key={layer} className="flex items-center space-x-2">
                  <Toggle
                    pressed={isActive}
                    onPressedChange={() => toggleLayer(layer as keyof typeof activeLayers)}
                    size="sm"
                  >
                    {isActive ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                  </Toggle>
                  <span className="text-sm capitalize">
                    {layer === 'reseauHydro' ? 'Réseau hydro' : 
                     layer === 'voiesCommunication' ? 'Voies' : 
                     layer}
                  </span>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Panneau d'options pour l'outil Recherche */}
        {activeTool === 'search' && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="absolute left-0 right-0 p-4 mb-2 bg-white border rounded-lg shadow-lg bottom-full dark:bg-slate-800 border-slate-200 dark:border-slate-700"
          >
            <h3 className="mb-3 font-semibold text-slate-800 dark:text-slate-200">Options de recherche</h3>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <input type="checkbox" id="search-parcelles" defaultChecked className="rounded" />
                <label htmlFor="search-parcelles" className="text-sm">Rechercher dans les parcelles</label>
              </div>
              <div className="flex items-center space-x-2">
                <input type="checkbox" id="search-proprietaires" defaultChecked className="rounded" />
                <label htmlFor="search-proprietaires" className="text-sm">Rechercher dans les propriétaires</label>
              </div>
              <div className="flex items-center space-x-2">
                <input type="checkbox" id="search-communes" className="rounded" />
                <label htmlFor="search-communes" className="text-sm">Rechercher dans les communes</label>
              </div>
            </div>
          </motion.div>
        )}
      </div>

      {/* Styles pour masquer la scrollbar */}
      <style jsx>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
};

export default MapToolbar;