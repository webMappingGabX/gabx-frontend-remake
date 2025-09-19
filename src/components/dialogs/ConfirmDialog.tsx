import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
  } from "../ui/dialog";
  import { Button } from "../ui/button";
  import { AlertTriangle, Trash2, X, HelpCircle, AlertCircle } from "lucide-react";
  
  export interface ConfirmDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    description: string;
    confirmText?: string;
    cancelText?: string;
    variant?: "destructive" | "warning" | "default";
    isLoading?: boolean;
  }
  
  const ConfirmDialog = ({
    isOpen,
    onClose,
    onConfirm,
    title,
    description,
    confirmText = "Confirmer",
    cancelText = "Annuler",
    variant = "destructive",
    isLoading = false
  }: ConfirmDialogProps) => {
    const handleConfirm = () => {
      onConfirm();
    };
  
    const handleClose = () => {
      if (!isLoading) {
        onClose();
      }
    };
  
    const getVariantStyles = () => {
      switch (variant) {
        case "destructive":
          return {
            icon: <AlertCircle className="w-6 h-6 text-destructive" />,
            button: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
          };
        case "warning":
          return {
            icon: <AlertTriangle className="w-6 h-6 text-amber-500" />,
            button: "bg-amber-500 text-amber-50 hover:bg-amber-500/90",
          };
        default:
          return {
            icon: <HelpCircle className="w-6 h-6 text-primary" />,
            button: "bg-primary text-primary-foreground hover:bg-primary/90",
          };
      }
    };
  
    const variantStyles = getVariantStyles();
  
    return (
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-3">
              {variantStyles.icon}
              <DialogTitle>{title}</DialogTitle>
            </div>
            <DialogDescription>{description}</DialogDescription>
          </DialogHeader>
  
          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isLoading}
              className="cursor-pointer"
            >
              {cancelText}
            </Button>
            <Button
              type="button"
              onClick={handleConfirm}
              disabled={isLoading}
              className={`cursor-pointer ${variantStyles.button}`}
            >
              {isLoading ? (
                "Traitement..."
              ) : (
                confirmText
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  };
  
  export default ConfirmDialog;