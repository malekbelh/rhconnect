import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import { Logo } from '../common/Logo';

const NavbarPublic: React.FC = () => {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <nav className="bg-paper/95 backdrop-blur-sm border-b border-neutral-200 sticky top-0 z-50" aria-label="Navigation principale">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center min-h-16 py-3">
          <div className="flex items-center gap-2">
            <Link to="/" className="flex items-center" onClick={() => setMenuOpen(false)} aria-label="RhConnect Accueil">
              <Logo size="md" variant="light" />
            </Link>
          </div>

          <div className="hidden md:flex items-center gap-7">
            <Link to="/" className="text-neutral-700 hover:text-signal font-medium">Accueil</Link>
            <a href="/#candidats" className="text-neutral-700 hover:text-signal font-medium">Candidats</a>
            <a href="/#entreprises" className="text-neutral-700 hover:text-signal font-medium">Entreprises</a>
            <a href="/#offres" className="text-neutral-700 hover:text-signal font-medium">Offres</a>
          </div>

          <div className="hidden md:flex items-center gap-3">
            <Link to="/auth/login" className="px-3 py-2 text-neutral-700 hover:text-signal font-medium">Connexion</Link>
            <Link to="/auth/register" className="inline-flex items-center px-4 py-2 bg-signal hover:bg-primary-700 text-white font-semibold rounded-lg">Créer un profil</Link>
          </div>

          <button type="button" className="md:hidden p-2 text-ink" aria-label={menuOpen ? 'Fermer le menu' : 'Ouvrir le menu'} aria-expanded={menuOpen} onClick={() => setMenuOpen(!menuOpen)}>
            {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {menuOpen && (
          <div className="md:hidden border-t border-neutral-200 py-4 space-y-1">
            <a href="/#candidats" onClick={() => setMenuOpen(false)} className="block px-3 py-2 text-neutral-700">Candidats</a>
            <a href="/#entreprises" onClick={() => setMenuOpen(false)} className="block px-3 py-2 text-neutral-700">Entreprises</a>
            <a href="/#offres" onClick={() => setMenuOpen(false)} className="block px-3 py-2 text-neutral-700">Offres</a>
            <Link to="/auth/login" onClick={() => setMenuOpen(false)} className="block px-3 py-2 text-neutral-700">Connexion</Link>
            <Link to="/auth/register" onClick={() => setMenuOpen(false)} className="block mt-2 px-3 py-2 rounded-lg bg-signal text-white font-semibold">Créer un profil</Link>
          </div>
        )}
      </div>
    </nav>
  );
};

export default NavbarPublic;
