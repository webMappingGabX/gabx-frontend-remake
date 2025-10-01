import { useState, useRef, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { 
  Plus, 
  Minus, 
  Layers, 
  Compass, 
  Ruler, 
  Download,
  Search,
  Fullscreen
} from "lucide-react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Card, CardContent } from "../ui/card";
import { Toggle } from "../ui/toggle";
import { useToast } from "../../hooks/useToast";

import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useDispatch, useSelector } from "react-redux";
import { AvailableMenus, selectLayers, selectMenu, selectSearch } from "../../app/store/slices/settingSlice";
import FileMenu from "../menus/FileMenu";
import { deletePlot, fetchPlots, selectPlots, setCurrentPlot, type Plot } from "../../app/store/slices/plotSlice";
import { isFulfilled } from "@reduxjs/toolkit";
import { useNavigate } from "react-router-dom";
import EditionMenu from "../menus/EditionMenu";
import ConfirmDialog from "../dialogs/ConfirmDialog";

// Import Turf.js pour les calculs géospatiaux
import * as turf from "@turf/turf";
import ViewMenu from "../menus/ViewMenu";
import ExportMenu from "../menus/ExportMenu";

// Icônes personnalisées pour Leaflet (important pour le bon affichage)
delete (L.Icon.Default.prototype as { _getIconUrl?: string })._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Types pour les données géospatiales
interface Parcelle {
  id: string;
  nom: string;
  superficie: number;
  coordinates: [number, number][];
  type: string;
  proprietaire: string;
}

interface Intersection {
  polygon1: any;
  polygon2: any;
  intersection: any;
  area: number;
  id: string;
}

interface MapViewport {
  center: [number, number];
  zoom: number;
}

