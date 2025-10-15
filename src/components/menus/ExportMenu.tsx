import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent } from "../ui/card";
import { Button } from "../ui/button";
import { Download, File, X, Printer, Map, Building, Filter, Settings } from "lucide-react";
import { closeMenu } from "../../app/store/slices/settingSlice";
import { useDispatch, useSelector } from "react-redux";
import { useToast } from "../../hooks/useToast";
import { useState } from "react";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Switch } from "../ui/switch";
import { Textarea } from "../ui/textarea";
import { Badge } from "../ui/badge";
import { Slider } from "../ui/slider";
import jsPDF from "jspdf";
import domtoimage from 'dom-to-image-more';


interface ExportConfig {
  format: "A4" | "A3" | "CUSTOM";
  orientation: "portrait" | "landscape";
  includeMap: boolean;
  includeDataTable: boolean;
  includeOverlappingAreas: boolean;
  includePropertyDetails: boolean;
  quality: "low" | "medium" | "high";
  customWidth?: number;
  customHeight?: number;
}

interface DataFilters {
  region: string;
  department: string;
  town: string;
  housingEstate: string;
  propertyType: string;
  status: string;
  dateRange: string;
}

const ExportMenu = ({ printControlRef }) => {
    const dispatch = useDispatch();
    const { toast } = useToast();
    
    const [exportConfig, setExportConfig] = useState<ExportConfig>({
      format: "A4",
      orientation: "portrait",
      includeMap: true,
      includeDataTable: true,
      includeOverlappingAreas: false,
      includePropertyDetails: true,
      quality: "medium"
    });

    const [dataFilters, setDataFilters] = useState<DataFilters>({
      region: '',
      department: '',
      town: '',
      housingEstate: '',
      propertyType: '',
      status: '',
      dateRange: 'all'
    });

    const [exportTitle, setExportTitle] = useState("Rapport Propriétés");
    const [exportDescription, setExportDescription] = useState("");
    const [isGenerating, setIsGenerating] = useState(false);
    const [selectedProperties, setSelectedProperties] = useState<string[]>([]);
    const [showAdvancedOptions, setShowAdvancedOptions] = useState(false);

    // Données simulées pour les propriétés
    const mockProperties = [
      { id: "PROP_001", name: "Propriété Nord", area: 1500, status: "BATI" },
      { id: "PROP_002", name: "Propriété Sud", area: 2000, status: "NON_BATI" },
      { id: "PROP_003", name: "Propriété Est", area: 1750, status: "BATI" },
    ];

    // Gestion de la configuration d'export
    const handleExportConfigChange = (field: keyof ExportConfig, value: any) => {
      setExportConfig(prev => ({
        ...prev,
        [field]: value
      }));
    };

    // Gestion des filtres
    const handleFilterChange = (field: keyof DataFilters, value: string) => {
      setDataFilters(prev => ({
        ...prev,
        [field]: value
      }));
    };

    // Sélection/désélection des propriétés
    const handlePropertySelection = (propertyId: string) => {
      setSelectedProperties(prev => 
        prev.includes(propertyId) 
          ? prev.filter(id => id !== propertyId)
          : [...prev, propertyId]
      );
    };

    // Sélectionner toutes les propriétés
    const handleSelectAllProperties = () => {
      if (selectedProperties.length === mockProperties.length) {
        setSelectedProperties([]);
      } else {
        setSelectedProperties(mockProperties.map(p => p.id));
      }
    };

      const captureMapImage = async (map: L.Map) => {
        const container = map.getContainer();
      
        const options = {
          useCORS: true,
          width: container.clientWidth,
          height: container.clientHeight,
          style: {
            transform: "none",
            position: "absolute",
            top: "0px",
            left: "0px",
          },
        };
      
        return await domtoimage.toPng(container, options);
      };
      
      
    
    const generatePDF = async () => {
        if (!printControlRef?.current?._map) {
          toast({
            title: "Erreur",
            description: "Le contrôle d'impression n'est pas disponible",
            variant: "destructive"
          });
          return;
        }
      
        setIsGenerating(true);
      
        try {
          const map = printControlRef.current._map;
      
          // 🖼️ Capture fidèle de la carte
          const imageUrl = await captureMapImage(map);
      
          // 📄 Création du PDF
          const pdf = new jsPDF({
            orientation: exportConfig.orientation,
            unit: "mm",
            format: exportConfig.format.toLowerCase(),
          });
      
          const margin = 15;
          const pageWidth = pdf.internal.pageSize.getWidth();
          const contentWidth = pageWidth - 2 * margin;
          let y = 30;
      
          // 🔹 En-tête
          /*pdf.setFillColor(41, 128, 185);
          pdf.rect(0, 0, pageWidth, 25, "F");
          pdf.setTextColor(255, 255, 255);
          pdf.setFont("helvetica", "bold");
          pdf.setFontSize(16);
          pdf.text(exportTitle || "Rapport cartographique", margin, 15);
      
          // 🔹 Ajout de l'image capturée
          
          // 🔹 Pied de page
          const footerY = pdf.internal.pageSize.getHeight() - 10;
          pdf.setDrawColor(200, 200, 200);
          pdf.line(margin, footerY - 5, pageWidth - margin, footerY - 5);
          pdf.setTextColor(100, 100, 100);
          pdf.setFontSize(8);
          pdf.text(`Généré le ${new Date().toLocaleString("fr-FR")}`, margin, footerY);*/
      
          
          
          // 🔹 EN-TÊTE DU DOCUMENT
          pdf.setFillColor(41, 128, 185);
          pdf.rect(0, 0, pageWidth, 25, 'F');
          
          // Titre principal
          pdf.setTextColor(255, 255, 255);
          pdf.setFontSize(16);
          pdf.setFont('helvetica', 'bold');
          pdf.text(exportTitle, margin, 15);
      
          // Date de génération
          const now = new Date();
          const dateString = now.toLocaleDateString('fr-FR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          });
          pdf.setFontSize(8);
          pdf.text(`Généré le: ${dateString}`, pageWidth - margin, 15, { align: 'right' });
      
          y = 30;
      
          // 🔹 DESCRIPTION
          if (exportDescription) {
            pdf.setTextColor(0, 0, 0);
            pdf.setFontSize(10);
            pdf.setFont('helvetica', 'normal');
            const lines = pdf.splitTextToSize(exportDescription, contentWidth);
            pdf.text(lines, margin, y);
            y += lines.length * 4 + 8;
          }
      
          // 🔹 INFORMATIONS CARTOGRAPHIQUES
          const infoBoxHeight = 25;
          pdf.setFillColor(245, 245, 245);
          pdf.rect(margin, y, contentWidth, infoBoxHeight, 'F');
          pdf.setDrawColor(200, 200, 200);
          pdf.rect(margin, y, contentWidth, infoBoxHeight, 'S');
      
          pdf.setTextColor(0, 0, 0);
          pdf.setFontSize(9);
          pdf.setFont('helvetica', 'bold');
          pdf.text("INFORMATIONS CARTOGRAPHIQUES", margin + 5, y + 7);
      
          pdf.setFont('helvetica', 'normal');
          
          // Échelle approximative (calcul basique)
          const zoom = map.getZoom();
          const scale = Math.round(591657550 / Math.pow(2, zoom - 1)); // Formule approximative
          const scaleText = `1:${scale.toLocaleString()}`;
          
          // Centre de la carte
          const center = map.getCenter();
          const centerText = `${center.lat.toFixed(4)}°, ${center.lng.toFixed(4)}°`;
      
          pdf.text(`Échelle: ${scaleText}`, margin + 5, y + 14);
          pdf.text(`Centre: ${centerText}`, margin + 5, y + 19);
          pdf.text(`Zoom: ${zoom}`, margin + 80, y + 14);
          
          // Nombre d'éléments
          // const featureCount = overlayPane ? overlayPane.querySelectorAll('path').length : 0;
          // pdf.text(`Éléments: ${featureCount}`, margin + 80, y + 19);
      
          y += infoBoxHeight + 10;
      
          // 🔹 IMAGE DE LA CARTE
          const imgProps = pdf.getImageProperties(imageUrl);
          const pdfImgWidth = contentWidth;
          const pdfImgHeight = (imgProps.height * pdfImgWidth) / imgProps.width;
      
          
          // Vérifier si l'image dépasse la page
          const remainingHeight = pdf.internal.pageSize.getHeight() - y - 30;
          const finalImgHeight = Math.min(pdfImgHeight, remainingHeight);
          const finalImgWidth = (pdfImgWidth * finalImgHeight) / pdfImgHeight;
      
          pdf.addImage(imageUrl, "PNG", margin, y, finalImgWidth, finalImgHeight);
      
          // 🔹 FLÈCHE NORD
          const northArrowY = y + 10;
          const northArrowX = pageWidth - margin - 15;
          
          // Dessiner la flèche Nord
          pdf.setFillColor(0, 0, 0);
          pdf.setFontSize(8);
          pdf.text('N', northArrowX - 1, northArrowY - 5);
          
          // Triangle de la flèche
          pdf.triangle(
            northArrowX, northArrowY,
            northArrowX - 4, northArrowY + 8,
            northArrowX + 4, northArrowY + 8,
            'F'
          );
          
          // Cercle autour
          pdf.setDrawColor(0, 0, 0);
          pdf.circle(northArrowX, northArrowY + 4, 6, 'S');
      
          y += finalImgHeight + 10;
      
          // 🔹 ÉCHELLE GRAPHIQUE
          const scaleBarY = y - 15;
          const scaleBarWidth = 50; // mm
          const realDistance = Math.round((scale * scaleBarWidth) / 1000); // en mètres
          
          // Barre d'échelle
          pdf.setFillColor(0, 0, 0);
          pdf.rect(margin, scaleBarY, scaleBarWidth, 2, 'F');
          
          // Subdivisions
          pdf.rect(margin, scaleBarY - 3, 1, 8, 'F'); // Début
          pdf.rect(margin + scaleBarWidth/2, scaleBarY - 2, 1, 6, 'F'); // Milieu
          pdf.rect(margin + scaleBarWidth, scaleBarY - 3, 1, 8, 'F'); // Fin
          
          // Texte de l'échelle
          pdf.setFontSize(7);
          pdf.text('0', margin - 1, scaleBarY + 10);
          pdf.text(`${realDistance/2}m`, margin + (scaleBarWidth/2) - 5, scaleBarY + 10);
          pdf.text(`${realDistance}m`, margin + scaleBarWidth - 5, scaleBarY + 10);
          pdf.text('ÉCHELLE', margin - 1, scaleBarY - 8);
      
          // 🔹 PIED DE PAGE
          const footerY = pdf.internal.pageSize.getHeight() - 10;
          
          pdf.setDrawColor(200, 200, 200);
          pdf.line(margin, footerY - 5, pageWidth - margin, footerY - 5);
          
          pdf.setTextColor(100, 100, 100);
          pdf.setFontSize(7);
          pdf.setFont('helvetica', 'normal');
          
          // Informations de pied de page
          const footerText = `Cartographie générée par SIG App • Page 1/1 • Données: OpenStreetMap • ${dateString}`;
          pdf.text(footerText, margin, footerY);
      
          // 🔹 LÉGENDE (exemple simple)
          const legendY = y;
          if (legendY < pdf.internal.pageSize.getHeight() - 30) {
            pdf.setFillColor(245, 245, 245);
            pdf.rect(margin, legendY, contentWidth, 20, 'F');
            pdf.setDrawColor(200, 200, 200);
            pdf.rect(margin, legendY, contentWidth, 20, 'S');
            
            pdf.setTextColor(0, 0, 0);
            pdf.setFontSize(8);
            pdf.setFont('helvetica', 'bold');
            pdf.text("LÉGENDE", margin + 5, legendY + 7);
            
            pdf.setFont('helvetica', 'normal');
            
            // Exemples d'éléments de légende
            pdf.setFillColor(16, 185, 129); // Vert pour parcelles
            pdf.rect(margin + 5, legendY + 12, 4, 4, 'F');
            pdf.text("Parcelles", margin + 12, legendY + 15);
            
            pdf.setFillColor(245, 158, 66); // Orange pour bâtiments
            pdf.rect(margin + 45, legendY + 12, 4, 4, 'F');
            pdf.text("Bâtiments", margin + 52, legendY + 15);
            
            pdf.setFillColor(239, 68, 68); // Rouge pour intersections
            pdf.rect(margin + 85, legendY + 12, 4, 4, 'F');
            pdf.text("Empiètements", margin + 92, legendY + 15);
          }

            // 💾 Sauvegarde
            pdf.save(`${exportTitle.replace(/\s+/g, "_")}_${Date.now()}.pdf`);

          toast({
            title: "PDF généré avec succès",
            description: "La carte a été intégrée avec la qualité de Leaflet EasyPrint",
          });
        } catch (error) {
          console.error("Erreur lors de la génération du PDF:", error);
          toast({
            title: "Erreur",
            description: "Impossible de générer le PDF",
            variant: "destructive",
          });
        } finally {
          setIsGenerating(false);
        }
    };
      
      
      
    /*const generatePDF = async () => {
        if (!exportConfig.includeMap && !exportConfig.includeDataTable) {
          toast({
            title: "Configuration invalide",
            description: "Sélectionnez au moins une option d'export (carte ou tableau)",
            variant: "destructive"
          });
          return;
        }
      
        setIsGenerating(true);
      
        try {
          if (!printControlRef?.current?._map) {
            throw new Error("Le contrôle d'impression n'est pas disponible");
          }
      
          const map = printControlRef.current._map;
          const mapContainer = map.getContainer();
          const tilePane = mapContainer.querySelector('.leaflet-tile-pane');
          const overlayPane = mapContainer.querySelector('.leaflet-overlay-pane');
      
          const width = mapContainer.clientWidth;
          const height = mapContainer.clientHeight;
      
          // 1️⃣ Créer un canvas temporaire
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
      
          // Fond blanc
          //ctx.fillStyle = '#ffffff';
          //ctx.fillRect(0, 0, width, height);
      
          // 2️⃣ Dessiner les tuiles raster
          if (tilePane) {
            const images = tilePane.querySelectorAll('img');
            images.forEach((img) => {
              const transform = img.style.transform || "";
              const match = transform.match(/translate3d\((-?\d+)px, (-?\d+)px/);
              if (match) {
                const x = parseFloat(match[1]);
                const y = parseFloat(match[2]);
                try {
                  ctx.drawImage(img, x, y);
                } catch (e) {
                  console.warn("Erreur dessin tuile:", e);
                }
              }
            });
          }
      
          // 3️⃣ Dessiner les couches vectorielles
          if (overlayPane) {
            const svg = overlayPane.querySelector('svg');
            if (svg) {
              const xml = new XMLSerializer().serializeToString(svg);
              const svg64 = btoa(unescape(encodeURIComponent(xml)));
              const imageSrc = 'data:image/svg+xml;base64,' + svg64;
      
              const image = new Image();
              image.crossOrigin = "anonymous";
              await new Promise((resolve) => {
                image.onload = () => {
                  ctx.drawImage(image, 0, 0);
                  resolve(null);
                };
                image.src = imageSrc;
              });
            }
          }
      
          //const overlayCanvas = overlayPane.querySelector('canvas');
          //if (overlayCanvas) ctx.drawImage(overlayCanvas, 0, 0);
      
          // 4️⃣ Extraire l'image finale
          const imageUrl = canvas.toDataURL('image/png');
      
          const pdf = new jsPDF({
            orientation: exportConfig.orientation,
            unit: "mm",
            format: exportConfig.format.toLowerCase(),
          });
      
          const margin = 15;
          const pageWidth = pdf.internal.pageSize.getWidth();
          const contentWidth = pageWidth - (2 * margin);
          let y = margin;
      
          // 🔹 EN-TÊTE DU DOCUMENT
          pdf.setFillColor(41, 128, 185);
          pdf.rect(0, 0, pageWidth, 25, 'F');
          
          // Titre principal
          pdf.setTextColor(255, 255, 255);
          pdf.setFontSize(16);
          pdf.setFont('helvetica', 'bold');
          pdf.text(exportTitle, margin, 15);
      
          // Date de génération
          const now = new Date();
          const dateString = now.toLocaleDateString('fr-FR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          });
          pdf.setFontSize(8);
          pdf.text(`Généré le: ${dateString}`, pageWidth - margin, 15, { align: 'right' });
      
          y = 30;
      
          // 🔹 DESCRIPTION
          if (exportDescription) {
            pdf.setTextColor(0, 0, 0);
            pdf.setFontSize(10);
            pdf.setFont('helvetica', 'normal');
            const lines = pdf.splitTextToSize(exportDescription, contentWidth);
            pdf.text(lines, margin, y);
            y += lines.length * 4 + 8;
          }
      
          // 🔹 INFORMATIONS CARTOGRAPHIQUES
          const infoBoxHeight = 25;
          pdf.setFillColor(245, 245, 245);
          pdf.rect(margin, y, contentWidth, infoBoxHeight, 'F');
          pdf.setDrawColor(200, 200, 200);
          pdf.rect(margin, y, contentWidth, infoBoxHeight, 'S');
      
          pdf.setTextColor(0, 0, 0);
          pdf.setFontSize(9);
          pdf.setFont('helvetica', 'bold');
          pdf.text("INFORMATIONS CARTOGRAPHIQUES", margin + 5, y + 7);
      
          pdf.setFont('helvetica', 'normal');
          
          // Échelle approximative (calcul basique)
          const zoom = map.getZoom();
          const scale = Math.round(591657550 / Math.pow(2, zoom - 1)); // Formule approximative
          const scaleText = `1:${scale.toLocaleString()}`;
          
          // Centre de la carte
          const center = map.getCenter();
          const centerText = `${center.lat.toFixed(4)}°, ${center.lng.toFixed(4)}°`;
      
          pdf.text(`Échelle: ${scaleText}`, margin + 5, y + 14);
          pdf.text(`Centre: ${centerText}`, margin + 5, y + 19);
          pdf.text(`Zoom: ${zoom}`, margin + 80, y + 14);
          
          // Nombre d'éléments
          const featureCount = overlayPane ? overlayPane.querySelectorAll('path').length : 0;
          pdf.text(`Éléments: ${featureCount}`, margin + 80, y + 19);
      
          y += infoBoxHeight + 10;
      
          // 🔹 IMAGE DE LA CARTE
          const imgProps = pdf.getImageProperties(imageUrl);
          const pdfImgWidth = contentWidth;
          const pdfImgHeight = (imgProps.height * pdfImgWidth) / imgProps.width;
          
          // Vérifier si l'image dépasse la page
          const remainingHeight = pdf.internal.pageSize.getHeight() - y - 30;
          const finalImgHeight = Math.min(pdfImgHeight, remainingHeight);
          const finalImgWidth = (pdfImgWidth * finalImgHeight) / pdfImgHeight;
      
          pdf.addImage(imageUrl, "PNG", margin, y, finalImgWidth, finalImgHeight);
      
          // 🔹 FLÈCHE NORD
          const northArrowY = y + 10;
          const northArrowX = pageWidth - margin - 15;
          
          // Dessiner la flèche Nord
          pdf.setFillColor(0, 0, 0);
          pdf.setFontSize(8);
          pdf.text('N', northArrowX - 1, northArrowY - 5);
          
          // Triangle de la flèche
          pdf.triangle(
            northArrowX, northArrowY,
            northArrowX - 4, northArrowY + 8,
            northArrowX + 4, northArrowY + 8,
            'F'
          );
      
          // Cercle autour
          pdf.setDrawColor(0, 0, 0);
          pdf.circle(northArrowX, northArrowY + 4, 6, 'S');
      
          y += finalImgHeight + 10;
      
          // 🔹 ÉCHELLE GRAPHIQUE
          const scaleBarY = y - 15;
          const scaleBarWidth = 50; // mm
          const realDistance = Math.round((scale * scaleBarWidth) / 1000); // en mètres
          
          // Barre d'échelle
          pdf.setFillColor(0, 0, 0);
          pdf.rect(margin, scaleBarY, scaleBarWidth, 2, 'F');
          
          // Subdivisions
          pdf.rect(margin, scaleBarY - 3, 1, 8, 'F'); // Début
          pdf.rect(margin + scaleBarWidth/2, scaleBarY - 2, 1, 6, 'F'); // Milieu
          pdf.rect(margin + scaleBarWidth, scaleBarY - 3, 1, 8, 'F'); // Fin
          
          // Texte de l'échelle
          pdf.setFontSize(7);
          pdf.text('0', margin - 1, scaleBarY + 10);
          pdf.text(`${realDistance/2}m`, margin + (scaleBarWidth/2) - 5, scaleBarY + 10);
          pdf.text(`${realDistance}m`, margin + scaleBarWidth - 5, scaleBarY + 10);
          pdf.text('ÉCHELLE', margin - 1, scaleBarY - 8);
      
          // 🔹 PIED DE PAGE
          const footerY = pdf.internal.pageSize.getHeight() - 10;
          
          pdf.setDrawColor(200, 200, 200);
          pdf.line(margin, footerY - 5, pageWidth - margin, footerY - 5);
          
          pdf.setTextColor(100, 100, 100);
          pdf.setFontSize(7);
          pdf.setFont('helvetica', 'normal');
          
          // Informations de pied de page
          const footerText = `Cartographie générée par SIG App • Page 1/1 • Données: OpenStreetMap • ${dateString}`;
          pdf.text(footerText, margin, footerY);
      
          // 🔹 LÉGENDE (exemple simple)
          const legendY = y;
          if (legendY < pdf.internal.pageSize.getHeight() - 30) {
            pdf.setFillColor(245, 245, 245);
            pdf.rect(margin, legendY, contentWidth, 20, 'F');
            pdf.setDrawColor(200, 200, 200);
            pdf.rect(margin, legendY, contentWidth, 20, 'S');
            
            pdf.setTextColor(0, 0, 0);
            pdf.setFontSize(8);
            pdf.setFont('helvetica', 'bold');
            pdf.text("LÉGENDE", margin + 5, legendY + 7);
            
            pdf.setFont('helvetica', 'normal');
            
            // Exemples d'éléments de légende
            pdf.setFillColor(16, 185, 129); // Vert pour parcelles
            pdf.rect(margin + 5, legendY + 12, 4, 4, 'F');
            pdf.text("Parcelles", margin + 12, legendY + 15);
            
            pdf.setFillColor(245, 158, 66); // Orange pour bâtiments
            pdf.rect(margin + 45, legendY + 12, 4, 4, 'F');
            pdf.text("Bâtiments", margin + 52, legendY + 15);
            
            pdf.setFillColor(239, 68, 68); // Rouge pour intersections
            pdf.rect(margin + 85, legendY + 12, 4, 4, 'F');
            pdf.text("Empiètements", margin + 92, legendY + 15);
          }
      
          // 💾 TÉLÉCHARGER LE PDF
          pdf.save(`${exportTitle.replace(/\s+/g, "_")}_${now.getTime()}.pdf`);
      
          toast({
            title: "PDF généré avec succès",
            description: "Rapport cartographique exporté avec les informations complètes",
            variant: "default",
          });
      
        } catch (error) {
          console.error("Erreur lors de la génération du PDF:", error);
          toast({
            title: "Erreur",
            description: "Impossible de générer le PDF",
            variant: "destructive",
          });
        } finally {
          setIsGenerating(false);
        }
    };*/
    


    // Simulation du téléchargement
    const simulateDownload = () => {
      const link = document.createElement('a');
      link.href = '#';
      link.download = `${exportTitle.replace(/\s+/g, '_')}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    };

    // Réinitialiser la configuration
    const handleResetConfig = () => {
      setExportConfig({
        format: "A4",
        orientation: "portrait",
        includeMap: true,
        includeDataTable: true,
        includeOverlappingAreas: false,
        includePropertyDetails: true,
        quality: "medium"
      });
      setExportTitle("Rapport Propriétés");
      setExportDescription("");
      setSelectedProperties([]);

      toast({
        title: "Configuration réinitialisée",
        description: "Tous les paramètres ont été réinitialisés",
        variant: "default"
      });
    };

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0, y: 100 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 0 }}
                className="absolute z-[1100] md:max-w-2xl md:min-w-sm md:w-auto w-[90%] bottom-4 left-1/2 -translate-x-1/2 max-h-[600px]"
            >
                <Card className="py-2">
                    <CardContent className="p-4">
                        <div className="flex flex-col items-start justify-between max-h-[550px] overflow-y-auto">
                            <h1 className="relative flex flex-row items-center w-full mb-4 font-bold text-gray-500">
                                <Button 
                                    className="absolute flex items-center justify-center font-bold text-black bg-transparent shadow-none cursor-pointer right-2 hover:bg-gray-300/90"
                                    onClick={() => dispatch(closeMenu())}
                                >
                                    <X className="w-4 h-4" />
                                </Button>
                                <Download className="w-4 h-4 mr-2" />
                                EXPORT MENU
                            </h1>
                            
                            <div className="w-full space-y-6">
                                {/* Configuration de base */}
                                {/* <div className="space-y-4">
                                    <h3 className="flex items-center gap-2 font-semibold text-md">
                                        <Settings className="w-4 h-4" />
                                        Configuration d'export
                                    </h3>
                                    
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label>Format</Label>
                                            <Select
                                                value={exportConfig.format}
                                                onValueChange={(value: "A4" | "A3" | "CUSTOM") => 
                                                    handleExportConfigChange('format', value)
                                                }
                                            >
                                                <SelectTrigger>
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="A4">A4</SelectItem>
                                                    <SelectItem value="A3">A3</SelectItem>
                                                    <SelectItem value="CUSTOM">Personnalisé</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        <div className="space-y-2">
                                            <Label>Orientation</Label>
                                            <Select
                                                value={exportConfig.orientation}
                                                onValueChange={(value: "portrait" | "landscape") => 
                                                    handleExportConfigChange('orientation', value)
                                                }
                                            >
                                                <SelectTrigger>
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="portrait">Portrait</SelectItem>
                                                    <SelectItem value="landscape">Paysage</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <Label>Qualité</Label>
                                        <Select
                                            value={exportConfig.quality}
                                            onValueChange={(value: "low" | "medium" | "high") => 
                                                handleExportConfigChange('quality', value)
                                            }
                                        >
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="low">Basse</SelectItem>
                                                <SelectItem value="medium">Moyenne</SelectItem>
                                                <SelectItem value="high">Haute</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div> */}

                                {/* Options de contenu */}
                                {/* <div className="space-y-4">
                                    <h3 className="flex items-center gap-2 font-semibold text-md">
                                        <File className="w-4 h-4" />
                                        Contenu à inclure
                                    </h3>
                                    
                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between">
                                            <Label className="flex items-center gap-2">
                                                <Map className="w-4 h-4" />
                                                Carte géographique
                                            </Label>
                                            <Switch
                                                checked={exportConfig.includeMap}
                                                onCheckedChange={(checked) => 
                                                    handleExportConfigChange('includeMap', checked)
                                                }
                                            />
                                        </div>

                                        <div className="flex items-center justify-between">
                                            <Label className="flex items-center gap-2">
                                                <Printer className="w-4 h-4" />
                                                Tableau des données
                                            </Label>
                                            <Switch
                                                checked={exportConfig.includeDataTable}
                                                onCheckedChange={(checked) => 
                                                    handleExportConfigChange('includeDataTable', checked)
                                                }
                                            />
                                        </div>

                                        <div className="flex items-center justify-between">
                                            <Label className="flex items-center gap-2">
                                                <Filter className="w-4 h-4" />
                                                Zones d'empiètement
                                            </Label>
                                            <Switch
                                                checked={exportConfig.includeOverlappingAreas}
                                                onCheckedChange={(checked) => 
                                                    handleExportConfigChange('includeOverlappingAreas', checked)
                                                }
                                            />
                                        </div>

                                        <div className="flex items-center justify-between">
                                            <Label className="flex items-center gap-2">
                                                <Building className="w-4 h-4" />
                                                Détails des propriétés
                                            </Label>
                                            <Switch
                                                checked={exportConfig.includePropertyDetails}
                                                onCheckedChange={(checked) => 
                                                    handleExportConfigChange('includePropertyDetails', checked)
                                                }
                                            />
                                        </div>
                                    </div>
                                </div> */}

                                {/* Métadonnées */}
                                <div className="space-y-4">
                                    <h3 className="font-semibold text-md">Métadonnées</h3>
                                    
                                    <div className="space-y-3">
                                        <div className="space-y-2">
                                            <Label>Titre du rapport</Label>
                                            <Input
                                                value={exportTitle}
                                                onChange={(e) => setExportTitle(e.target.value)}
                                                placeholder="Entrez le titre du rapport"
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <Label>Description (optionnel)</Label>
                                            <Textarea
                                                value={exportDescription}
                                                onChange={(e) => setExportDescription(e.target.value)}
                                                placeholder="Description du rapport..."
                                                rows={3}
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Sélection des propriétés */}
                                {/* <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <h3 className="font-semibold text-md">Propriétés à inclure</h3>
                                        <Badge variant="secondary">
                                            {selectedProperties.length || "Toutes"} sélectionnées
                                        </Badge>
                                    </div>
                                    
                                    <div className="p-2 space-y-2 overflow-y-auto border rounded-md max-h-32">
                                        <div className="flex items-center justify-between p-2 border-b">
                                            <Label className="text-sm">Sélection multiple</Label>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={handleSelectAllProperties}
                                            >
                                                {selectedProperties.length === mockProperties.length ? "Tout désélectionner" : "Tout sélectionner"}
                                            </Button>
                                        </div>
                                        
                                        {mockProperties.map((property) => (
                                            <div
                                                key={property.id}
                                                className="flex items-center justify-between p-2 rounded hover:bg-gray-50"
                                            >
                                                <Label className="flex items-center flex-1 gap-2 cursor-pointer">
                                                    <input
                                                        type="checkbox"
                                                        checked={selectedProperties.includes(property.id)}
                                                        onChange={() => handlePropertySelection(property.id)}
                                                        className="border-gray-300 rounded"
                                                    />
                                                    <span className="text-sm">
                                                        {property.name} ({property.area}m²)
                                                    </span>
                                                    <Badge variant={property.status === "BATI" ? "default" : "secondary"}>
                                                        {property.status}
                                                    </Badge>
                                                </Label>
                                            </div>
                                        ))}
                                    </div>
                                </div> */}

                                {/* Options avancées */}
                                {/* <div className="space-y-4">
                                    <Button
                                        variant="outline"
                                        className="w-full"
                                        onClick={() => setShowAdvancedOptions(!showAdvancedOptions)}
                                    >
                                        <Settings className="w-4 h-4 mr-2" />
                                        {showAdvancedOptions ? "Masquer les options avancées" : "Options avancées"}
                                    </Button>

                                    {showAdvancedOptions && (
                                        <div className="p-4 space-y-4 border rounded-md">
                                            <div className="space-y-2">
                                                <Label>Filtres avancés</Label>
                                                <div className="grid grid-cols-2 gap-3">
                                                    <Select
                                                        value={dataFilters.region}
                                                        onValueChange={(value) => handleFilterChange('region', value)}
                                                    >
                                                        <SelectTrigger>
                                                            <SelectValue placeholder="Région" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="region1">Région 1</SelectItem>
                                                            <SelectItem value="region2">Région 2</SelectItem>
                                                        </SelectContent>
                                                    </Select>

                                                    <Select
                                                        value={dataFilters.propertyType}
                                                        onValueChange={(value) => handleFilterChange('propertyType', value)}
                                                    >
                                                        <SelectTrigger>
                                                            <SelectValue placeholder="Type" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="BATI">Bâti</SelectItem>
                                                            <SelectItem value="NON_BATI">Non bâti</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div> */}

                                {/* Actions */}
                                <div className="flex gap-3 pt-4 border-t">
                                    <Button
                                        variant="outline"
                                        onClick={handleResetConfig}
                                        disabled={isGenerating}
                                        className="flex-1"
                                    >
                                        Réinitialiser
                                    </Button>
                                    <Button
                                        onClick={generatePDF}
                                        disabled={isGenerating}
                                        className="flex-1"
                                    >
                                        {isGenerating ? (
                                            <>
                                                <div className="w-4 h-4 mr-2 border-b-2 border-white rounded-full animate-spin" />
                                                Génération...
                                            </>
                                        ) : (
                                            <>
                                                <Download className="w-4 h-4 mr-2" />
                                                Exporter en PDF
                                            </>
                                        )}
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </motion.div>
        </AnimatePresence>
    );
}

export default ExportMenu;