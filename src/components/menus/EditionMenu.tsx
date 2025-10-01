import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent } from "../ui/card";
import { Button } from "../ui/button";
import { Download, File, X, Save, Building, Plus, Trash2 } from "lucide-react";
import { closeMenu } from "../../app/store/slices/settingSlice";
import { useDispatch, useSelector } from "react-redux";
import { useToast } from "../../hooks/useToast";
import { useNavigate } from "react-router-dom";
import { setCurrentPlot } from "../../app/store/slices/plotSlice";

const EditionMenu = () => {
    const dispatch = useDispatch();
    const { toast } = useToast();
    const navigate = useNavigate();

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0, y: 100 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 0 }}
                className="absolute z-[1100] md:max-w-xl md:min-w-sm md:w-auto w-[90%] bottom-4 left-1/2 -translate-x-1/2 max-h-[400px]"
            >
                <Card className="py-2">
                    <CardContent className="p-4">
                        <div className="flex flex-col items-start justify-between max-h-[300px] overflow-y-auto">
                            <h1 className="relative flex flex-row items-center w-full mb-4 font-bold text-gray-500">
                                <Button 
                                    className="absolute flex items-center justify-center font-bold text-black bg-transparent shadow-none cursor-pointer right-2 hover:bg-gray-300/90"
                                    onClick={() => dispatch(closeMenu())}
                                >
                                    <X className="w-4 h-4" />
                                </Button>
                                <File className="w-4 h-4 mr-2" />
                                EDITION MENU
                            </h1>
                            <div className="w-full overflow-auto ">
                                <Button
                                    variant="outline"
                                    className="flex flex-col items-center h-auto cursor-pointer"
                                    onClick={async () => {
                                        await dispatch(setCurrentPlot(null));
                                        
                                        navigate("/map/plot-edition", {
                                            state: {
                                                editingMode: false
                                            }
                                        })
                                    }}
                                >
                                    <Plus className="w-5 h-5"/>
                                    <span>Ajouter une nouvelle entité</span>
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </motion.div>
        </AnimatePresence>
    );
}

export default EditionMenu;