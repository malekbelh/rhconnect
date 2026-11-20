import React from 'react';
import { Link } from 'react-router-dom';
import { Home, ArrowLeft } from 'lucide-react';

const NotFoundPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50 flex items-center justify-center px-4">
      <div className="text-center max-w-lg">
        <div className="relative mb-10">
          <h1 className="text-[140px] sm:text-[200px] font-black leading-none bg-gradient-to-r from-primary-500 via-secondary-500 to-accent-500 bg-clip-text text-transparent">
            404
          </h1>
          <div className="absolute -top-8 left-1/2 -translate-x-1/2 w-32 h-32 bg-primary-500/10 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-1/4 w-24 h-24 bg-secondary-500/10 rounded-full blur-2xl" />
        </div>

        <h2 className="text-2xl sm:text-3xl font-bold text-neutral-900 mb-3">
          Page introuvable
        </h2>
        <p className="text-neutral-600 mb-10 leading-relaxed">
          Oups ! La page que vous recherchez semble avoir disparu dans les méandres
          de RhConnect. Vérifiez l'URL ou revenez à l'accueil.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            to="/"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-primary-500 hover:bg-primary-700 text-white font-semibold rounded-xl shadow-lg shadow-primary-500/25 hover:shadow-xl hover:shadow-primary-500/30 transition-all"
          >
            <Home className="w-5 h-5" />
            Retour à l'accueil
          </Link>
          <button
            type="button"
            onClick={() => window.history.back()}
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-white hover:bg-neutral-50 text-neutral-700 font-semibold rounded-xl border border-neutral-300 hover:border-neutral-400 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            Page précédente
          </button>
        </div>
      </div>
    </div>
  );
};

export default NotFoundPage;
