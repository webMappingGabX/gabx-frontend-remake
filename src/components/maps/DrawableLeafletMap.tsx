import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet-draw/dist/leaflet.draw.css";
import "leaflet-draw";
import ConfirmDialog from "../dialogs/ConfirmDialog";
import { 
  MapPin, 
  Move, 
  Trash2, 
  X, 
  Square, 
  Triangle, 
  Eraser,
  HelpCircle,
  Navigation,
  ZoomIn,
  ZoomOut,
  RotateCcw
} from "lucide-react";
import { Button } from "../ui/button";
import { Card, CardContent } from "../ui/card";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "../ui/tooltip";
import { useSelector } from "react-redux";
import { selectCurrentPlot } from "../../app/store/slices/plotSlice";

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const DrawableLeafletMap = ({
  currentPlot
}) => {

  const [currentEditionPoint, setCurrentEditionPoint] = useState(null);
  const [currentEditionFig, setCurrentEditionFig] = useState(null);
  const [plotChange, setPlotChange] = useState(false);

  //const currentPlot = useSelector(selectCurrentPlot);

  // State for marker position
  const [markerPos, setMarkerPos] = useState(
    currentEditionPoint && Array.isArray(currentEditionPoint) && currentEditionPoint.length === 2
      ? { lat: currentEditionPoint[0], lng: currentEditionPoint[1] }
      : { lat: 0, lng: 0 }
  );

  // Ajout d'état pour la popup de confirmation et le message à afficher
  const [confirmPopupVisible, setConfirmPopupVisible] = useState(false);
  const [messagePopupVisible, setMessagePopupVisible] = useState(false);
  const [confirmPopupMessage, setConfirmPopupMessage] = useState("");
  const [entityToDelete, setEntityToDelete] = useState(null);
  const [showInstructions, setShowInstructions] = useState(false);

  const mapRef = useRef(null);
  const mapInstance = useRef(null);
  const drawControlRef = useRef(null);
  const selectedMarkerRef = useRef(null);
  const vertexMarkersRef = useRef([]);
  const geoJsonLayerRef = useRef(null);
  
  const fitMapToGeometry = (geometry) => {
    if (!geometry || !mapInstance.current) return;
    
    try {
      let bounds = null;
      
      switch (geometry.type) {
        case 'MultiPolygon':
          // Créer des bounds à partir de tous les polygones
          bounds = L.latLngBounds();
          geometry.coordinates.forEach(polygonCoords => {
            polygonCoords.forEach(ring => {
              ring.forEach(coord => {
                bounds.extend([coord[1], coord[0]]);
              });
            });
          });
          break;
          
        case 'Polygon':
          bounds = L.latLngBounds();
          geometry.coordinates[0].forEach(coord => {
            bounds.extend([coord[1], coord[0]]);
          });
          break;
          
        case 'MultiLineString':
          bounds = L.latLngBounds();
          geometry.coordinates.forEach(lineCoords => {
            lineCoords.forEach(coord => {
              bounds.extend([coord[1], coord[0]]);
            });
          });
          break;
          
        case 'LineString':
          bounds = L.latLngBounds(geometry.coordinates.map(coord => [coord[1], coord[0]]));
          break;
          
        case 'Point':
          // Pour un point, centrer avec un zoom par défaut
          mapInstance.current.setView([geometry.coordinates[1], geometry.coordinates[0]], 15);
          return;
          
        default:
          console.warn("Type de géométrie non supporté pour le centrage:", geometry.type);
          return;
      }
      
      // Vérifier que les bounds sont valides avant d'ajuster la vue
      if (bounds && bounds.isValid()) {
        mapInstance.current.fitBounds(bounds, { 
          maxZoom: 18,
          padding: [50, 50], // Padding pour mieux voir la géométrie
          duration: 1 // Animation douce
        });
      }
    } catch (error) {
      console.error("Erreur lors du centrage de la carte:", error);
    }
  };

  // Draw currentEditionFig on the map if present
  useEffect(() => {
    console.log("MAP INSTANCE", mapInstance, "CURRENT EDITION FIG", currentEditionFig);
    if (!mapInstance.current) return;

    if (currentEditionFig && mapInstance.current) {
      // Petit délai pour s'assurer que les layers sont bien ajoutés
      setTimeout(() => {
        fitMapToGeometry(currentEditionFig);
      }, 100);
    }

  }, [currentEditionFig]);

  /*useEffect(() => {
    // setCurrentEditionFig(currentPlot?.geom.geometries[0]);
    setCurrentEditionFig(currentPlot?.geom.geometries[0]);
  }, [currentPlot]);*/
  useEffect(() => {
    if (currentPlot?.geom) {
      let geometryToDisplay = null;
      
      if (currentPlot.geom.type === "GeometryCollection" && currentPlot.geom.geometries) {
        // Priorité des types de géométrie (du plus souhaité au moins souhaité)
        const priorityOrder = ["MultiPolygon", "Polygon", "MultiLineString", "LineString", "Point"];
        
        // Chercher dans l'ordre de priorité
        for (const geomType of priorityOrder) {
          const foundGeometry = currentPlot.geom.geometries.find(geom => geom.type === geomType);
          if (foundGeometry) {
            geometryToDisplay = foundGeometry;
            console.log(`Géométrie trouvée: ${geomType}`);
            break;
          }
        }
        
        // Si rien trouvé mais qu'il y a des géométries, prendre la première
        if (!geometryToDisplay && currentPlot.geom.geometries.length > 0) {
          geometryToDisplay = currentPlot.geom.geometries[0];
          console.warn("Aucune géométrie prioritaire trouvée, utilisation de:", geometryToDisplay.type);
        }
      } else {
        // Cas où geom n'est pas une GeometryCollection
        geometryToDisplay = currentPlot.geom;
      }
      
      setCurrentEditionFig(geometryToDisplay);
      setPlotChange(!plotChange);
    } else {
      setCurrentEditionFig(null);
    }
  }, [currentPlot]);
  
  // Fonction pour créer un marqueur de sommet
  const createVertexMarker = (latlng, parentLayer, index) => {
    const marker = L.circleMarker(latlng, { 
      radius: 6, 
      color: '#3B82F6', 
      fillColor: '#3B82F6',
      fillOpacity: 0.8,
      weight: 2,
      draggable: false // On gère le drag manuellement
    }).addTo(mapInstance?.current);
    
    marker.originalLatLng = latlng;
    marker.parentLayer = parentLayer;
    marker.vertexIndex = index;
    vertexMarkersRef.current.push(marker);
    
    // Gestion du clic sur le marqueur
    marker.on('click', (e) => {
      if (e.originalEvent) {
        e.originalEvent.stopPropagation();
      }
      selectMarker(marker);
    });

    // Gestion du drag and drop
    let isDragging = false;
    let dragStartPos = null;

    marker.on('mousedown', (e) => {
      if (e.originalEvent) {
        e.originalEvent.preventDefault();
        e.originalEvent.stopPropagation();
      }
      
      isDragging = false;
      dragStartPos = { x: e.originalEvent.clientX, y: e.originalEvent.clientY };
      
      // Désactiver le déplacement de la carte
      if (mapInstance.current) {
        mapInstance.current.dragging.disable();
        mapInstance.current.touchZoom.disable();
        mapInstance.current.doubleClickZoom.disable();
        mapInstance.current.scrollWheelZoom.disable();
        mapInstance.current.boxZoom.disable();
        mapInstance.current.keyboard.disable();
      }
      
      const onMouseMove = (moveEvent) => {
        moveEvent.preventDefault();
        moveEvent.stopPropagation();
        
        if (!isDragging) {
          const dx = moveEvent.clientX - dragStartPos.x;
          const dy = moveEvent.clientY - dragStartPos.y;
          if (Math.sqrt(dx * dx + dy * dy) > 5) {
            isDragging = true;
            selectMarker(marker);
          }
        }
        
        if (isDragging) {
          const containerPoint = mapInstance.current?.mouseEventToContainerPoint(moveEvent);
          const newLatLng = mapInstance.current?.containerPointToLatLng(containerPoint);
          
          // Mettre à jour la position du marqueur
          marker.setLatLng(newLatLng);
          
          // Mettre à jour la géométrie parent
          updateParentGeometry(marker, newLatLng);
          
          // Mettre à jour les coordonnées dans l'interface
          setMarkerPos({ lat: newLatLng.lat, lng: newLatLng.lng });
          setCurrentEditionPoint([newLatLng.lat, newLatLng.lng]);
        }
      };

      const onMouseUp = (upEvent) => {
        upEvent.preventDefault();
        upEvent.stopPropagation();
        
        // Réactiver le déplacement de la carte
        mapInstance.current.dragging.enable();
        mapInstance.current.touchZoom.enable();
        mapInstance.current.doubleClickZoom.enable();
        mapInstance.current.scrollWheelZoom.enable();
        mapInstance.current.boxZoom.enable();
        mapInstance.current.keyboard.enable();
        
        if (isDragging) {
          isDragging = false;
          marker.originalLatLng = marker.getLatLng();
        }
        
        document.removeEventListener('mousemove', onMouseMove);
        document.removeEventListener('mouseup', onMouseUp);
      };

      document.addEventListener('mousemove', onMouseMove);
      document.addEventListener('mouseup', onMouseUp);
    });

    return marker;
  };

  // Fonction pour sélectionner un marqueur
  const selectMarker = (marker) => {
    // Réinitialiser le style de l'ancien marqueur sélectionné
    if (selectedMarkerRef.current) {
      selectedMarkerRef.current.setStyle({
        radius: 6,
        color: '#3B82F6',
        fillColor: '#3B82F6',
        fillOpacity: 0.8,
        weight: 2
      });
    }
    
    // Mettre à jour le style du nouveau marqueur sélectionné
    marker.setStyle({
      radius: 8,
      color: '#EF4444',
      fillColor: '#FCA5A5',
      fillOpacity: 1,
      weight: 3
    });
    
    selectedMarkerRef.current = marker;
    const latlng = marker.getLatLng();
    setMarkerPos({ lat: latlng.lat, lng: latlng.lng });
    setCurrentEditionPoint([latlng.lat, latlng.lng]);
  };

  // Fonction pour mettre à jour currentEditionPoint après modification
  const updateCurrentEditionPoint = (layer) => {
    const latlngs = layer.getLatLngs();
    const points = Array.isArray(latlngs[0]) ? latlngs[0] : latlngs;
    const coordinates = points.map(point => [point.lng, point.lat]);
    
    if (layer instanceof L.Polygon) {
      coordinates.push(coordinates[0]); // Fermer le polygone
      setCurrentEditionFig({
        //type: "MultiPolygon",
        type: "Polygon",
        coordinates: [coordinates]
      });
    } else {
      setCurrentEditionFig({
        type: "LineString",
        coordinates: coordinates
      });
    }
  };

  // Fonction pour mettre à jour la géométrie parent
  const updateParentGeometry = (marker, newLatLng) => {
    const parentLayer = marker.parentLayer;
    if (parentLayer) {
      const latlngs = parentLayer.getLatLngs();
      const points = Array.isArray(latlngs[0]) ? latlngs[0] : latlngs;
      
      points[marker.vertexIndex] = newLatLng;
      parentLayer.setLatLngs(Array.isArray(latlngs[0]) ? [points] : points);
      
      updateCurrentEditionPoint(parentLayer);
    }
  };

  // Fonction pour recréer tous les marqueurs de sommet
  const recreateVertexMarkers = (parentLayer) => {
    // Supprimer les anciens marqueurs de cette couche
    vertexMarkersRef.current = vertexMarkersRef.current.filter(marker => {
      if (marker.parentLayer === parentLayer) {
        marker.remove();
        return false;
      }
      return true;
    });

    // Créer de nouveaux marqueurs
    const latlngs = parentLayer.getLatLngs();
    const points = Array.isArray(latlngs[0]) ? latlngs[0] : latlngs;
    points.forEach((latlng, index) => {
      createVertexMarker(latlng, parentLayer, index);
    });
  };

  // Fonction pour ajouter un point sur un segment
  const addPointOnSegment = (parentLayer, insertIndex, newPoint) => {
    const latlngs = parentLayer.getLatLngs();
    const points = Array.isArray(latlngs[0]) ? latlngs[0] : latlngs;
    
    // Insérer le nouveau point
    points.splice(insertIndex, 0, newPoint);
    
    // Mettre à jour la géométrie
    parentLayer.setLatLngs(Array.isArray(latlngs[0]) ? [points] : points);
    
    updateCurrentEditionPoint(parentLayer);
    
    // Recréer tous les marqueurs avec les nouveaux indices
    recreateVertexMarkers(parentLayer);
    
    // Sélectionner automatiquement le nouveau point
    setTimeout(() => {
      const newMarker = vertexMarkersRef.current.find(marker => 
        marker.parentLayer === parentLayer && marker.vertexIndex === insertIndex
      );
      if (newMarker) {
        selectMarker(newMarker);
      }
    }, 100);
  };

  // Fonction pour supprimer une entité (ligne ou polygone) entière
  const handleDeleteEntity = () => {
    if (entityToDelete && mapInstance.current) {
      // Supprimer la couche de la carte
      mapInstance.current.removeLayer(entityToDelete);
      // Supprimer tous les marqueurs associés à cette couche
      vertexMarkersRef.current = vertexMarkersRef.current.filter(marker => {
        if (marker.parentLayer === entityToDelete) {
          marker.remove();
          return false;
        }
        return true;
      });
      selectedMarkerRef.current = null;
      setEntityToDelete(null);
      setConfirmPopupVisible(false);
      setCurrentEditionPoint(null);
      setCurrentEditionFig(null);
      setMessagePopupVisible(true);
    }
  };

  // Fonction pour supprimer le point actif
  const handleDeleteActivePoint = () => {
    if (selectedMarkerRef.current) {
      const marker = selectedMarkerRef.current;
      const parentLayer = marker.parentLayer;

      if (parentLayer) {
        const latlngs = parentLayer.getLatLngs();
        const points = Array.isArray(latlngs[0]) ? latlngs[0] : latlngs;

        // Vérifier qu'il reste au moins 2 points pour une ligne ou 3 pour un polygone
        const isPolygon = parentLayer instanceof L.Polygon;
        const minPoints = isPolygon ? 3 : 2;
        if (points.length <= minPoints) {
          // Afficher la popup de confirmation pour supprimer toute la géométrie
          setEntityToDelete(parentLayer);
          setConfirmPopupMessage(
            isPolygon
              ? "Un polygone doit avoir au moins 3 points. Voulez-vous supprimer tout le polygone ?"
              : "Une ligne doit avoir au moins 2 points. Voulez-vous supprimer toute la ligne ?"
          );
          setConfirmPopupVisible(true);
          return;
        }

        // Supprimer le point
        points.splice(marker.vertexIndex, 1);
        parentLayer.setLatLngs(Array.isArray(latlngs[0]) ? [points] : points);

        updateCurrentEditionPoint(parentLayer);
        
        // Recréer tous les marqueurs
        recreateVertexMarkers(parentLayer);

        // Désélectionner le marqueur
        selectedMarkerRef.current = null;
        setMarkerPos({ lat: 3.868177, lng: 11.519596 });
        setCurrentEditionPoint(null);
      }
    }
  };

  useEffect(() => {
  if (!mapRef.current) return;

    // Initialiser la carte seulement une fois
    if (!mapInstance.current) {
      mapInstance.current = L.map(mapRef.current, {
        zoomControl: false
      }).setView([
        markerPos.lat == 0 ? 3.868177 : markerPos.lat, 
        markerPos.lng == 0 ? 11.519596 : markerPos.lng
      ], 12);

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      }).addTo(mapInstance.current);

      // **SECTION MODIFIÉE** : Charger currentEditionFig comme entité modifiable
      if (currentEditionFig) {
        try {
          // Fonction pour créer une couche Leaflet avec des marqueurs de sommets
          /* const createEditableLayer = (coordinates, type) => {
            const layers = [];
            
            coordinates.forEach((geomCoords, idx) => {
              let latlngs;
              if (type === 'MultiLineString') {
                latlngs = geomCoords.map(coord => L.latLng(coord[1], coord[0]));
              } else { // MultiPolygon
                // Pour chaque polygone, prendre la première ring (exterior) et ignorer les autres (holes)
                latlngs = geomCoords[0].map(coord => L.latLng(coord[1], coord[0]));
                // Ne pas inclure le dernier point qui est une répétition du premier
                latlngs = latlngs.slice(0, -1);
              }

              // Créer la couche Leaflet
              let leafletLayer;
              if (type === 'MultiLineString') {
                leafletLayer = L.polyline(latlngs, { 
                  color: '#3B82F6', 
                  weight: 3 
                }).addTo(mapInstance.current);
              } else {
                leafletLayer = L.polygon(latlngs, { 
                  color: '#3B82F6', 
                  weight: 3, 
                  fillOpacity: 0.2 
                }).addTo(mapInstance.current);
              }

              // Créer les marqueurs de sommets
              latlngs.forEach((latlng, index) => {
                createVertexMarker(latlng, leafletLayer, index);
              });

              // Ajouter la possibilité d'ajouter des points en cliquant sur les segments
              leafletLayer.on('click', function(e) {
                // Vérifier si le clic provient d'un marqueur de sommet
                const clickedOnVertex = vertexMarkersRef.current.some(marker => {
                  const markerLatLng = marker.getLatLng();
                  const clickLatLng = e.latlng;
                  const distance = Math.sqrt(
                    Math.pow(markerLatLng.lat - clickLatLng.lat, 2) + 
                    Math.pow(markerLatLng.lng - clickLatLng.lng, 2)
                  );
                  return distance < 0.001; // Seuil de tolérance
                });
                
                if (clickedOnVertex) return;
                
                if (e.originalEvent) {
                  e.originalEvent.stopPropagation();
                }
                
                const clickedPoint = e.latlng;
                const currentPoints = leafletLayer.getLatLngs();
                const points = Array.isArray(currentPoints[0]) ? currentPoints[0] : currentPoints;
                
                // Trouver le segment le plus proche du clic
                let minDistance = Infinity;
                let insertIndex = 1;
                let closestPointOnSegment = null;
                
                for (let i = 0; i < points.length; i++) {
                  const nextIndex = (i + 1) % points.length;
                  
                  if (type === 'MultiLineString' && nextIndex === 0) continue;
                  
                  const segmentStart = points[i];
                  const segmentEnd = points[nextIndex];
                  
                  const segmentVector = {
                    lat: segmentEnd.lat - segmentStart.lat,
                    lng: segmentEnd.lng - segmentStart.lng
                  };
                  
                  const clickVector = {
                    lat: clickedPoint.lat - segmentStart.lat,
                    lng: clickedPoint.lng - segmentStart.lng
                  };
                  
                  const segmentLengthSquared = segmentVector.lat * segmentVector.lat + segmentVector.lng * segmentVector.lng;
                  
                  if (segmentLengthSquared === 0) {
                    const distance = Math.sqrt(clickVector.lat * clickVector.lat + clickVector.lng * clickVector.lng);
                    if (distance < minDistance) {
                      minDistance = distance;
                      insertIndex = nextIndex;
                      closestPointOnSegment = segmentStart;
                    }
                    continue;
                  }
                  
                  const t = Math.max(0, Math.min(1, (clickVector.lat * segmentVector.lat + clickVector.lng * segmentVector.lng) / segmentLengthSquared));
                  
                  const closestPoint = {
                    lat: segmentStart.lat + t * segmentVector.lat,
                    lng: segmentStart.lng + t * segmentVector.lng
                  };
                  
                  const distance = Math.sqrt(
                    Math.pow(clickedPoint.lat - closestPoint.lat, 2) + 
                    Math.pow(clickedPoint.lng - closestPoint.lng, 2)
                  );
                  
                  if (distance < minDistance) {
                    minDistance = distance;
                    insertIndex = nextIndex;
                    closestPointOnSegment = closestPoint;
                  }
                }
                
                if (closestPointOnSegment) {
                  addPointOnSegment(leafletLayer, insertIndex, L.latLng(closestPointOnSegment.lat, closestPointOnSegment.lng));
                }
              });

              layers.push(leafletLayer);
            });

            return layers;
          }; */

          console.log("LOAD ON MAP");
          // Et dans la fonction createEditableLayer, ajoutez le support pour Point
          const createEditableLayer = (geometry) => {
            const layers = [];
            
            if (!geometry) {
              console.error("Aucune géométrie à afficher");
              return layers;
            } else console.log("I AM TRYING TO DRAW GEOMETRY", geometry);
            
            // Gérer différents types de géométrie
            switch (geometry.type) {
              case 'MultiPolygon':
                geometry.coordinates.forEach((polygonCoords, polygonIndex) => {
                  polygonCoords.forEach((ring, ringIndex) => {
                    if (ringIndex === 0) { // Anneau extérieur seulement
                      const latlngs = ring.map(coord => L.latLng(coord[1], coord[0]));
                      const leafletLayer = L.polygon(latlngs, { 
                        color: '#3B82F6', 
                        weight: 3, 
                        fillOpacity: 0.2 
                      }).addTo(mapInstance.current);

                      latlngs.forEach((latlng, index) => {
                        createVertexMarker(latlng, leafletLayer, index);
                      });

                      addSegmentClickHandler(leafletLayer, 'Polygon');
                      layers.push(leafletLayer);
                    }
                  });
                });
                break;
                
              case 'Polygon':
                const polyLatLngs = geometry.coordinates[0].map(coord => L.latLng(coord[1], coord[0]));
                const polyLayer = L.polygon(polyLatLngs, { 
                  color: '#3B82F6', 
                  weight: 3, 
                  fillOpacity: 0.2 
                }).addTo(mapInstance.current);

                polyLatLngs.forEach((latlng, index) => {
                  createVertexMarker(latlng, polyLayer, index);
                });

                addSegmentClickHandler(polyLayer, 'Polygon');
                layers.push(polyLayer);
                break;
                
              case 'MultiLineString':
                geometry.coordinates.forEach((lineCoords, lineIndex) => {
                  const latlngs = lineCoords.map(coord => L.latLng(coord[1], coord[0]));
                  const leafletLayer = L.polyline(latlngs, { 
                    color: '#3B82F6', 
                    weight: 3 
                  }).addTo(mapInstance.current);

                  latlngs.forEach((latlng, index) => {
                    createVertexMarker(latlng, leafletLayer, index);
                  });

                  addSegmentClickHandler(leafletLayer, 'LineString');
                  layers.push(leafletLayer);
                });
                break;
                
              case 'LineString':
                const lineLatLngs = geometry.coordinates.map(coord => L.latLng(coord[1], coord[0]));
                const lineLayer = L.polyline(lineLatLngs, { 
                  color: '#3B82F6', 
                  weight: 3 
                }).addTo(mapInstance.current);

                lineLatLngs.forEach((latlng, index) => {
                  createVertexMarker(latlng, lineLayer, index);
                });

                addSegmentClickHandler(lineLayer, 'LineString');
                layers.push(lineLayer);
                break;
                
              case 'Point':
                const pointLatLng = L.latLng(geometry.coordinates[1], geometry.coordinates[0]);
                const marker = L.marker(pointLatLng, {
                  icon: L.icon({
                    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
                    iconSize: [25, 41],
                    iconAnchor: [12, 41]
                  })
                }).addTo(mapInstance.current);
                
                // Pour les points, on peut créer un marqueur spécial éditable
                const circleMarker = L.circleMarker(pointLatLng, {
                  radius: 8,
                  color: '#3B82F6',
                  fillColor: '#3B82F6',
                  fillOpacity: 0.8,
                  weight: 2,
                  draggable: true
                }).addTo(mapInstance.current);
                
                circleMarker.parentLayer = circleMarker;
                circleMarker.vertexIndex = 0;
                
                circleMarker.on('drag', function(e) {
                  const newLatLng = e.target.getLatLng();
                  marker.setLatLng(newLatLng);
                  setMarkerPos({ lat: newLatLng.lat, lng: newLatLng.lng });
                  setCurrentEditionPoint([newLatLng.lat, newLatLng.lng]);
                });
                
                vertexMarkersRef.current.push(circleMarker);
                layers.push(circleMarker);
                layers.push(marker);
                break;
                
              default:
                console.warn("Type de géométrie non supporté:", geometry.type);
            }

            return layers;
          };

          // Créer les couches en fonction du type de géométrie
          let layers = [];
          if (currentEditionFig.type === 'MultiLineString') {
            // layers = createEditableLayer(currentEditionFig.coordinates, 'MultiLineString');
            layers = createEditableLayer(currentEditionFig);
          } else if (currentEditionFig.type === 'MultiPolygon') {
            console.log("LOAD MULTIPOLYGON");
            // layers = createEditableLayer(currentEditionFig.coordinates, 'MultiPolygon');
            layers = createEditableLayer(currentEditionFig);
          }

          // Stocker les couches créées
          geoJsonLayerRef.current = L.layerGroup(layers).addTo(mapInstance.current);
          
          fitMapToGeometry(currentEditionFig);
          // Ajuster la vue pour voir toutes les géométries
          /*if (geoJsonLayerRef.current.getBounds && geoJsonLayerRef.current.getBounds().isValid()) {
            mapInstance.current.fitBounds(geoJsonLayerRef.current.getBounds(), { maxZoom: 15 });
          }*/
        } catch (e) {
          console.log("ERROR ADDING current fig", e);
        }
      }

      // Initialiser les contrôles de dessin
      drawControlRef.current = new L.Control.Draw({
        draw: false,
        edit: false,
      });
      mapInstance.current.addControl(drawControlRef.current);

      mapInstance.current.on(L.Draw.Event.CREATED, function (e) {
        const layer = e.layer;
        layer.addTo(mapInstance.current);

        // Si c'est une ligne ou un polygone, on ajoute les marqueurs de sommet
        if (layer instanceof L.Polyline || layer instanceof L.Polygon) {
          const latlngs = layer.getLatLngs();
          const points = Array.isArray(latlngs[0]) ? latlngs[0] : latlngs;
          
          // Convertir en format GeoJSON
          const coordinates = points.map(point => [point.lng, point.lat]);
          
          if (layer instanceof L.Polygon) {
            // Pour un polygone, fermer la géométrie
            coordinates.push(coordinates[0]);
            setCurrentEditionFig({
              type: "Polygon",
              coordinates: [coordinates]
            });
          } else {
            // Pour une ligne
            setCurrentEditionFig({
              type: "LineString",
              coordinates: coordinates
            });
          }
          
          points.forEach((latlng, index) => {
            createVertexMarker(latlng, layer, index);
          });

          // Ajouter un gestionnaire de clic sur la ligne/polygone pour ajouter des points
          layer.on('click', function(e) {
            // Vérifier si le clic provient d'un marqueur de sommet
            const clickedOnVertex = vertexMarkersRef.current.some(marker => {
              const markerLatLng = marker.getLatLng();
              const clickLatLng = e.latlng;
              const distance = Math.sqrt(
                Math.pow(markerLatLng.lat - clickLatLng.lat, 2) + 
                Math.pow(markerLatLng.lng - clickLatLng.lng, 2)
              );
              return distance < 0.00001; // Seuil de tolérance
            });
            
            // Si le clic est sur un marqueur de sommet, ne pas ajouter de point
            if (clickedOnVertex) {
              return;
            }
            
            if (e.originalEvent) {
              e.originalEvent.stopPropagation();
            }
            
            const clickedPoint = e.latlng;
            const currentPoints = layer.getLatLngs();
            const points = Array.isArray(currentPoints[0]) ? currentPoints[0] : currentPoints;
            
            // Trouver le segment le plus proche du clic
            let minDistance = Infinity;
            let insertIndex = 1;
            let closestPointOnSegment = null;
            
            for (let i = 0; i < points.length; i++) {
              const nextIndex = (i + 1) % points.length;
              
              // Pour les lignes, ne pas considérer le segment de fermeture
              if (layer instanceof L.Polyline && nextIndex === 0) continue;
              
              const segmentStart = points[i];
              const segmentEnd = points[nextIndex];
              
              // Calculer le point le plus proche sur le segment
              const segmentVector = {
                lat: segmentEnd.lat - segmentStart.lat,
                lng: segmentEnd.lng - segmentStart.lng
              };
              
              const clickVector = {
                lat: clickedPoint.lat - segmentStart.lat,
                lng: clickedPoint.lng - segmentStart.lng
              };
              
              const segmentLengthSquared = segmentVector.lat * segmentVector.lat + segmentVector.lng * segmentVector.lng;
              
              if (segmentLengthSquared === 0) {
                // Le segment est un point
                const distance = Math.sqrt(clickVector.lat * clickVector.lat + clickVector.lng * clickVector.lng);
                if (distance < minDistance) {
                  minDistance = distance;
                  insertIndex = nextIndex;
                  closestPointOnSegment = segmentStart;
                }
                continue;
              }
              
              const t = Math.max(0, Math.min(1, (clickVector.lat * segmentVector.lat + clickVector.lng * segmentVector.lng) / segmentLengthSquared));
              
              const closestPoint = {
                lat: segmentStart.lat + t * segmentVector.lat,
                lng: segmentStart.lng + t * segmentVector.lng
              };
              
              const distance = Math.sqrt(
                Math.pow(clickedPoint.lat - closestPoint.lat, 2) + 
                Math.pow(clickedPoint.lng - closestPoint.lng, 2)
              );
              
              if (distance < minDistance) {
                minDistance = distance;
                insertIndex = nextIndex;
                closestPointOnSegment = closestPoint;
              }
            }
            
            // Ajouter le point sur le segment (utiliser le point projeté sur le segment)
            if (closestPointOnSegment) {
              addPointOnSegment(layer, insertIndex, L.latLng(closestPointOnSegment.lat, closestPointOnSegment.lng));
            }
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
    // eslint-disable-next-line
  }, [plotChange]);

  // Fonction helper pour ajouter le gestionnaire de clic sur les segments
  const addSegmentClickHandler = (layer, type) => {
    console.log("SEGMENT CLICKED VERTEX START");
    layer.on('click', function(e) {
      console.log("SEGMENT CLICKED VERTEX CLICKED HANDLER 0");
      // Vérifier si le clic provient d'un marqueur de sommet
      const clickedOnVertex = vertexMarkersRef.current.some(marker => {
        const markerLatLng = marker.getLatLng();
        const clickLatLng = e.latlng;
        const distance = Math.sqrt(
          Math.pow(markerLatLng.lat - clickLatLng.lat, 2) + 
          Math.pow(markerLatLng.lng - clickLatLng.lng, 2)
        );
        console.log("DISTANCE :", distance);
        //return distance < 0.001; // Seuil de tolérance
        return distance < 0.00001; // Seuil de tolérance
      });
      console.log("SEGMENT CLICKED VERTEX CLICKED HANDLER 1 : ", clickedOnVertex);
      // Si le clic est sur un marqueur de sommet, ne pas ajouter de point
      if (clickedOnVertex) {
        return;
      }
      console.log("SEGMENT CLICKED VERTEX CLICKED HANDLER");
      if (e.originalEvent) {
        e.originalEvent.stopPropagation();
      }
      
      const clickedPoint = e.latlng;
      const currentPoints = layer.getLatLngs();
      const points = Array.isArray(currentPoints[0]) ? currentPoints[0] : currentPoints;
      
      // Trouver le segment le plus proche du clic
      let minDistance = Infinity;
      let insertIndex = 1;
      let closestPointOnSegment = null;
      
      for (let i = 0; i < points.length; i++) {
        const nextIndex = (i + 1) % points.length;
        
        // Pour les lignes, ne pas considérer le segment de fermeture
        if (type === 'LineString' && nextIndex === 0) continue;
        
        const segmentStart = points[i];
        const segmentEnd = points[nextIndex];
        
        // Calculer le point le plus proche sur le segment
        const segmentVector = {
          lat: segmentEnd.lat - segmentStart.lat,
          lng: segmentEnd.lng - segmentStart.lng
        };
        
        const clickVector = {
          lat: clickedPoint.lat - segmentStart.lat,
          lng: clickedPoint.lng - segmentStart.lng
        };
        
        const segmentLengthSquared = segmentVector.lat * segmentVector.lat + segmentVector.lng * segmentVector.lng;
        
        if (segmentLengthSquared === 0) {
          // Le segment est un point
          const distance = Math.sqrt(clickVector.lat * clickVector.lat + clickVector.lng * clickVector.lng);
          if (distance < minDistance) {
            minDistance = distance;
            insertIndex = nextIndex;
            closestPointOnSegment = segmentStart;
          }
          continue;
        }
        
        // Calculer la projection du point cliqué sur le segment
        const t = Math.max(0, Math.min(1, (clickVector.lat * segmentVector.lat + clickVector.lng * segmentVector.lng) / segmentLengthSquared));
        
        const closestPoint = {
          lat: segmentStart.lat + t * segmentVector.lat,
          lng: segmentStart.lng + t * segmentVector.lng
        };
        
        // Calculer la distance entre le point cliqué et le point projeté
        const distance = Math.sqrt(
          Math.pow(clickedPoint.lat - closestPoint.lat, 2) + 
          Math.pow(clickedPoint.lng - closestPoint.lng, 2)
        );
        
        if (distance < minDistance) {
          minDistance = distance;
          insertIndex = nextIndex;
          closestPointOnSegment = closestPoint;
        }
      }
      
      console.log("SEGMENT CLICKED VERTEX END");
      // Ajouter le point sur le segment (utiliser le point projeté sur le segment)
      if (closestPointOnSegment) {
        console.log("NEW VERTEX");
        addPointOnSegment(layer, insertIndex, L.latLng(closestPointOnSegment.lat, closestPointOnSegment.lng));
      }
    });
  };

  // Fonction pour calculer la distance d'un point à un segment (fallback si L.GeometryUtil n'est pas disponible)
  const calculateDistanceToSegment = (point, segmentStart, segmentEnd) => {
    const A = point.lat - segmentStart.lat;
    const B = point.lng - segmentStart.lng;
    const C = segmentEnd.lat - segmentStart.lat;
    const D = segmentEnd.lng - segmentStart.lng;

    const dot = A * C + B * D;
    const lenSq = C * C + D * D;
    
    if (lenSq === 0) {
      return Math.sqrt(A * A + B * B);
    }
    
    const param = dot / lenSq;
    let xx, yy;
    
    if (param < 0) {
      xx = segmentStart.lat;
      yy = segmentStart.lng;
    } else if (param > 1) {
      xx = segmentEnd.lat;
      yy = segmentEnd.lng;
    } else {
      xx = segmentStart.lat + param * C;
      yy = segmentStart.lng + param * D;
    }
    
    const dx = point.lat - xx;
    const dy = point.lng - yy;
    return Math.sqrt(dx * dx + dy * dy);
  };

  // Effet séparé pour mettre à jour la position du marqueur sans recréer la carte
  useEffect(() => {
    if (currentEditionPoint && Array.isArray(currentEditionPoint) && currentEditionPoint.length === 2) {
      setMarkerPos({ lat: currentEditionPoint[0], lng: currentEditionPoint[1] });
    }
  }, [currentEditionPoint]);

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    const newMarkerPos = {
      ...markerPos,
      [name]: parseFloat(value)
    };
    setMarkerPos(newMarkerPos);
    setCurrentEditionPoint([
      name === "lat" ? parseFloat(value) : markerPos.lat,
      name === "lng" ? parseFloat(value) : markerPos.lng
    ]);
  };

  // Fonction pour repositionner le point sélectionné
  const handleRepositionPoint = () => {
    if (selectedMarkerRef.current && mapInstance.current) {
      const newLatLng = L.latLng(markerPos.lat, markerPos.lng);
      
      // Mettre à jour la position du marker sélectionné
      selectedMarkerRef.current.setLatLng(newLatLng);
      
      // Mettre à jour la géométrie parent
      updateParentGeometry(selectedMarkerRef.current, newLatLng);
      
      // Mettre à jour les coordonnées originales
      selectedMarkerRef.current.originalLatLng = newLatLng;
      
      // Centrer la carte sur le nouveau point
      mapInstance.current.setView([markerPos.lat, markerPos.lng], mapInstance.current.getZoom());
    }
  };

  // Fonctions pour activer le dessin
  const handleDrawLine = () => {
    if (mapInstance.current) {
      new L.Draw.Polyline(mapInstance.current).enable();
    }
  };

  const handleDrawPolygon = () => {
    if (mapInstance.current) {
      new L.Draw.Polygon(mapInstance.current).enable();
    }
  };

  // Fonction pour vider la carte
  const handleClearMap = () => {
    if (mapInstance.current) {
      const baseLayerId = Object.keys(mapInstance.current._layers)[0];
      mapInstance.current.eachLayer((layer) => {
        if (layer._leaflet_id !== parseInt(baseLayerId)) {
          if (layer.remove && typeof layer.remove === "function") layer.remove();
        }
      });
      vertexMarkersRef.current = [];
      selectedMarkerRef.current = null;
    }

    resetView();
  };

  // Fonction pour désélectionner le point actif et réactiver la navigation
  const unselectMarker = () => {
    if (selectedMarkerRef.current) {
      selectedMarkerRef.current.setStyle({
        radius: 6,
        color: '#3B82F6',
        fillColor: '#3B82F6',
        fillOpacity: 0.8,
        weight: 2
      });
    }
    selectedMarkerRef.current = null;
    if (mapInstance.current) {
      mapInstance.current.dragging.enable();
      mapInstance.current.touchZoom.enable();
      mapInstance.current.doubleClickZoom.enable();
      mapInstance.current.scrollWheelZoom.enable();
      mapInstance.current.boxZoom.enable();
      mapInstance.current.keyboard.enable();
    }
    setCurrentEditionPoint(null);
    setMarkerPos({ lat: 0, lng: 0 });
  };

    // Fonctions de contrôle de la carte
    const zoomIn = () => {
      if (mapInstance.current) {
        mapInstance.current.zoomIn();
      }
    };
  
    const zoomOut = () => {
      if (mapInstance.current) {
        mapInstance.current.zoomOut();
      }
    };
  
    const resetView = () => {
      if (mapInstance.current) {
        mapInstance.current.setView([3.868177, 11.519596], 12);
      }
    };

  return (
    <TooltipProvider>
      {/* <div className="relative flex flex-col h-full gap-4 p-4 rounded-lg bg-gray-50"> */}
      <div className="relative flex flex-col h-auto gap-4 p-4 rounded-lg bg-gray-50">
        {/* En-tête */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-800">Éditeur de Carte</h2>
            <p className="text-sm text-gray-600">Dessinez et modifiez des formes géométriques</p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowInstructions(!showInstructions)}
            className="flex items-center gap-2"
          >
            <HelpCircle className="w-4 h-4" />
            Aide
          </Button>
        </div>

        {/* Instructions */}
        {showInstructions && (
          <Card className="mb-4 border-blue-200 bg-blue-50">
            <CardContent className="p-4">
              <h4 className="mb-2 font-medium text-blue-800">Comment utiliser :</h4>
              <ul className="space-y-1 text-sm text-blue-700">
                <li>• <strong>Cliquez</strong> sur un point pour le sélectionner</li>
                <li>• <strong>Glissez</strong> un point sélectionné pour le déplacer</li>
                <li>• <strong>Cliquez sur un segment</strong> pour ajouter un nouveau point</li>
                <li>• <strong>Utilisez les outils</strong> pour dessiner de nouvelles formes</li>
              </ul>
            </CardContent>
          </Card>
        )}

        <div className="flex flex-col gap-4 lg:flex-row">
          {/* Carte */}
          <div className="relative flex-1 rounded-lg shadow-lg overflow-hidden h-[300px] lg:h-[600px]">
            <div 
              className="h-full rounded-lg" 
              ref={mapRef} 
              style={{ minHeight: 300, minWidth: 300 }} 
            />
            
            {/* Contrôles de zoom */}
            <div className="absolute right-4 top-4 z-[1000] flex flex-col gap-2">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    onClick={zoomIn}
                    size="icon"
                    className="w-10 h-10 text-gray-700 bg-white rounded-full shadow-md hover:bg-gray-50"
                  >
                    <ZoomIn className="w-5 h-5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Zoom avant</TooltipContent>
              </Tooltip>
              
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    onClick={zoomOut}
                    size="icon"
                    className="w-10 h-10 text-gray-700 bg-white rounded-full shadow-md hover:bg-gray-50"
                  >
                    <ZoomOut className="w-5 h-5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Zoom arrière</TooltipContent>
              </Tooltip>
              
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    onClick={() => fitMapToGeometry(currentEditionFig)}
                    variant="outline"
                    className="flex flex-col items-center justify-center h-12 gap-1"
                    disabled={!currentEditionFig}
                  >
                    <Navigation className="w-4 h-4" />
                    <span className="text-xs">Centrer figure</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Centrer sur la figure actuelle</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    onClick={resetView}
                    size="icon"
                    className="w-10 h-10 text-gray-700 bg-white rounded-full shadow-md hover:bg-gray-50"
                  >
                    <RotateCcw className="w-5 h-5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Réinitialiser la vue</TooltipContent>
              </Tooltip>
            </div>
          </div>

          {/* Panneau de contrôle */}
          <div className="space-y-4 lg:w-80">
            {/* Coordonnées du point */}
            {selectedMarkerRef.current && (
              <Card className="border-blue-200 bg-blue-50">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="flex items-center gap-2 font-medium text-blue-800">
                      <MapPin className="w-4 h-4" />
                      Point sélectionné
                    </h3>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={unselectMarker}
                      className="w-6 h-6 p-0 text-blue-600"
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </div>

                  <div className="space-y-3">
                    <div className="space-y-1">
                      <label className="text-sm font-medium text-blue-700">Latitude</label>
                      <input
                        type="number"
                        step="any"
                        name="lat"
                        value={markerPos.lat}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 text-sm bg-white border border-blue-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-sm font-medium text-blue-700">Longitude</label>
                      <input
                        type="number"
                        step="any"
                        name="lng"
                        value={markerPos.lng}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 text-sm bg-white border border-blue-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>

                    <div className="flex gap-2 pt-2">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            onClick={handleRepositionPoint}
                            size="sm"
                            className="flex-1 bg-blue-600 hover:bg-blue-700"
                          >
                            <Move className="w-4 h-4 mr-1" />
                            Déplacer
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Repositionner le point</TooltipContent>
                      </Tooltip>

                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            onClick={handleDeleteActivePoint}
                            size="sm"
                            variant="destructive"
                            className="flex-1"
                          >
                            <Trash2 className="w-4 h-4 mr-1" />
                            Supprimer
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Supprimer le point</TooltipContent>
                      </Tooltip>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Outils de dessin */}
            <Card>
              <CardContent className="p-4">
                <h3 className="mb-3 font-medium text-gray-800">Outils de dessin</h3>
                <div className="grid grid-cols-2 gap-2">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        onClick={handleDrawLine}
                        variant="outline"
                        className="flex flex-col items-center justify-center h-12 gap-1"
                      >
                        <div className="w-4 h-1 bg-current rounded-full"></div>
                        <span className="text-xs">Ligne</span>
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Dessiner une ligne</TooltipContent>
                  </Tooltip>

                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        onClick={handleDrawPolygon}
                        variant="outline"
                        className="flex flex-col items-center justify-center h-12 gap-1"
                      >
                        <Square className="w-4 h-4" />
                        <span className="text-xs">Polygone</span>
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Dessiner un polygone</TooltipContent>
                  </Tooltip>

                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        onClick={handleClearMap}
                        variant="outline"
                        className="flex flex-col items-center justify-center h-12 gap-1 text-red-600 border-red-200 hover:bg-red-50"
                      >
                        <Eraser className="w-4 h-4" />
                        <span className="text-xs">Effacer tout</span>
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Effacer toutes les formes</TooltipContent>
                  </Tooltip>
                  
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        onClick={unselectMarker}
                        variant="outline"
                        className="flex flex-col items-center justify-center h-12 gap-1 text-gray-600 border-gray-200 hover:bg-gray-50"
                      >
                        <X className="w-4 h-4" />
                        <span className="text-xs">Désélectionner</span>
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Désélectionner le point</TooltipContent>
                  </Tooltip>
                </div>
              </CardContent>
            </Card>

            

            {/* Statistiques */}
            <Card>
              <CardContent className="p-4">
                <h3 className="mb-3 font-medium text-gray-800">Statistiques</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Points créés</span>
                    <span className="font-medium">{vertexMarkersRef.current.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Formes actives</span>
                    <span className="font-medium">{
                      vertexMarkersRef.current.filter((m, i, a) => 
                        a.findIndex(m2 => m2.parentLayer === m.parentLayer) === i
                      ).length
                    }</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Actions rapides */}
            {/* <Card>
              <CardContent className="p-4">
                <h3 className="mb-3 font-medium text-gray-800">Actions rapides</h3>
                <div className="space-y-2">
                  <Button
                    variant="outline"
                    className="justify-start w-full"
                    onClick={() => {
                      // Fonction pour exporter les données
                    }}
                  >
                    <Navigation className="w-4 h-4 mr-2" />
                    Exporter les données
                  </Button>
                  <Button
                    variant="outline"
                    className="justify-start w-full"
                    onClick={() => {
                      // Fonction pour importer des données
                    }}
                  >
                    <Square className="w-4 h-4 mr-2" />
                    Importer un fichier
                  </Button>
                </div>
              </CardContent>
            </Card> */}
          </div>
        </div>

        {/* Popup de confirmation */}
        <ConfirmDialog 
          isOpen={confirmPopupVisible}
          onClose={() => {
            setConfirmPopupVisible(false);
            setEntityToDelete(null);
          }}
          onConfirm={handleDeleteEntity}
          title="Confirmation de suppression"
          description={confirmPopupMessage}
          variant="destructive"
          isLoading={false}
        />
      </div>
    </TooltipProvider>
  );
}

export default DrawableLeafletMap;