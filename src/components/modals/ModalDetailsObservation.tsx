import { useEffect } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
  } from "../ui/dialog";
  
  interface ObservationDetailsModalProps {
    observation: null;
    isOpen: boolean;
    onClose: () => void;
  }
  
  const ObservationDetailsModal = ({ observation, isOpen, onClose }: ObservationDetailsModalProps) => {
    useEffect(() => {
        console.log("CURRENT OBSERVATION", observation);
    }, []);

    if (!observation) return null;
    

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
            <DialogTitle>Détails de l'observation</DialogTitle>
            </DialogHeader>
            
            <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
                <div>
                <h4 className="font-medium text-gray-500">Catégorie</h4>
                <p className="mt-1">{observation.category}</p>
                </div>
                <div>
                <h4 className="font-medium text-gray-500">Échelle d'état</h4>
                <p className="mt-1">{observation.scale}/10</p>
                </div>
            </div>

            <div>
                <h4 className="font-medium text-gray-500">Contenu</h4>
                <p className="p-3 mt-1 rounded-md bg-gray-50">{observation.content}</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div>
                <h4 className="font-medium text-gray-500">Créée par</h4>
                <p className="mt-1">{observation.user?.username} ({observation.user?.email})</p>
                <p className="text-sm text-gray-500">{observation.User?.email}</p>
                </div>
                <div>
                <h4 className="font-medium text-gray-500">Date de création</h4>
                <p className="mt-1">
                    {new Date(observation.createdAt).toLocaleDateString('fr-FR')}
                </p>
                </div>
            </div>

            <div>
                <h4 className="font-medium text-gray-500">Dernière modification</h4>
                <p className="mt-1">
                {new Date(observation.updatedAt).toLocaleDateString('fr-FR')}
                </p>
            </div>
            </div>
        </DialogContent>
        </Dialog>
    );
  };
  
  export default ObservationDetailsModal;