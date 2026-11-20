import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  Users,
  Briefcase,
  Target,
  Download,
  Loader2,
  AlertCircle,
  BarChart3,
  PieChart,
  Clock,
} from 'lucide-react';
import { getMyOffers, getOfferApplications } from '../../api/company.api';

interface OfferStats {
  offerId: string;
  offerTitle: string;
  totalApplications: number;
  statusBreakdown: Record<string, number>;
  applicationsPerDay: number;
  avgProcessingDays: number;
}

const CompanyStatsPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [offers, setOffers] = useState<any[]>([]);
  const [offerStats, setOfferStats] = useState<OfferStats[]>([]);
  const [exportingCSV, setExportingCSV] = useState(false);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      setLoading(true);
      setError(null);

      // Load offers
      const offersData = await getMyOffers();
      setOffers(offersData);

      // Load applications for each offer and calculate stats
      const stats: OfferStats[] = [];
      for (const offer of offersData) {
        try {
          const apps = await getOfferApplications(offer.id);
          const statusBreakdown: Record<string, number> = {};
          
          apps.forEach((app: any) => {
            const status = app.status || app.statut || 'UNKNOWN';
            statusBreakdown[status] = (statusBreakdown[status] || 0) + 1;
          });

          // Calculate average processing days
          const avgProcessingDays = apps.length > 0
            ? Math.round(
                apps.reduce((sum: number, app: any) => {
                  const createdDate = new Date(app.dateSoumission || app.createdAt);
                  const updatedDate = new Date(app.updatedAt || app.dateSoumission || app.createdAt);
                  return sum + (updatedDate.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24);
                }, 0) / apps.length
              )
            : 0;

          // Applications per day (since offer creation)
          const createdDate = new Date(offer.createdAt);
          const daysSinceCreation = Math.max(1, Math.floor((Date.now() - createdDate.getTime()) / (1000 * 60 * 60 * 24)));
          const applicationsPerDay = parseFloat((apps.length / daysSinceCreation).toFixed(2));

          stats.push({
            offerId: offer.id,
            offerTitle: offer.title,
            totalApplications: apps.length,
            statusBreakdown,
            applicationsPerDay,
            avgProcessingDays: Math.max(0, avgProcessingDays),
          });
        } catch (err) {
          console.error(`Error loading stats for offer ${offer.id}:`, err);
        }
      }

      setOfferStats(stats);
    } catch (err: any) {
      setError(err.message || 'Erreur lors du chargement des statistiques');
    } finally {
      setLoading(false);
    }
  };

  const getOverviewStats = () => {
    const totalOffers = offers.length;
    const totalApplications = offerStats.reduce((sum, o) => sum + o.totalApplications, 0);
    const acceptedApplications = offerStats.reduce(
      (sum, o) => sum + (o.statusBreakdown['ACCEPTE'] || 0),
      0
    );
    const conversionRate = totalApplications > 0 ? ((acceptedApplications / totalApplications) * 100).toFixed(1) : '0';
    const avgProcessing = offerStats.length > 0
      ? Math.round(offerStats.reduce((sum, o) => sum + o.avgProcessingDays, 0) / offerStats.length)
      : 0;

    return {
      totalOffers,
      totalApplications,
      acceptedApplications,
      conversionRate,
      avgProcessing,
    };
  };

  const handleExportCSV = async () => {
    try {
      setExportingCSV(true);
      const overview = getOverviewStats();

      // Create CSV content
      let csv = 'RhConnect - Statistiques Entreprise\n\n';
      csv += 'VUE D\'ENSEMBLE\n';
      csv += `Offres publiées,${overview.totalOffers}\n`;
      csv += `Candidatures reçues,${overview.totalApplications}\n`;
      csv += `Candidatures acceptées,${overview.acceptedApplications}\n`;
      csv += `Taux de conversion,%,${overview.conversionRate}%\n`;
      csv += `Temps de traitement moyen,jours,${overview.avgProcessing}\n\n`;

      csv += 'STATISTIQUES PAR OFFRE\n';
      csv += 'Titre de l\'offre,Total Candidatures,Acceptées,Rejetées,En Entretien,Transmises,Candidatures/jour,Temps traitement (jours)\n';

      offerStats.forEach((stat) => {
        csv += `"${stat.offerTitle}",`;
        csv += `${stat.totalApplications},`;
        csv += `${stat.statusBreakdown['ACCEPTE'] || 0},`;
        csv += `${stat.statusBreakdown['REFUSE'] || 0},`;
        csv += `${stat.statusBreakdown['ENTRETIEN'] || 0},`;
        csv += `${stat.statusBreakdown['TRANSMIS'] || 0},`;
        csv += `${stat.applicationsPerDay},`;
        csv += `${stat.avgProcessingDays}\n`;
      });

      // Download CSV
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `rhconnect-stats-${new Date().toISOString().split('T')[0]}.csv`;
      link.click();
    } catch (err) {
      console.error('Error exporting CSV:', err);
    } finally {
      setExportingCSV(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 text-[#0F766E] animate-spin" />
        </div>
      </div>
    );
  }

  const overview = getOverviewStats();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-[#172A3A] mt-1">Statistiques de recrutement</h1>
        </div>
        <button
          onClick={handleExportCSV}
          disabled={exportingCSV || offerStats.length === 0}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#0F766E] hover:bg-[#115E59] text-white rounded-xl font-bold text-sm transition-colors disabled:opacity-50 shadow-sm"
        >
          {exportingCSV ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
          Exporter CSV
        </button>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        <div className="bg-white border border-neutral-200 p-6 rounded-2xl shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 bg-[#E6F7F5] rounded-lg flex items-center justify-center">
              <Briefcase className="w-5 h-5 text-[#0F766E]" />
            </div>
            <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-[#E6F7F5] text-[#0F766E]">Offres</span>
          </div>
          <div className="text-3xl font-bold text-[#172A3A]">{overview.totalOffers}</div>
          <p className="text-xs text-[#64748B] mt-1">Offres publiées</p>
        </div>

        <div className="bg-white border border-neutral-200 p-6 rounded-2xl shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
              <Users className="w-5 h-5 text-blue-600" />
            </div>
            <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-600">Vivier</span>
          </div>
          <div className="text-3xl font-bold text-neutral-900">{overview.totalApplications}</div>
          <p className="text-xs text-neutral-500 mt-1">Candidatures reçues</p>
        </div>

        <div className="bg-white border border-neutral-200 p-6 rounded-2xl shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 bg-success-50 rounded-lg flex items-center justify-center">
              <Target className="w-5 h-5 text-success-600" />
            </div>
            <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-success-50 text-success-600">Acceptées</span>
          </div>
          <div className="text-3xl font-bold text-neutral-900">{overview.acceptedApplications}</div>
          <p className="text-xs text-neutral-500 mt-1">Candidatures acceptées</p>
        </div>

        <div className="bg-white border border-neutral-200 p-6 rounded-2xl shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 bg-amber-50 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-amber-600" />
            </div>
            <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-600">Taux</span>
          </div>
          <div className="text-3xl font-bold text-neutral-900">{overview.conversionRate}%</div>
          <p className="text-xs text-neutral-500 mt-1">Taux de conversion</p>
        </div>

        <div className="bg-white border border-neutral-200 p-6 rounded-2xl shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 bg-purple-50 rounded-lg flex items-center justify-center">
              <Clock className="w-5 h-5 text-purple-600" />
            </div>
            <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-purple-50 text-purple-600">Temps</span>
          </div>
          <div className="text-3xl font-bold text-neutral-900">{overview.avgProcessing}</div>
          <p className="text-xs text-neutral-500 mt-1">Jours de traitement moyen</p>
        </div>
      </div>

      {/* Per-Offer Breakdown */}
      {offerStats.length > 0 ? (
        <div className="bg-white border border-neutral-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="p-6 border-b border-neutral-100">
            <h2 className="font-bold text-neutral-900 text-base flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-primary-600" />
              Statistiques détaillées par offre
            </h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-neutral-50 border-b border-neutral-200">
                <tr>
                  <th className="px-6 py-3 font-semibold text-neutral-700">Titre de l'offre</th>
                  <th className="px-6 py-3 font-semibold text-neutral-700 text-center">Total</th>
                  <th className="px-6 py-3 font-semibold text-neutral-700 text-center">Acceptées</th>
                  <th className="px-6 py-3 font-semibold text-neutral-700 text-center">Rejetées</th>
                  <th className="px-6 py-3 font-semibold text-neutral-700 text-center">Entretien</th>
                  <th className="px-6 py-3 font-semibold text-neutral-700 text-center">Transmises</th>
                  <th className="px-6 py-3 font-semibold text-neutral-700 text-right">Cand./jour</th>
                  <th className="px-6 py-3 font-semibold text-neutral-700 text-right">Traitement (j)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200">
                {offerStats.map((stat) => (
                  <tr key={stat.offerId} className="hover:bg-neutral-50 transition-colors">
                    <td className="px-6 py-4">
                      <p className="font-medium text-neutral-900">{stat.offerTitle}</p>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="inline-flex items-center justify-center min-w-[28px] h-[28px] rounded-lg bg-neutral-100 font-semibold text-neutral-700 text-xs">
                        {stat.totalApplications}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="inline-flex items-center justify-center min-w-[28px] h-[28px] rounded-lg bg-success-50 font-semibold text-success-700 text-xs">
                        {stat.statusBreakdown['ACCEPTE'] || 0}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="inline-flex items-center justify-center min-w-[28px] h-[28px] rounded-lg bg-red-50 font-semibold text-red-700 text-xs">
                        {stat.statusBreakdown['REFUSE'] || 0}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="inline-flex items-center justify-center min-w-[28px] h-[28px] rounded-lg bg-blue-50 font-semibold text-blue-700 text-xs">
                        {stat.statusBreakdown['ENTRETIEN'] || 0}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="inline-flex items-center justify-center min-w-[28px] h-[28px] rounded-lg bg-amber-50 font-semibold text-amber-700 text-xs">
                        {stat.statusBreakdown['TRANSMIS'] || 0}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="text-neutral-600 font-medium">{stat.applicationsPerDay}</span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="text-neutral-600 font-medium">{stat.avgProcessingDays}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="bg-white border border-neutral-200 p-12 rounded-2xl text-center">
          <PieChart className="w-12 h-12 text-neutral-300 mx-auto mb-4" />
          <h3 className="font-semibold text-neutral-800 mb-2">Aucune statistique disponible</h3>
          <p className="text-neutral-500 text-sm">
            Créez des offres et commencez à recevoir des candidatures pour voir les statistiques.
          </p>
        </div>
      )}
    </div>
  );
};

export default CompanyStatsPage;
