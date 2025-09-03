import { motion } from "framer-motion";
import { 
  Map,
  Layers,
  Users,
  Database,
  Mail,
  Phone,
  Globe,
  Shield,
  Copyright
} from "lucide-react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Link } from "react-router-dom";

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <motion.footer
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      viewport={{ once: true }}
      className="mt-auto border-t bg-slate-50 dark:bg-slate-900"
    >
      {/* Section Principale */}
      <div className="container px-6 py-12 mx-auto">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-2 lg:grid-cols-4">
          
          {/* Colonne 1 : Logo & Description */}
          <div className="space-y-4">
            <Link to="/map" className="flex items-center gap-2">
              <Map className="w-8 h-8 text-blue-600" />
              <span className="text-xl font-bold text-slate-800 dark:text-white">
                GabX
              </span>
            </Link>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Plateforme professionnelle de gestion des données géospatiales et de suivi des parcelles.
            </p>
            
            {/* Contacts */}
            <div className="pt-2 space-y-2">
              <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                <Mail className="w-4 h-4" />
                <span>contact@gabX.com</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                <Phone className="w-4 h-4" />
                <span>+237 6xx xx xx xx</span>
              </div>
            </div>
          </div>

          {/* Colonne 2 : Navigation Principale */}
          <div>
            <h3 className="mb-4 text-lg font-semibold text-slate-800 dark:text-white">Navigation</h3>
            <ul className="space-y-3">
              {[
                { href: "/dashboard", label: "Tableau de bord", icon: <Layers className="w-4 h-4" /> },
                { href: "/parcelles", label: "Parcelles", icon: <Map className="w-4 h-4" /> },
                { href: "/utilisateurs", label: "Utilisateurs", icon: <Users className="w-4 h-4" /> },
                { href: "/donnees", label: "Données", icon: <Database className="w-4 h-4" /> }
              ].map((link, index) => (
                <motion.li 
                  key={index}
                  whileHover={{ x: 3 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  <Link 
                    to={link.href} 
                    className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400"
                  >
                    {link.icon}
                    {link.label}
                  </Link>
                </motion.li>
              ))}
            </ul>
          </div>

          {/* Colonne 3 : Ressources */}
          <div>
            <h3 className="mb-4 text-lg font-semibold text-slate-800 dark:text-white">Ressources</h3>
            <ul className="space-y-3">
              {[
                { href: "/documentation", label: "Documentation" },
                { href: "/guides", label: "Guides d'utilisation" },
                { href: "/api", label: "API" },
                { href: "/support", label: "Support technique" }
              ].map((link, index) => (
                <motion.li 
                  key={index}
                  whileHover={{ x: 3 }}
                >
                  <Link 
                    to={link.href} 
                    className="text-sm text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400"
                  >
                    {link.label}
                  </Link>
                </motion.li>
              ))}
            </ul>
          </div>

          {/* Colonne 4 : Newsletter */}
          <div>
            <h3 className="mb-4 text-lg font-semibold text-slate-800 dark:text-white">Restez informé</h3>
            <p className="mb-4 text-sm text-slate-600 dark:text-slate-400">
              Recevez les dernières actualités et mises à jour de la plateforme.
            </p>
            <form className="flex flex-col gap-2">
              <Input 
                type="email" 
                placeholder="Votre email professionnel" 
                className="text-sm bg-white dark:bg-slate-800"
                required
              />
              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Button type="submit" className="w-full text-sm" size="sm">
                  S'inscrire
                </Button>
              </motion.div>
            </form>
          </div>
        </div>

        {/* Séparateur */}
        <div className="my-8 border-t border-slate-200 dark:border-slate-700"></div>

        {/* Section Inférieure */}
        <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
          <div className="flex items-center gap-1 text-sm text-slate-500 dark:text-slate-500">
            <Copyright className="w-4 h-4" />
            <span>{currentYear} GabX. Tous droits réservés.</span>
          </div>
          
          <div className="flex flex-wrap items-center justify-center gap-6 text-sm">
            {[
              { href: "/confidentialite", label: "Confidentialité", icon: <Shield className="w-4 h-4" /> },
              { href: "/conditions", label: "Conditions d'utilisation", icon: <Globe className="w-4 h-4" /> },
              { href: "/mentions", label: "Mentions légales" }
            ].map((link, index) => (
              <Link 
                key={index}
                to={link.href}
                className="flex items-center gap-1 text-slate-500 dark:text-slate-500 hover:text-blue-600 dark:hover:text-blue-400"
              >
                {link.icon && link.icon}
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </motion.footer>
  );
};

export default Footer;