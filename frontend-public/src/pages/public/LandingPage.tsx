import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowUpRight,
  BrainCircuit,
  Check,
  ChevronRight,
  FileCheck2,
  MapPin,
  Search,
  ShieldCheck,
  UsersRound,
} from 'lucide-react';
import axios from 'axios';

interface PublicStats {
  offresActives: number;
  entreprisesActives: number;
  talentsAccompagnes: number;
  tauxMiseEnRelation: number;
}

const DEFAULT_STATS: PublicStats = {
  offresActives: 0,
  entreprisesActives: 0,
  talentsAccompagnes: 0,
  tauxMiseEnRelation: 0,
};

const offers = [
  {
    title: "Développeur Full Stack",
    company: "InstaDeep",
    place: "Tunis, Tunisie",
    type: "CDI",
    score: 92,
    initials: "ID",
    color: "bg-primary-500",
  },
  {
    title: "Chargé(e) de recrutement",
    company: "Vermeg",
    place: "Sfax, Tunisie",
    type: "CDI",
    score: 88,
    initials: "VG",
    color: "bg-success-500",
  },
  {
    title: "Ingénieur DevOps",
    company: "Telnet Holding",
    place: "Ariana, Tunisie",
    type: "CDI",
    score: 85,
    initials: "TH",
    color: "bg-accent-500",
  },
  {
    title: "Stage Marketing Digital",
    company: "Jumia Tunisie",
    place: "Tunis, Tunisie",
    type: "Stage",
    score: 79,
    initials: "JT",
    color: "bg-danger-500",
  },
];

/** Détecte si l'élément est entré dans le viewport, une seule fois (pas de rejeu au scroll). */
function useInView<T extends HTMLElement>(threshold = 0.3) {
  const ref = useRef<T | null>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          observer.disconnect();
        }
      },
      { threshold }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [threshold]);

  return { ref, inView };
}

/** Anime un nombre de 0 jusqu'à sa valeur cible une fois visible à l'écran. */
function useCountUp(target: number, inView: boolean, duration = 1200) {
  const [value, setValue] = useState(0);

  useEffect(() => {
    if (!inView) return;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setValue(target);
      return;
    }

    let start: number | null = null;
    let frame: number;

    const step = (timestamp: number) => {
      if (start === null) start = timestamp;
      const progress = Math.min((timestamp - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(eased * target));
      if (progress < 1) frame = requestAnimationFrame(step);
    };

    frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame);
  }, [inView, target, duration]);

  return value;
}

/** Bloc "reveal" générique : fondu + léger déplacement vers le haut à l'entrée dans le viewport. */
const Reveal: React.FC<{ children: React.ReactNode; delay?: number; className?: string }> = ({
  children,
  delay = 0,
  className = "",
}) => {
  const { ref, inView } = useInView<HTMLDivElement>(0.2);

  return (
    <div
      ref={ref}
      className={`transition-all duration-700 ease-out motion-reduce:transition-none motion-reduce:transform-none ${inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
        } ${className}`}
      style={{ transitionDelay: inView ? `${delay}ms` : "0ms" }}
    >
      {children}
    </div>
  );
};

const StatBlock: React.FC<{ value: number; suffix?: string; label: string; accent?: boolean }> = ({
  value,
  suffix = "",
  label,
  accent = false,
}) => {
  const { ref, inView } = useInView<HTMLDivElement>(0.5);
  const count = useCountUp(value, inView);

  return (
    <div ref={ref} className="lg:px-6">
      <strong
        className={`font-display text-5xl lg:text-6xl font-semibold tracking-tight block leading-none ${accent ? "text-clay-700" : ""
          }`}
      >
        {count}
        {suffix}
      </strong>
      <p className="text-sm font-semibold mt-3 text-ink/60">{label}</p>
    </div>
  );
};