const Map2D = () => {
  const [viewport, setViewport] = useState<MapViewport>({
    center: [3.868177, 11.519596],
    zoom: 16
  });
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [selectedParcelle, setSelectedParcelle] = useState<Parcelle | null>(null);
  const [selectedIntersection, setSelectedIntersection] = useState<Intersection | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [confirmPopupVisible, setConfirmPopupVisible] = useState(false);
  const [activeLayers, setActiveLayers] = useState({
    parcelles: true,
    limites: true,
    batiments: false,
    reseau: false,
    intersections: true // Nouvelle couche pour les intersections
  });
  const [intersections, setIntersections] = useState<Intersection[]>([]);
  const { toast } = useToast();

  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<L.Map | null>(null);
  const [parcelleLayers, setParcelleLayers] = useState<L.LayerGroup | null>(null);
  const [intersectionLayers, setIntersectionLayers] = useState<L.LayerGroup | null>(null);

  const dispatch = useDispatch();
  const isSearchActive = useSelector(selectSearch);
  const isLayersActive = useSelector(selectLayers);
  const currentOpenedMenu = useSelector(selectMenu);
  const selectedPlots = useSelector(selectPlots);

  const navigate = useNavigate();
  const [parcelles, setParcelles] = useState<Parcelle[]>([
    {
      id: "YDE-001",
      nom: "Parcelle Bastos",
      superficie: 4.5,
      coordinates: [
        [3.8700, 11.5200],
        [3.8720, 11.5200],
        [3.8720, 11.5180],
        [3.8700, 11.5180]
      ],
      type: "Résidentielle",
      proprietaire: "Jean Mvondo"
    },
    {
      id: "YDE-002",
      nom: "Parcelle Mvog Ada",
      superficie: 3.2,
      coordinates: [
        [3.8660, 11.5220],
        [3.8680, 11.5220],
        [3.8680, 11.5200],
        [3.8660, 11.5200]
      ],
      type: "Commerciale",
      proprietaire: "Aminatou Oumarou"
    }
  ]);

  const multiStyle = {
    color: '#f59e42',
    weight: 2,
    fillColor: '#f59e42',
    fillOpacity: 0.2
  };

  const uniStyle = {
    color: '#10b981',
    weight: 2,
    fillColor: '#10b981',
    fillOpacity: 0.2
  };

  const intersectionStyle = {
    color: "red",
    weight: 2,
    fillColor: "red",
    fillOpacity: 0.4,
  };

  const selectionStyle = {
    color: "#3b82f6",
    weight: 2,
    fillColor: "#3b82f6",
    fillOpacity: 0.2,
  };

  const intersectionSelectionStyle = {
    color: "#3b82f6",
    weight: 2,
    fillColor: "#3b82f6",
    fillOpacity: 0.2,
  };

  // Fonction pour calculer les intersections
  const calculateIntersections = () => {
    if (!parcelleLayers) return;

    const layers = parcelleLayers.getLayers();
    const polygons = layers.filter(layer => layer instanceof L.Polygon) as L.Polygon[];
    const intersectionsList: Intersection[] = [];

    //console.log("PARCELLE LAYERS", parcelleLayers, "LAYERS", layers);
    
    // Parcourir toutes les paires de polygones
    for (let i = 0; i < polygons.length; i++) {
      for (let j = i + 1; j < polygons.length; j++) {
        const polygon1 = polygons[i];
        const polygon2 = polygons[j];

        // Convertir les polygones Leaflet en GeoJSON
        const geoJSON1 = polygon1.toGeoJSON();
        const geoJSON2 = polygon2.toGeoJSON();
        
        //console.log("geoJSON1", geoJSON1, "geoJSON2", geoJSON2);
        
        // Vérifier que les géométries sont valides
        if (turf.booleanValid(geoJSON1) && turf.booleanValid(geoJSON2)) {
          // Calculer l'intersection
          //const intersection = turf.intersect(geoJSON1, geoJSON2);
          const intersection = turf.intersect(turf.featureCollection([ geoJSON1, geoJSON2 ]));

          if (intersection) {
            // Calculer la surface de l'intersection
            const area = turf.area(intersection);
            intersectionsList.push({
              polygon1: geoJSON1,
              polygon2: geoJSON2,
              intersection,
              area,
              id: `intersection-${i}-${j}`
            });
          }
        }
      }
    }

    setIntersections(intersectionsList);
    console.log("Intersections calculées:", intersectionsList);
  };

  // Fonction pour afficher les intersections sur la carte
  const displayIntersections = () => {
    if (!intersectionLayers || !mapInstance.current) return;

    // Nettoyer les layers existants
    intersectionLayers.clearLayers();

    if (!activeLayers.intersections) return;

    // Ajouter chaque intersection comme polygone
    intersections.forEach((intersection) => {
      /*const intersectionLayer = L.geoJSON(intersection.intersection, {
        style: intersectionStyle
      });*/
      const finalStyle = selectedIntersection?.id === intersection.id ? intersectionSelectionStyle : intersectionStyle;
      const intersectionLayer = L.geoJSON(intersection.intersection, {
        style: finalStyle
      });

      // Ajouter un popup à l'intersection
      /*intersectionLayer.bindPopup(`
        <div>
          <h3 class="font-bold text-red-600">Empiètement détecté</h3>
          <p><strong>Surface :</strong> ${intersection.area.toFixed(2)} m²</p>
          <p><strong>Polygones concernés :</strong> 2 parcelles</p>
          <button onclick="window.dispatchEvent(new CustomEvent('selectIntersection', { detail: '${intersection.id}' }))" 
                  class="mt-2 px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm">
            Voir les détails
          </button>
        </div>
      `);*/

      // Gestionnaire de clic pour sélectionner l'intersection
      intersectionLayer.on('click', () => {
        setSelectedIntersection(intersection);
        setSelectedParcelle(null); // Désélectionner la parcelle si une intersection est sélectionnée
      });

      intersectionLayer.addTo(intersectionLayers);
    });
  };

  // Écouter l'événement personnalisé pour sélectionner une intersection
  useEffect(() => {
    const handleSelectIntersection = (event: CustomEvent) => {
      const intersectionId = event.detail;
      const intersection = intersections.find(i => i.id === intersectionId);
      if (intersection) {
        setSelectedIntersection(intersection);
        setSelectedParcelle(null);
      }
    };

    window.addEventListener('selectIntersection', handleSelectIntersection as EventListener);
    
    return () => {
      window.removeEventListener('selectIntersection', handleSelectIntersection as EventListener);
    };
  }, [intersections]);

  // Initialisation de la carte Leaflet
  useEffect(() => {
    if (mapRef.current && !mapInstance.current) {
      // Création de l'instance de carte Leaflet
      mapInstance.current = L.map(mapRef.current, {
        zoomControl: false
      }).setView(
        [viewport.center[0], viewport.center[1]], 
        viewport.zoom
      );
      
      // Ajout de la couche tuiles OpenStreetMap
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      }).addTo(mapInstance.current);
      
      // Création d'un groupe de layers pour les parcelles
      const layerGroup = L.layerGroup().addTo(mapInstance.current);
      setParcelleLayers(layerGroup);

      // Création d'un groupe de layers pour les intersections
      const intersectionGroup = L.layerGroup().addTo(mapInstance.current);
      setIntersectionLayers(intersectionGroup);
      
      // Gestionnaire d'événements pour les mouvements de carte
      mapInstance.current.on('move', () => {
        if (mapInstance.current) {
          const center = mapInstance.current.getCenter();
          const zoom = mapInstance.current.getZoom();
          setViewport({
            center: [center.lat, center.lng],
            zoom: zoom
          });
        }
      });
    }
    
    return () => {
      if (mapInstance.current) {
        mapInstance.current.remove();
        mapInstance.current = null;
      }
    };
  }, []);
  
  useEffect(() => {
    const fetchAndFilterPlots = async () => {
      const getPlotsResponses = await dispatch(fetchPlots({ search: searchQuery }));
      console.log("GET PLOT RESPONSE", getPlotsResponses);
      if(getPlotsResponses.type.includes("fulfilled")) {
        console.log("FULLFILLED PLOTS");
      }
    }

    fetchAndFilterPlots();
  }, [searchQuery]);

  // Mettre à jour les parcelles et calculer les intersections
  useEffect(() => {
    if (!mapInstance.current || !parcelleLayers) return;
    
    // Nettoyer les layers existants
    parcelleLayers.clearLayers();
    
    // Ajouter chaque parcelle comme polygone
    parcelles.forEach(parcelle => {
      /*const polygon = L.polygon(parcelle.coordinates, {
        color: selectedParcelle?.id === parcelle.id ? '#3b82f6' : '#10b981',
        weight: 2,
        fillColor: selectedParcelle?.id === parcelle.id ? '#3b82f6' : '#10b981',
        fillOpacity: 0.2
      });*/

      const finalStyle = selectedParcelle?.id === parcelle.id ? selectionStyle : uniStyle;
      const polygon = L.polygon(parcelle.coordinates, finalStyle);
      
      // Ajouter un popup au polygone
      polygon.bindPopup(`
        <div>
          <h3 class="font-bold">${parcelle.nom}</h3>
          <p>ID: ${parcelle.id}</p>
          <p>Superficie: ${parcelle.superficie} ha</p>
          <p>Type: ${parcelle.type}</p>
          <p>Propriétaire: ${parcelle.proprietaire}</p>
        </div>
      `);
      
      // Gestionnaire de clic
      polygon.on('click', () => {
        setSelectedParcelle(parcelle);
        setSelectedIntersection(null); // Désélectionner l'intersection si une parcelle est sélectionnée
      });
      
      polygon.addTo(parcelleLayers);
    });

    // Calculer les intersections après un délai pour s'assurer que les polygones sont rendus
    setTimeout(() => {
      calculateIntersections();
    }, 100);

  }, [parcelles, selectedParcelle, parcelleLayers]);

  useEffect(() => {
    const importsPlots : any[] = [];
    selectedPlots?.forEach((plot) => {
        // Get geometries in plot
        plot?.geom?.geometries?.forEach((geom) => {
          if (geom.type.toLowerCase() === "multipolygon") {
            geom.coordinates.forEach((polygonCoords: any) => {
              const latlngs = polygonCoords.map((ring: any) =>
                ring.map((coord: any) => [coord[1], coord[0]])
              );
              const instance = {
                ...plot,
                coordinates: latlngs
              }
              importsPlots.push(instance);
            });
          } else if (geom.type.toLowerCase() === "polygon") {
            const latlngs = geom.coordinates.map((ring: any) => ring.map((coord: any) => [coord[1], coord[0]]));
            // const polygon = L.polygon(latlngs, uniStyle);

            const instance = {
              ...plot,
              coordinates: latlngs
            }
            
            console.log("----------> INTEGRATE POLYGON");
            importsPlots.push(instance);
          } else if (geom.type.toLowerCase() === "multilinestring") {
              geom.coordinates.forEach((lineCoord: any) => {
                const latlngs = lineCoord.map((coord: any) => [coord[1], coord[0]]);

                const line = L.polyline(latlngs, multiStyle);
                
                //line.addTo(parcelleLayers);
              });
          } else if (geom.type.toLowerCase() === "linestring") {
              const latlngs = geom.coordinates.map((coord: any) => [coord[1], coord[0]]);
              console.log("LINE LATLONG", latlngs, "GEOM", geom);
              const line = L.polyline(latlngs, multiStyle);
              
              //line.addTo(parcelleLayers);
              //importsPlots.push(line);
          } else if (geom.type.toLowerCase() === "multipoint") {
            geom.coordinates.forEach((coord: any) => {
              const latlng = [coord[1], coord[0]];
              const marker = L.marker(latlng, { icon: L.icon({ iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png', iconSize: [25, 41], iconAnchor: [12, 41] }) });
              
              // marker.addTo(parcelleLayers);
            })
          } else if (geom.type.toLowerCase() === "point") {
            const coord = geom.coordinates;
            const latlng = [coord[1], coord[0]];
            const marker = L.marker(latlng, { icon: L.icon({ iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png', iconSize: [25, 41], iconAnchor: [12, 41] }) });
            
            // marker.addTo(parcelleLayers);
        } else {
          throw new Error("Unsupported geometry type: " + geom.type);
        }
        });
    });

    setParcelles([
      ...importsPlots
    ])

  }, [selectedPlots]);
  
  // Afficher les intersections quand elles changent ou quand la couche est activée/désactivée
  useEffect(() => {
    displayIntersections();
  }, [intersections, activeLayers.intersections, intersectionLayers]);

  // Gestion de la visibilité des couches
  useEffect(() => {
    if (!parcelleLayers || !intersectionLayers) return;
    
    if (activeLayers.parcelles) {
      mapInstance.current?.addLayer(parcelleLayers);
    } else {
      mapInstance.current?.removeLayer(parcelleLayers);
    }

    if (activeLayers.intersections) {
      mapInstance.current?.addLayer(intersectionLayers);
    } else {
      mapInstance.current?.removeLayer(intersectionLayers);
    }
  }, [activeLayers.parcelles, activeLayers.intersections, parcelleLayers, intersectionLayers]);

  // Fonction pour trouver les parcelles impliquées dans une intersection
  const findParcellesInIntersection = (intersection: Intersection) => {
    console.log("IN FIND SELECTED INTERSECTION", intersection);

    // Helper to normalize type for comparison
    const normalizeType = (type: string) =>
      type.toLowerCase() === "polygon" || type.toLowerCase() === "multipolygon"
        ? "multipolygon"
        : type.toLowerCase();

    // Helper to normalize coordinates for comparison
    const normalizeCoordinates = (type: string, coordinates: any) => {
      if (type.toLowerCase() === "polygon") {
        return [coordinates];
      }
      return coordinates;
    };

    // Helper to extract all polygons/multipolygons from a geometry collection
    const extractPolygonsFromGeometryCollection = (geometryCollection: any) => {
      if (
        geometryCollection &&
        geometryCollection.type &&
        geometryCollection.type.toLowerCase() === "geometrycollection"
      ) {
        return geometryCollection.geometries
          .filter(
            (g: any) =>
              g.type.toLowerCase() === "polygon" ||
              g.type.toLowerCase() === "multipolygon"
          )
          .map((g: any) => ({
            type: normalizeType(g.type),
            coordinates: normalizeCoordinates(g.type, g.coordinates),
          }));
      }
      return [];
    };

    // Helper to check if a geometry matches a target geometry (type + coordinates)
    const geometryMatches = (
      gType: string,
      gCoords: any,
      targetType: string,
      targetCoords: any
    ) => {
      return (
        normalizeType(gType) === normalizeType(targetType) &&
        JSON.stringify(normalizeCoordinates(gType, gCoords)) ===
          JSON.stringify(normalizeCoordinates(targetType, targetCoords))
      );
    };

    // Find parcelle1
    const parcelle1 = parcelles.find((p) => {
      // If p is a geometry collection, check all polygons/multipolygons inside
      if (
        p.geom &&
        p.geom.type &&
        p.geom.type.toLowerCase() === "geometrycollection"
      ) {
        const polygons = extractPolygonsFromGeometryCollection(p.geom);
        const iType = normalizeType(intersection.polygon1.geometry.type);
        
        const iCoords = normalizeCoordinates(
          intersection.polygon1.geometry.type,
          intersection.polygon1.geometry.coordinates
        );

        //console.log("EXTRACTED POLYGONS", polygons, "iType", iType, "iCoords", iCoords);
        
        return polygons.some((poly: any) =>
          geometryMatches(poly.type, poly.coordinates, iType, iCoords)
        );
      } else {
        // Fallback to old logic for non-geometrycollection
        const pType = normalizeType(p.type);
        const iType = normalizeType(intersection.polygon1.geometry.type);
        const pCoords = normalizeCoordinates(p.type, p.coordinates);
        const iCoords = normalizeCoordinates(
          intersection.polygon1.geometry.type,
          intersection.polygon1.geometry.coordinates
        );
        return pType === iType && JSON.stringify(pCoords) === JSON.stringify(iCoords);
      }
    });

    // Find parcelle2
    const parcelle2 = parcelles.find((p) => {
      if (
        p.geom &&
        p.geom.type &&
        p.geom.type.toLowerCase() === "geometrycollection"
      ) {
        const polygons = extractPolygonsFromGeometryCollection(p.geom);
        const iType = normalizeType(intersection.polygon2.geometry.type);
        const iCoords = normalizeCoordinates(
          intersection.polygon2.geometry.type,
          intersection.polygon2.geometry.coordinates
        );
        return polygons.some((poly: any) =>
          geometryMatches(poly.type, poly.coordinates, iType, iCoords)
        );
      } else {
        const pType = normalizeType(p.type);
        const iType = normalizeType(intersection.polygon2.geometry.type);
        const pCoords = normalizeCoordinates(p.type, p.coordinates);
        const iCoords = normalizeCoordinates(
          intersection.polygon2.geometry.type,
          intersection.polygon2.geometry.coordinates
        );
        return pType === iType && JSON.stringify(pCoords) === JSON.stringify(iCoords);
      }
    });

    return { parcelle1, parcelle2 };
  };

  // Gestion du plein écran
  const toggleFullscreen = () => {
    if (!document.fullscreenElement && mapRef.current) {
      mapRef.current.requestFullscreen().catch(err => {
        console.error('Erreur lors du passage en plein écran:', err);
      });
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
        setIsFullscreen(false);
      }
    }
  };

  // Gestion des événements de plein écran
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  useEffect(() => {
    if (!parcelleLayers) return;
    
    if (activeLayers.parcelles) {
      mapInstance.current?.addLayer(parcelleLayers);
    } else {
      mapInstance.current?.removeLayer(parcelleLayers);
    }
  }, [activeLayers.parcelles, parcelleLayers]);
  
  useEffect(() => {
    console.log("SELECTED PARCELLE CHANGE", selectedParcelle);
  }, [selectedParcelle]);
  
  // Zoom avant
  const zoomIn = () => {
    if (mapInstance.current) {
      mapInstance.current.zoomIn();
    }
  };

  // Zoom arrière
  const zoomOut = () => {
    if (mapInstance.current) {
      mapInstance.current.zoomOut();
    }
  };

  // Recentrer la carte sur Libreville
  const resetView = () => {
    if (mapInstance.current) {
      mapInstance.current.setView([3.868177, 11.519596], 12);
    }
  };

  // Recherche de parcelles (avec animation vers la parcelle)
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const found = parcelles.find(p => 
      p.nom.toLowerCase().includes(searchQuery.toLowerCase()) || 
      p.id === searchQuery
    );
    
    if (found && mapInstance.current) {
      // Centrer la carte sur la parcelle trouvée
      const centerLatLng = [found.coordinates[0][0], found.coordinates[0][1]] as [number, number];
      mapInstance.current.flyTo(centerLatLng, 15);
      
      setSelectedParcelle(found);
      toast({
        title: "Parcelle trouvée",
        description: `Parcelle ${found.nom} sélectionnée.`
      });
    } else {
      toast({
        title: "Aucun résultat",
        description: "Aucune parcelle ne correspond à votre recherche.",
        variant: "destructive"
      });
    }
  };

  // Supprimer une parcelle selectionnee
  const handleDeletePlot = async () => {
    try {
      if(selectedParcelle)
      {
        const response = await dispatch(deletePlot(selectedParcelle.code));
  
        console.log("DELETE RESPONSE", response);
        if(response.type.includes("fulfilled"))
        {
          setConfirmPopupVisible(false);
          setSelectedParcelle(null);
          toast({
            title: "Parcelle supprimée",
            description: `01 parcelle supprimée avec succès`
          });
        } else {
          setConfirmPopupVisible(false);
          toast({
            title: "Echec de la suppression de la parcelle",
            description: `Une erreur innatendue s'est produite pendant la tentative de suppression de la parcelle`
          });
        }
      }
    } catch (err) {
      console.log("ERROR DELETING PLOT", err);

      setConfirmPopupVisible(false);
      toast({
        title: "Echec de la suppression de la parcelle",
        description: `Une erreur innatendue s'est produite pendant la tentative de suppression de la parcelle`
      });
    }
  }
  
  return (
    <div className="relative w-full h-full overflow-hidden bg-slate-100 dark:bg-slate-900">
      {/* Conteneur principal de la carte Leaflet */}
      <div 
        ref={mapRef} 
        className="z-0 w-full h-full"
      />

      {/* ConfirmDialog */}
      <ConfirmDialog 
        isOpen={confirmPopupVisible}
        onClose={() => {
          setConfirmPopupVisible(false);
          setSelectedParcelle(null);
        }}
        onConfirm={() => handleDeletePlot()}
        title="Confirmation de suppression"
        description={`Etes-vous sur de vouloir supprimer cette parcelle`}
        variant="destructive"
        isLoading={false}
      />

      {/* Overlay d'information de la parcelle sélectionnée */}
      {selectedParcelle && (
        <motion.div
          initial={{ opacity: 0, y: 100 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute z-[1000] max-w-sm top-14 left-4"
        >
          <Card className="py-2">
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-lg font-bold">{selectedParcelle.nom}</h3>
                  <p className="pb-2 text-sm text-slate-600 dark:text-slate-400">
                    CODE: {selectedParcelle.code} | {selectedParcelle.area} ha
                  </p>
                  <p className="text-sm">Titre foncié: {selectedParcelle.TFnumber != null ? selectedParcelle.TFnumber : "Non spécifié"}</p>
                  <p className="text-sm">Prix: {selectedParcelle.price | 0} XAF</p>
                  <p className="text-sm">Lieu: {selectedParcelle.place != null ? selectedParcelle.place : "Non spécifié"}</p>
                  <p className="text-sm">Année d'acquisition : {selectedParcelle.acquiredYear != null ? selectedParcelle.acquiredYear : "Non spécifiée"}</p>
                  <p className="text-sm">Cité : {selectedParcelle.housingEstate != null ? selectedParcelle.housingEstate.name : "Aucune"}</p>
                  
                  
                  {selectedParcelle.region != null ? (
                    <ul className="p-2 list-none rounded bg-green-500/15">
                      <li className="text-sm">Région : {selectedParcelle.region.name}</li>
                      <li className="text-sm">Département : {selectedParcelle.department != null ? selectedParcelle.department.name : "Non spécifié"}</li>
                      <li className="text-sm">Arrondissement : {selectedParcelle.arrondissement != null ? selectedParcelle.arrondissement.name : "Non spécifié"}</li>
                    </ul>
                  ) : (
                    <div className="p-2 text-sm rounded bg-green-500/15">
                      Localisation non spécifiée
                    </div>
                  )}
                </div>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setSelectedParcelle(null)}
                >
                  ×
                </Button>
              </div>
              <div className="flex gap-2 mt-3">
                {/* <Button size="sm" variant="outline">Modifier la géométrie</Button> */}
                <Button size="sm" className="cursor-pointer" onClick={() => {
                  dispatch(setCurrentPlot(selectedParcelle));
                  
                  //navigate("/map/plot-edition", { state: { plotId: selectedParcelle.id } });
                  navigate("/map/plot-edition", { state: { editingMode: true } });
                }}>Modifier les infos</Button>
                <Button size="sm" className="bg-red-400 cursor-pointer hover:bg-red-600" onClick={() => setConfirmPopupVisible(true)}>
                  Supprimer
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Overlay d'information de l'intersection sélectionnée */}
      {selectedIntersection && (
        <motion.div
          initial={{ opacity: 0, y: 100 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute z-[1000] max-w-md top-14 left-4"
        >
          <Card className="py-2 border-red-300 bg-red-50">
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-lg font-bold text-red-700">Empiètement détecté</h3>
                  <p className="pb-2 text-sm text-slate-600 dark:text-slate-400">
                    Surface de l'empiètement: <strong>{selectedIntersection.area.toFixed(2)} m²</strong>
                  </p>
                  
                  <div className="mt-3">
                    <h4 className="font-semibold text-red-600">Parcelles concernées:</h4>
                    {(() => {
                      const { parcelle1, parcelle2 } = findParcellesInIntersection(selectedIntersection);
                      console.log("FOUND PLOTS", parcelle1, parcelle2);
                      return (
                        <div className="mt-2 space-y-2">
                          {parcelle1 && (
                            <div className="p-2 bg-white border rounded">
                              <p><strong>Parcelle 1:</strong> {parcelle1.nom}</p>
                              <p className="text-sm">ID: {parcelle1.id} | Superficie: {parcelle1.superficie} ha</p>
                              <p className="text-sm">Propriétaire: {parcelle1.proprietaire}</p>
                            </div>
                          )}
                          {parcelle2 && (
                            <div className="p-2 bg-white border rounded">
                              <p><strong>Parcelle 2:</strong> {parcelle2.nom}</p>
                              <p className="text-sm">ID: {parcelle2.id} | Superficie: {parcelle2.superficie} ha</p>
                              <p className="text-sm">Propriétaire: {parcelle2.proprietaire}</p>
                            </div>
                          )}
                        </div>
                      );
                    })()}
                  </div>
                </div>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setSelectedIntersection(null)}
                >
                  ×
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Contrôles de zoom */}
      <div className="absolute z-[1000] flex flex-col gap-2 right-4 bottom-4">
        <Button onClick={zoomIn} size="icon" className="rounded-full">
          <Plus className="w-4 h-4" />
        </Button>
        <Button onClick={zoomOut} size="icon" className="rounded-full">
          <Minus className="w-4 h-4" />
        </Button>
      </div>

      {/* Barre d'outils principale */}
      <div className="absolute z-[1000] flex flex-col gap-2 top-14 right-4">
        <Button onClick={toggleFullscreen} size="icon" variant="outline">
          <Fullscreen className="w-4 h-4" />
        </Button>
        <Button onClick={resetView} size="icon" variant="outline">
          <Compass className="w-4 h-4" />
        </Button>
      </div>

      {/* Barre de recherche */}
      <AnimatePresence>
        {isSearchActive && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0}}
            className="absolute z-[1000] transform -translate-x-1/2 top-4 left-1/2 md:w-80 w-5/6">
            <form onSubmit={handleSearch} className="flex gap-2">
              <Input
                placeholder="Rechercher..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-white/90 dark:bg-slate-800/90"
              />
              <Button type="submit" size="icon">
                <Search className="w-4 h-4" />
              </Button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Contrôles de couches */}
      <AnimatePresence>
        {isLayersActive && (
          <motion.div 
            initial={{ opacity: 0, y: 100 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 100 }}
            className="absolute z-[1000] left-4 top-14"
          >
            <Card className="py-1">
              <CardContent className="p-3">
                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <span className="mr-4 text-sm font-medium">Parcelles</span>
                    <Toggle
                      pressed={activeLayers.parcelles}
                      onPressedChange={(pressed) => setActiveLayers({...activeLayers, parcelles: pressed})}
                      size="sm"
                    >
                      <Layers className="w-4 h-4" />
                    </Toggle>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="mr-4 text-sm font-medium">Limites</span>
                    <Toggle
                      pressed={activeLayers.limites}
                      onPressedChange={(pressed) => setActiveLayers({...activeLayers, limites: pressed})}
                      size="sm"
                    >
                      <Layers className="w-4 h-4" />
                    </Toggle>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="mr-4 text-sm font-medium">Empiètements</span>
                    <Toggle
                      pressed={activeLayers.intersections}
                      onPressedChange={(pressed) => setActiveLayers({...activeLayers, intersections: pressed})}
                      size="sm"
                    >
                      <Layers className="w-4 h-4" />
                    </Toggle>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Menu Fichier */}
      { currentOpenedMenu === AvailableMenus.FILE ? (<FileMenu />) : null }
      
      {/* Menu edition */}
      { currentOpenedMenu === AvailableMenus.EDIT ? (<EditionMenu />) : null }

      {/* Menu vues */}
      { currentOpenedMenu === AvailableMenus.VIEW ? (<ViewMenu />) : null }

      {/* Menu exporter */}
      { currentOpenedMenu === AvailableMenus.EXPORT ? (<ExportMenu />) : null }
      
      {/* Indicateur de coordonnées */}
      <div className="absolute z-[1000] px-2 py-1 text-xs text-white rounded bottom-5 right-20 bg-black/70">
        {viewport.center[0].toFixed(4)}, {viewport.center[1].toFixed(4)} | Zoom: {viewport.zoom}
      </div>
    </div>
  );
};

export default Map2D;