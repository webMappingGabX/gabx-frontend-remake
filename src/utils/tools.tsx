export function getCookie(name: string): string | null {
  const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = document.cookie.match(new RegExp("(?:^|; )" + escaped + "=([^;]*)"));
  return match ? decodeURIComponent(match[1]) : null;
}

export const hasToken  = () => {
  return localStorage.getItem("accessToken") !== null;
}

export const isFullyAuthenticated = (isAuthenticated : boolean) => {
  return isAuthenticated && localStorage.getItem("accessToken") !== null;
}

/*
export function getCookie(name) {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(';').shift();
    return null;
};
*/

export const convertToGeometryCollection = (geometry: Record<string, unknown>): Record<string, unknown> => {
  // Convert any geometry to a GeometryCollection
  if (!geometry) {
      throw new Error("Aucune géométrie fournie");
  }
  // If already a GeometryCollection, return as is
  if (geometry.type === 'GeometryCollection') {
      return geometry;
  }
  // Otherwise, wrap the geometry in a GeometryCollection
  return {
      type: 'GeometryCollection',
      geometries: [geometry]
  };
};

export const multiPolygonToPolygon = (geometry: Record<string, any>): Record<string, any> => {
  if (!geometry) return geometry;
  if (geometry.type === "MultiPolygon" && Array.isArray(geometry.coordinates) && geometry.coordinates.length > 0) {
      // Use the first polygon in the MultiPolygon
      return {
          type: "Polygon",
          coordinates: geometry.coordinates[0]
      };
  }
  return geometry;
};

// Fonction pour calculer la surface d'un polygone en mètres carrés
export const calculatePolygonArea = (coordinates: [number, number][]) => {
  if (!coordinates || coordinates.length < 3) return 0;
  
  let area = 0;
  const n = coordinates.length;
  
  // Algorithme de Gauss pour calculer la surface d'un polygone
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    area += coordinates[i][1] * coordinates[j][0]; // lat1 * lng2
    area -= coordinates[j][1] * coordinates[i][0]; // lat2 * lng1
  }
  
  // Convertir en mètres carrés (approximation pour les coordonnées géographiques)
  const areaInSquareDegrees = Math.abs(area) / 2;
  
  // Conversion approximative degrés -> mètres (plus précis près de l'équateur)
  // 1 degré de latitude ≈ 111 320 m
  // 1 degré de longitude ≈ 111 320 m * cos(latitude)
  const avgLatitude = coordinates.reduce((sum, coord) => sum + coord[0], 0) / coordinates.length;
  const metersPerDegreeLat = 111320; // Environ 111.32 km par degré de latitude
  const metersPerDegreeLng = 111320 * Math.cos((avgLatitude * Math.PI) / 180);
  
  // Approximation de la surface en mètres carrés
  const areaInSquareMeters = areaInSquareDegrees * metersPerDegreeLat * metersPerDegreeLng;
  
  return parseFloat(areaInSquareMeters.toFixed(2));
};