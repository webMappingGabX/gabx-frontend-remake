import { Link } from 'react-router-dom';

function NotFound() {
  return (
    <div className="flex items-center justify-center min-h-screen p-6 bg-background">
      <main role="main" aria-labelledby="notfound-title" className="max-w-lg text-center">
        <p className="mb-4 text-6xl">🚫</p>
        <h1 id="notfound-title" className="mb-3 text-3xl font-semibold text-foreground">
          Page introuvable
        </h1>
        <p className="mb-6 text-muted-foreground">
          Désolé, la page que vous recherchez n'existe pas ou a été déplacée.
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          <Link 
            to="/map" 
            className="px-4 py-2.5 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            Retour à l'accueil
          </Link>
          <Link 
            to="/auth/login" 
            className="px-4 py-2.5 rounded-lg border border-primary text-primary hover:bg-primary/10 transition-colors"
          >
            Se connecter
          </Link>
        </div>
      </main>
    </div>
  );
}

export default NotFound;


