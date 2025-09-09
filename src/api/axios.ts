import axios from "axios";
import { getCookie } from "../utils/tools";

// Créer l'instance axios de base
const axiosInstance = axios.create({
  baseURL: "http://localhost:5055/api/v1"
});

// This assumes you have a refresh token endpoint at /auth/refresh and store tokens in cookies or localStorage.
// Adjust as needed for your actual token storage and refresh logic.

let isRefreshing = false;
let failedQueue: any[] = [];

function processQueue(error: any, token: string | null = null) {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });

  failedQueue = [];
}

const refreshRoute = "/auth/refresh";

// Intercepteur de réponse
axiosInstance.interceptors.response.use(
  response => response,
  async error => {
    const originalRequest = error.config;

    // Si erreur 401 et pas déjà en train de rafraîchir
    if (
      error.response &&
      error.response.status === 401 &&
      !originalRequest._retry &&
      !originalRequest.url.endsWith(refreshRoute)
    ) {
      originalRequest._retry = true;

      if (isRefreshing) {
        // Mettre la requête en file d'attente jusqu'au rafraîchissement du token
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token: string) => {
            // Attacher le nouveau token et réessayer
            originalRequest.headers.Authorization = "Bearer " + token;
            return axiosInstance(originalRequest);
          })
          .catch(err => {
            return Promise.reject(err);
          });
      }

      isRefreshing = true;

      // Récupérer le refresh token du stockage
      const refreshToken = localStorage.getItem("refreshToken") || getCookie("refreshToken");
      
      if (!refreshToken) {
        isRefreshing = false;
        // Rediriger vers la page de login ou gérer la déconnexion
        window.location.href = "/auth/login";
        return Promise.reject(error);
      }

      try {
        // Appeler l'endpoint de rafraîchissement
        const res = await axiosInstance.post(refreshRoute, { 
          refreshToken: refreshToken 
        });
        
        const newAccessToken = res.data.accessToken;
        const newRefreshToken = res.data.refreshToken;

        // Stocker les nouveaux tokens
        localStorage.setItem("accessToken", newAccessToken);
        if (newRefreshToken) {
          localStorage.setItem("refreshToken", newRefreshToken);
        }

        // Traiter la file d'attente avec le nouveau token
        processQueue(null, newAccessToken);

        // Réessayer la requête originale avec le nouveau token
        originalRequest.headers.Authorization = "Bearer " + newAccessToken;
        return axiosInstance(originalRequest);
      } catch (err) {
        processQueue(err, null);
        // En cas d'erreur de rafraîchissement, déconnecter l'utilisateur
        console.log("REFRESHING ERROR     ", err);
        /*localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
        window.location.href = "/auth/login";*/
        return Promise.reject(err);
      } finally {
        isRefreshing = false;
      }
    }

    // Pour les autres erreurs, rejeter normalement
    return Promise.reject(error);
  }
);

// Intercepteur de requête pour ajouter le token à chaque requête
axiosInstance.interceptors.request.use(
  config => {
    // Récupérer le token du localStorage OU des cookies
    const token = localStorage.getItem("accessToken") || getCookie("accessToken");
    
    if (token) {
      config.headers.Authorization = "Bearer " + token;
    } else {
      // Si pas de token, supprimer l'en-tête Authorization pour éviter d'envoyer "Bearer null"
      delete config.headers.Authorization;
    }
    
    return config;
  },
  error => Promise.reject(error)
);

export default axiosInstance;