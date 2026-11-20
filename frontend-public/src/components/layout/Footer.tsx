import React from 'react';
import { ExternalLink, Mail, Phone } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Logo } from '../common/Logo';

const Footer: React.FC = () => {
  return (
    <footer id="site-footer" className="site-footer text-white border-t border-white/10" aria-label="Pied de page">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1fr] gap-8">

          <div>
            <div className="flex items-center mb-3">
              <Logo size="md" variant="dark" />
            </div>
            <p className="text-white/65 text-sm leading-relaxed max-w-xs">
              Des profils lisibles, des offres claires et un suivi qui respecte le temps des candidats comme celui des équipes RH.
            </p>
            <div className="flex gap-3 mt-4">
              <a
                href="mailto:bonjour@rhconnect.tn"
                aria-label="Écrire à RhConnect"
                className="w-8 h-8 rounded-lg border border-white/20 flex items-center justify-center hover:border-primary-400 hover:text-primary-400 transition-colors"
              >
                <Mail className="w-4 h-4" />
              </a>
              <a
                href="https://www.linkedin.com"
                aria-label="RhConnect sur LinkedIn"
                target="_blank"
                rel="noopener noreferrer"
                className="w-8 h-8 rounded-lg border border-white/20 flex items-center justify-center hover:border-primary-400 hover:text-primary-400 transition-colors"
              >
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-3 text-sm">Explorer</h4>
            <ul className="space-y-1.5 text-sm">
              <li><Link to="/" className="text-white/65 hover:text-primary-400 transition-colors">Accueil</Link></li>
              <li><a href="#candidats" className="text-white/65 hover:text-primary-400 transition-colors">Pour les candidats</a></li>
              <li><a href="#entreprises" className="text-white/65 hover:text-primary-400 transition-colors">Pour les entreprises</a></li>
              <li><a href="#offres" className="text-white/65 hover:text-primary-400 transition-colors">Offres d'emploi</a></li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-3 text-sm">Compte</h4>
            <ul className="space-y-1.5 text-sm">
              <li><Link to="/auth/register" className="text-white/65 hover:text-primary-400 transition-colors">S'inscrire</Link></li>
              <li><Link to="/auth/login" className="text-white/65 hover:text-primary-400 transition-colors">Se connecter</Link></li>
              <li><Link to="/terms" className="text-white/65 hover:text-primary-400 transition-colors">Conditions</Link></li>
              <li><Link to="/privacy" className="text-white/65 hover:text-primary-400 transition-colors">Confidentialité</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-3 text-sm">Nous contacter</h4>
            <ul className="space-y-1.5 text-sm">
              <li>
                <a
                  href="mailto:bonjour@rhconnect.tn"
                  className="text-white/65 hover:text-primary-400 transition-colors inline-flex items-center gap-1.5"
                >
                  <Mail className="w-3.5 h-3.5" /> bonjour@rhconnect.tn
                </a>
              </li>
              <li>
                <a
                  href="tel:+21671000000"
                  className="text-white/65 hover:text-primary-400 transition-colors inline-flex items-center gap-1.5"
                >
                  <Phone className="w-3.5 h-3.5" /> +216 71 000 000
                </a>
              </li>
              <li className="text-white/65">Tunis · Sfax · Sousse</li>
            </ul>
          </div>

        </div>

        <div className="border-t border-white/10 mt-6 pt-4 flex flex-col sm:flex-row justify-between items-center gap-3">
          <p className="text-xs text-white/45">
            © {new Date().getFullYear()} RhConnect. Tous droits réservés.
          </p>
          <div className="flex gap-4 text-xs text-white/45">
            <Link to="/terms" className="hover:text-primary-400 transition-colors">Conditions</Link>
            <Link to="/privacy" className="hover:text-primary-400 transition-colors">Confidentialité</Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;