const LandingPage: React.FC = () => {
  const [heroVisible, setHeroVisible] = useState(false);
  const [stats, setStats] = useState<PublicStats>(DEFAULT_STATS);

  useEffect(() => {
    // Déclenche l'entrée du hero juste après le montage, pour laisser
    // le navigateur peindre l'état initial avant de lancer la transition.
    const id = requestAnimationFrame(() => setHeroVisible(true));

    // Charge les stats publiques depuis l'API (sans auth requise)
    axios
      .get<PublicStats>('http://localhost:8080/api/public/stats')
      .then((res) => setStats(res.data))
      .catch(() => {
        // En cas d'erreur, conserver les valeurs initiales (0)
      });

    return () => cancelAnimationFrame(id);
  }, []);

  return (
    <div className="home-page">
      <section className="home-dark-section overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24">
          <div className="grid lg:grid-cols-[1.05fr_0.95fr] gap-12 lg:gap-20 items-end">
            <div className="hero-signature max-w-2xl">
              <h1
                className={`font-display text-3xl sm:text-5xl lg:text-6xl leading-[0.98] tracking-tight transition-all duration-700 ease-out motion-reduce:transition-none motion-reduce:transform-none ${heroVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
                  }`}
              >
                Les rencontres professionnelles commencent par une bonne lecture.
              </h1>
              <p
                className={`text-lg text-white/70 leading-relaxed mt-8 max-w-xl transition-all duration-700 ease-out motion-reduce:transition-none motion-reduce:transform-none ${heroVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
                  }`}
                style={{ transitionDelay: heroVisible ? "120ms" : "0ms" }}
              >
                Un espace commun pour les talents qui avancent et les équipes qui recrutent. Des dossiers compréhensibles, des étapes visibles, des décisions plus justes.
              </p>
              <div
                className={`flex flex-col sm:flex-row gap-3 mt-9 transition-all duration-700 ease-out motion-reduce:transition-none motion-reduce:transform-none ${heroVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
                  }`}
                style={{ transitionDelay: heroVisible ? "240ms" : "0ms" }}
              >
                <Link to="/auth/register" className="inline-flex items-center justify-center gap-2 rounded-lg bg-accent-500 px-5 py-3 text-ink font-bold hover:bg-white transition-colors">
                  <Search className="w-4 h-4" /> Je cherche un emploi
                </Link>
                <Link to="/auth/register" className="inline-flex items-center justify-center gap-2 rounded-lg border border-white/30 px-5 py-3 text-white font-semibold hover:border-accent-500 hover:text-accent-500 transition-colors">
                  <UsersRound className="w-4 h-4" /> Je recrute
                </Link>
              </div>
            </div>

            <div
              className={`relative border border-white/20 bg-white/[0.06] p-6 sm:p-8 lg:-mb-8 transition-all duration-700 ease-out motion-reduce:transition-none motion-reduce:transform-none ${heroVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
                }`}
              style={{ transitionDelay: heroVisible ? "180ms" : "0ms" }}
            >
              <div className="flex justify-between items-start gap-4 pb-5 border-b border-white/15">
                <div>
                  <p className="text-xs font-semibold text-white/50">Dossier 0048</p>
                  <h2 className="font-display text-2xl mt-2">Marie Dupont</h2>
                  <p className="text-sm text-white/60 mt-1">Développeuse Fullstack · Tunis</p>
                </div>
                <span className="px-2 py-1 text-xs font-bold bg-success-500 text-white">Vérifié</span>
              </div>
              <div className="mt-7 space-y-5">
                <div className="flex gap-4 items-center">
                  <span className="w-3 h-3 bg-success-500 rounded-full ring-4 ring-success-500/20" />
                  <div className="flex-1">
                    <p className="font-semibold">Profil complet</p>
                    <p className="text-sm text-white/50">Compétences et CV contrôlés</p>
                  </div>
                  <Check className="w-4 h-4 text-success-500" />
                </div>
                <div className="h-px bg-white/10 ml-1" />
                <div className="flex gap-4 items-center">
                  <span className="w-3 h-3 bg-primary-500 rounded-full ring-4 ring-primary-500/20" />
                  <div className="flex-1">
                    <p className="font-semibold">Candidature transmise</p>
                    <p className="text-sm text-white/50">Vermeg · il y a 2 jours</p>
                  </div>
                  <span className="text-xs text-accent-500 font-semibold">En cours</span>
                </div>
                <div className="h-px bg-white/10 ml-1" />
                <div className="flex gap-4 items-center opacity-45">
                  <span className="w-3 h-3 bg-white/50 rounded-full" />
                  <div className="flex-1">
                    <p className="font-semibold">Entretien</p>
                    <p className="text-sm text-white/50">La prochaine étape</p>
                  </div>
                </div>
              </div>
              <div className="mt-8 flex justify-between items-center border-t border-white/15 pt-5">
                <span className="text-sm text-white/60">Correspondance avec l'offre</span>
                <span className="font-display text-3xl text-accent-500">92%</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="home-stats-section bg-accent-500 border-b border-ink/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 grid grid-cols-2 lg:grid-cols-4 gap-8 lg:divide-x lg:divide-ink/10 text-center">
          <StatBlock value={stats.offresActives} label="offres ouvertes" />
          <StatBlock value={stats.entreprisesActives} label="entreprises actives" />
          <StatBlock value={stats.talentsAccompagnes} label="talents accompagnés" />
          <StatBlock value={stats.tauxMiseEnRelation} suffix="%" label="de mise en relation" accent />
        </div>
      </section>

      <section id="candidats" className="home-light-section">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="grid lg:grid-cols-[0.7fr_1.3fr] gap-14">

            <div className="lg:sticky lg:top-24 lg:self-start text-center lg:text-left">
              <h2 className="font-display text-4xl sm:text-5xl mt-5">Votre recherche mérite mieux qu'un silence.</h2>
              <p className="text-neutral-600 text-lg mt-5 leading-relaxed">RhConnect vous donne un dossier solide et une vue claire sur ce qui se passe après "envoyer".</p>
              <Link to="/auth/register" className="inline-flex items-center gap-2 mt-7 text-primary-500 font-bold mx-auto lg:mx-0">Construire mon profil <ArrowUpRight className="w-4 h-4" /></Link>
            </div>

            <div className="relative border-t border-neutral-200 pt-8">
              <div className="absolute left-[27px] top-8 bottom-8 w-px bg-neutral-200 hidden sm:block" />

              <div className="flex flex-col gap-12">
                {[
                  { n: "01", title: "Présenter l'essentiel", text: "Compétences, expériences et envies réunies dans un profil qui se lit vraiment." },
                  { n: "02", title: "Candidater avec justesse", text: "Le matching vous aide à repérer les postes qui ont du sens pour vous." },
                  { n: "03", title: "Voir l'avancée", text: "Reçu, vérifié, transmis, entretien : les étapes ne disparaissent plus." },
                  { n: "04", title: "Préparer la suite", text: "Une réponse claire vous permet d'avancer, quel que soit le résultat." },
                ].map((step, i) => (
                  <Reveal key={step.n} delay={i * 100} className="flex gap-6 sm:gap-8">
                    <span className="font-display text-2xl w-14 h-14 shrink-0 rounded-full border border-neutral-200 flex items-center justify-center relative z-10 bg-[var(--color-page,#fff)]">
                      {step.n}
                    </span>
                    <div className="pt-2">
                      <h3 className="font-display text-xl">{step.title}</h3>
                      <p className="text-neutral-600 mt-2">{step.text}</p>
                    </div>
                  </Reveal>
                ))}
              </div>
            </div>

          </div>
        </div>
      </section>

      <section id="entreprises" className="home-paper-section border-y border-neutral-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="flex flex-col lg:flex-row justify-between gap-14">

            <div className="max-w-xl text-center lg:text-left lg:sticky lg:top-24 lg:self-start">
              <h2 className="font-display text-4xl sm:text-5xl mt-5">Moins de tri. Plus de conversations utiles.</h2>
              <p className="text-neutral-600 text-lg mt-5 leading-relaxed">Publiez votre besoin, recevez des dossiers vérifiés et concentrez-vous sur les personnes derrière les CV.</p>
            </div>

            <div className="lg:w-[45%] relative">
              <div className="absolute left-[27px] top-2 bottom-24 w-px bg-neutral-200 hidden sm:block" />

              <div className="flex flex-col gap-10">
                {[
                  { n: "01", title: "Publier une offre claire", text: "Les bons critères attirent les bons profils." },
                  { n: "02", title: "Lire des dossiers complets", text: "Les pièces importantes sont déjà structurées." },
                  { n: "03", title: "Décider au bon moment", text: "Chaque candidature avance avec un statut compréhensible." },
                ].map((step, i) => (
                  <Reveal key={step.n} delay={i * 100} className="flex gap-6">
                    <span className="font-display text-xl w-14 h-14 shrink-0 rounded-full border border-neutral-200 flex items-center justify-center relative z-10 bg-[var(--color-page,#fff)]">
                      {step.n}
                    </span>
                    <div className="pt-2">
                      <p className="font-display text-xl">{step.title}</p>
                      <p className="text-neutral-600 mt-1">{step.text}</p>
                    </div>
                  </Reveal>
                ))}
              </div>

              <Link to="/auth/register" className="inline-flex items-center gap-2 bg-ink text-white px-5 py-3 rounded-lg font-semibold mt-10 ml-20">
                Publier une offre <ArrowUpRight className="w-4 h-4" />
              </Link>
            </div>

          </div>
        </div>
      </section>

      <section id="offres" className="home-light-section">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">

          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-5 mb-12">
            <div>
              <h2 className="font-display text-4xl mt-4">Des postes à regarder de près.</h2>
            </div>
            <Link to="/auth/register" className="inline-flex items-center gap-1 text-primary-500 font-semibold">
              Toutes les offres <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="divide-y divide-neutral-200 border-y border-neutral-200">
            {offers.map((offer, i) => (
              <Reveal key={offer.title} delay={i * 80}>
                <Link
                  to="/auth/register"
                  className="group grid grid-cols-1 md:grid-cols-[auto_1fr_auto_auto] items-center gap-4 md:gap-8 py-6 px-2 -mx-2 hover:bg-neutral-50 transition-colors"
                >
                  <span className="font-display text-sm text-neutral-300 md:w-8 hidden md:block">
                    {String(i + 1).padStart(2, "0")}
                  </span>

                  <div className="flex items-center gap-4">
                    <div className={`w-11 h-11 ${offer.color} text-white flex items-center justify-center font-display font-bold shrink-0 rounded-lg`}>
                      {offer.initials}
                    </div>
                    <div>
                      <h3 className="font-display text-lg group-hover:text-primary-500 transition-colors">{offer.title}</h3>
                      <p className="text-sm text-neutral-500 mt-0.5">{offer.company}</p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-x-5 gap-y-1 text-sm text-neutral-600 md:justify-self-end">
                    <span className="inline-flex items-center gap-1">
                      <MapPin className="w-4 h-4 text-neutral-400" />
                      {offer.place}
                    </span>
                    <span className="text-neutral-400">{offer.type}</span>
                  </div>

                  <div className="flex items-center gap-4 md:justify-self-end">
                    <span className="text-sm font-semibold text-success-700 bg-success-50 px-3 py-1 rounded-full">
                      {offer.score} match
                    </span>
                    <ChevronRight className="hidden md:block w-5 h-5 text-neutral-300 group-hover:text-primary-500 group-hover:translate-x-0.5 transition-all" />
                  </div>
                </Link>
              </Reveal>
            ))}
          </div>

        </div>
      </section>

      <section className="home-dark-section">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="grid lg:grid-cols-[1fr_1fr] gap-14 items-center">

            <Reveal>
              <h2 className="font-display text-4xl sm:text-5xl">Un recrutement qui laisse une trace utile.</h2>
              <p className="text-white/70 text-lg mt-5 max-w-lg">Les outils ne remplacent pas le jugement humain. Ils lui donnent de meilleurs repères.</p>
            </Reveal>

            <div className="space-y-6 border-l border-white/20 pl-7">
              {[
                { Icon: ShieldCheck, color: "text-success-500", title: "Dossiers vérifiés.", text: "Les candidats savent quoi compléter, les RH savent quoi lire." },
                { Icon: FileCheck2, color: "text-accent-500", title: "Suivi transparent.", text: "Les statuts expliquent une situation au lieu de la masquer." },
                { Icon: BrainCircuit, color: "text-primary-500", title: "Assistance IA.", text: "Des conseils concrets pour préparer un profil ou une candidature." },
              ].map((item, i) => (
                <Reveal key={item.title} delay={i * 100} className="flex gap-4">
                  <item.Icon className={`w-6 h-6 ${item.color} shrink-0`} />
                  <p><strong className="text-white">{item.title}</strong> <span className="text-white/65">{item.text}</span></p>
                </Reveal>
              ))}
            </div>

          </div>
        </div>
      </section>

      <section className="home-signal-section">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="grid md:grid-cols-[2fr_1fr] gap-10 md:gap-16 items-end">

            <Reveal>
              <h2 className="font-display text-4xl sm:text-5xl leading-[1.1]">
                La prochaine bonne rencontre<br className="hidden sm:block" />
                peut commencer aujourd'hui.
              </h2>
              <p className="text-white/70 text-lg mt-5 max-w-md">
                Choisissez votre parcours. RhConnect s'occupe de rendre la suite lisible.
              </p>
            </Reveal>

            <Reveal delay={150} className="flex flex-col gap-3 w-full">
              <Link to="/auth/register" className="w-full px-6 py-4 bg-white text-ink rounded-lg font-bold text-center hover:bg-white/90 transition-colors">
                Créer mon profil
              </Link>
              <Link to="/auth/register" className="w-full px-6 py-4 border border-white/30 text-white font-semibold text-center rounded-lg hover:border-white/60 transition-colors">
                Recruter un talent →
              </Link>
            </Reveal>

          </div>
        </div>
      </section>
    </div>
  );
};

export default LandingPage;