import React, { useEffect, useState } from 'react';
import {
  ShieldCheck,
  Loader2,
  Upload,
  FileText,
  CheckCircle2,
  XCircle,
  Clock,
  AlertCircle,
  Download,
  Lock,
  FileCheck,
} from 'lucide-react';
import { getMyVerification, uploadVerificationPiece, downloadVerificationPiece } from '../../api/candidate.api';
import FileDropZone from '../../components/forms/FileDropZone';
import StatusBadge from '../../components/ui/StatusBadge';
import { TypePieceVerification } from '../../types';
import type { VerificationDoc } from '../../types';
import { useLang } from '../../context/LangContext';

const PIECE_STATUS_ICON: Record<string, React.ReactNode> = {
  VERIFIE: <CheckCircle2 className="w-4 h-4 text-[#059669]" />,
  VALIDE: <CheckCircle2 className="w-4 h-4 text-[#059669]" />,
  REJETE: <XCircle className="w-4 h-4 text-danger-500" />,
  EN_COURS: <Clock className="w-4 h-4 text-[#D4A72C]" />,
  EN_ATTENTE: <Clock className="w-4 h-4 text-[#D4A72C]" />,
  NON_VERIFIE: <Clock className="w-4 h-4 text-neutral-400" />,
};

const PIECE_STATUS_LABEL: Record<string, string> = {
  VERIFIE: 'Certifiée & Validée',
  VALIDE: 'Certifiée & Validée',
  REJETE: 'Rejetée',
  EN_COURS: 'En cours d\'examen',
  EN_ATTENTE: 'En attente de vérification',
  NON_VERIFIE: 'Non vérifiée',
};

const PIECE_TYPE_LABEL: Record<TypePieceVerification, string> = {
  [TypePieceVerification.IDENTITE]: "Pièce d'identité (CIN / Passeport)",
  [TypePieceVerification.DIPLOME]: 'Diplôme le plus élevé',
  [TypePieceVerification.ATTESTATION]: 'Attestation / Certification professionnelle',
  [TypePieceVerification.AUTRE]: 'Autre justificatif',
};

const VerificationPage: React.FC = () => {
  const { t } = useLang();
  const [verification, setVerification] = useState<any>(null);
  const [file, setFile] = useState<File | null>(null);
  const [type, setType] = useState<TypePieceVerification>(TypePieceVerification.IDENTITE);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState<{ text: string; ok: boolean } | null>(null);
  // Filtres liste pièces
  const [pieceStatusFilter, setPieceStatusFilter] = useState<string>('ALL');
  const [pieceTypeFilter, setPieceTypeFilter] = useState<string>('ALL');

  const load = () =>
    getMyVerification()
      .then(setVerification)
      .catch(() => setVerification(null))
      .finally(() => setLoading(false));

  useEffect(() => {
    load();
  }, []);

  const submit = async () => {
    if (!file) return;
    try {
      setUploading(true);
      setMessage(null);
      await uploadVerificationPiece(type, file.name, file);
      setFile(null);
      setMessage({ text: 'Pièce téléversée avec succès. Elle sera examinée sous 24h à 48h.', ok: true });
      setLoading(true);
      await load();
    } catch {
      setMessage({ text: 'Le dépôt de la pièce a échoué. Veuillez vérifier le format et réessayer.', ok: false });
    } finally {
      setUploading(false);
    }
  };

  const pieces: VerificationDoc[] = verification?.pieces ?? [];
  const globalStatus: string = verification?.statusGlobal || verification?.statut || 'EN_ATTENTE';
  const isVerified = globalStatus === 'VERIFIE' || globalStatus === 'VALIDE';

  const filteredPieces = pieces.filter((p) => {
    const st = p.status || (isVerified ? 'VERIFIE' : 'EN_COURS');
    const matchStatus = pieceStatusFilter === 'ALL' || st === pieceStatusFilter;
    const matchType = pieceTypeFilter === 'ALL' || p.type === pieceTypeFilter;
    return matchStatus && matchType;
  });

  return (
    <div className="max-w-7xl mx-auto py-5 space-y-5">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-[#172A3A]">
            {t('verification.title')}
          </h1>
          <p className="text-sm text-[#64748B] mt-1">
            Garantissez l'authenticité de vos diplômes et pièces d'identité pour vous démarquer auprès des recruteurs.
          </p>
        </div>
      </div>

      {message && (
        <div
          className={`p-4 rounded-2xl border flex items-center justify-between gap-3 text-sm font-medium ${
            message.ok
              ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
              : 'bg-red-50 border-red-200 text-danger-700'
          }`}
        >
          <div className="flex items-center gap-2">
            {message.ok ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
            <span>{message.text}</span>
          </div>
          <button onClick={() => setMessage(null)} className="font-bold text-neutral-400 hover:text-neutral-700">
            ✕
          </button>
        </div>
      )}

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-[#0F766E]" />
          <p className="text-xs text-[#64748B]">Vérification du dossier en cours...</p>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Status Hero Card */}
          <div
            className={`p-6 sm:p-8 rounded-3xl border shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-6 ${
              isVerified
                ? 'bg-gradient-to-r from-[#ECFDF5] via-[#F0FDF4] to-[#E6F7F5] dark:from-emerald-500/10 dark:via-emerald-500/5 dark:to-emerald-500/10 border-[#A7F3D0] dark:border-emerald-500/25'
                : 'bg-gradient-to-r from-[#FDF8EC] via-[#FFFBEB] to-[#FEF3C7] dark:from-yellow-500/10 dark:via-yellow-500/5 dark:to-yellow-500/10 border-[#FDE68A] dark:border-yellow-500/25'
            }`}
          >
            <div className="flex items-start sm:items-center gap-4">
              <div
                className={`w-16 h-16 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-sm ${
                  isVerified ? 'bg-[#059669] text-white' : 'bg-[#D4A72C] text-white'
                }`}
              >
                <ShieldCheck className="w-8 h-8" />
              </div>
              <div>
                <div className="flex items-center gap-2.5 flex-wrap">
                  <h2 className="font-display text-xl font-extrabold text-[#172A3A]">
                    {isVerified ? 'Dossier 100% Vérifié & Certifié' : 'Dossier en cours d’examen'}
                  </h2>
                  <StatusBadge status={globalStatus} />
                </div>
                <p className="text-xs text-[#475569] mt-1.5 leading-relaxed max-w-xl">
                  {isVerified
                    ? 'Toutes vos pièces justificatives ont été contrôlées et validées avec succès par notre équipe de conformité RHConnect.'
                    : 'Vos pièces justificatives sont en cours d’examen. Dès validation, votre profil recevra le badge officiel Certifié.'}
                </p>
              </div>
            </div>
          </div>

          {/* Upload New Document Card */}
          <div className="bg-white border border-[#E2E8F0] rounded-3xl p-6 sm:p-8 shadow-xs space-y-5">
            <div>
              <h3 className="font-display text-base font-bold text-[#172A3A]">Ajouter un document justificatif</h3>
              <p className="text-sm text-[#64748B] mt-1">
                Sélectionnez le type de document et déposez votre fichier (PDF, PNG ou JPEG, max 10MB).
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5 sm:col-span-2">
                <label className="block text-sm font-bold text-[#172A3A]">Type de pièce justificative</label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value as TypePieceVerification)}
                  className="w-full px-4 py-2.5 rounded-xl border border-[#CBD5E1] text-xs font-medium text-[#172A3A] bg-white focus:outline-none focus:ring-2 focus:ring-[#0F766E]/20 focus:border-[#0F766E]"
                >
                  <option value={TypePieceVerification.IDENTITE}>Carte d'Identité Nationale (CIN) / Passeport</option>
                  <option value={TypePieceVerification.DIPLOME}>Diplôme ou Attestation de réussite</option>
                  <option value={TypePieceVerification.ATTESTATION}>Certification professionnelle / Attestation de stage</option>
                  <option value={TypePieceVerification.AUTRE}>Autre justificatif</option>
                </select>
              </div>

              <div className="space-y-1.5 sm:col-span-2">
                <FileDropZone
                  selectedFile={file}
                  onFileSelect={setFile}
                  onFileRemove={() => setFile(null)}
                  acceptedTypes=".pdf,.jpg,.jpeg,.png"
                  label="Glissez-déposez votre document ici ou cliquez pour choisir"
                  hint="Formats acceptés : PDF, PNG, JPG (Max 10MB)"
                />
              </div>
            </div>

            {file && (
              <div className="pt-2 flex justify-end">
                <button
                  type="button"
                  onClick={submit}
                  disabled={uploading}
                  className="flex items-center gap-2 px-6 py-2.5 bg-[#0F766E] text-white rounded-xl font-bold text-xs hover:bg-[#115E59] transition-all shadow-md shadow-[#0F766E]/20 cursor-pointer disabled:opacity-50"
                >
                  {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                  Soumettre pour vérification
                </button>
              </div>
            )}
          </div>

          {/* List of Submitted Pieces */}
          <div className="bg-white border border-[#E2E8F0] rounded-3xl p-6 sm:p-8 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-[#F1F5F9] gap-3">
              <div>
                <h3 className="font-display text-base font-bold text-[#172A3A]">
                  Documents enregistrés ({pieces.length})
                </h3>
                <p className="text-sm text-[#64748B] mt-1">Historique des pièces rattachées à votre dossier</p>
              </div>

              {/* Filtres */}
              {pieces.length > 0 && (
                <div className="flex flex-wrap gap-2 self-start sm:self-center">
                  <select
                    value={pieceTypeFilter}
                    onChange={(e) => setPieceTypeFilter(e.target.value)}
                    className="px-3 py-1.5 rounded-xl border border-[#CBD5E1] text-xs font-semibold text-[#172A3A] bg-white focus:outline-none focus:ring-2 focus:ring-[#0F766E]/20 focus:border-[#0F766E]"
                  >
                    <option value="ALL">Tous les types</option>
                    <option value={TypePieceVerification.IDENTITE}>Identité</option>
                    <option value={TypePieceVerification.DIPLOME}>Diplôme</option>
                    <option value={TypePieceVerification.ATTESTATION}>Attestation</option>
                    <option value={TypePieceVerification.AUTRE}>Autre</option>
                  </select>
                  <select
                    value={pieceStatusFilter}
                    onChange={(e) => setPieceStatusFilter(e.target.value)}
                    className="px-3 py-1.5 rounded-xl border border-[#CBD5E1] text-xs font-semibold text-[#172A3A] bg-white focus:outline-none focus:ring-2 focus:ring-[#0F766E]/20 focus:border-[#0F766E]"
                  >
                    <option value="ALL">Tous les statuts</option>
                    <option value="VERIFIE">Validées</option>
                    <option value="VALIDE">Certifiées</option>
                    <option value="EN_COURS">En cours</option>
                    <option value="EN_ATTENTE">En attente</option>
                    <option value="REJETE">Rejetées</option>
                  </select>
                </div>
              )}
            </div>

            {pieces.length === 0 ? (
              <div className="p-8 text-center border-2 border-dashed border-[#E2E8F0] rounded-2xl">
                <FileText className="w-10 h-10 text-[#94A3B8] mx-auto mb-2" />
                <p className="text-xs font-semibold text-[#64748B]">Aucun document téléversé pour le moment.</p>
                <p className="text-[11px] text-[#94A3B8] mt-1">Utilisez le formulaire ci-dessus pour soumettre vos pièces.</p>
              </div>
            ) : filteredPieces.length === 0 ? (
              <div className="p-8 text-center border-2 border-dashed border-[#E2E8F0] rounded-2xl">
                <FileText className="w-10 h-10 text-[#94A3B8] mx-auto mb-2" />
                <p className="text-xs font-semibold text-[#64748B]">Aucun document ne correspond à ces filtres.</p>
                <button
                  onClick={() => { setPieceStatusFilter('ALL'); setPieceTypeFilter('ALL'); }}
                  className="mt-2 text-xs font-bold text-[#0F766E] hover:underline"
                >
                  Réinitialiser les filtres
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredPieces.map((piece, index) => {
                  const pieceStatus = piece.status || (isVerified ? 'VERIFIE' : 'EN_COURS');
                  const isRejected = pieceStatus === 'REJETE';

                  return (
                    <div
                      key={piece.id || index}
                      className={`flex flex-col p-4 rounded-2xl border transition-all gap-3 ${
                        isRejected
                          ? 'border-red-200 dark:border-red-500/30 bg-red-50 dark:bg-red-500/10'
                          : 'border-[#F1F5F9] dark:border-white/[0.06] bg-[#F8FAFC] dark:bg-[#1A2F45] hover:border-[#0F766E]/30'
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex items-center gap-3.5 min-w-0">
                          <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 shadow-2xs border ${
                            isRejected ? 'bg-red-100 dark:bg-red-500/15 border-red-200 dark:border-red-500/30 text-[#E11D48]' : 'bg-white dark:bg-white/[0.06] border-[#E2E8F0] dark:border-white/[0.07] text-[#0F766E] dark:text-[#5EEAD4]'
                          }`}>
                            <FileCheck className="w-5 h-5" />
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-xs font-bold text-[#172A3A] truncate">
                                {piece.nomFichier}
                              </span>
                              <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-[#E2E8F0] text-[#475569] flex-shrink-0">
                                {PIECE_TYPE_LABEL[piece.type] || piece.type}
                              </span>
                            </div>
                            <p className="text-[11px] text-[#64748B] mt-0.5">
                              Déposé le {piece.uploadedAt ? new Date(piece.uploadedAt).toLocaleDateString('fr-FR') : 'Récemment'}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 self-end sm:self-center flex-shrink-0">
                          <div className={`flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold border ${
                            isRejected ? 'bg-red-100 dark:bg-red-500/15 border-red-200 dark:border-red-500/30' : 'bg-white dark:bg-white/[0.06] border-[#E2E8F0] dark:border-white/[0.07]'
                          }`}>
                            {PIECE_STATUS_ICON[pieceStatus] || <Clock className="w-4 h-4 text-[#D4A72C]" />}
                            <span className={isRejected ? 'text-[#E11D48]' : 'text-[#334155]'}>
                              {PIECE_STATUS_LABEL[pieceStatus] || pieceStatus}
                            </span>
                          </div>
                          {piece.id && (
                            <button
                              type="button"
                              onClick={() => downloadVerificationPiece(
                                verification?.id ?? '',
                                piece.id,
                                piece.nomFichier
                              )}
                              className="p-2 rounded-xl bg-white dark:bg-white/[0.06] hover:bg-[#E6F7F5] dark:hover:bg-[#0F766E]/20 text-[#0F766E] dark:text-[#5EEAD4] border border-[#E2E8F0] dark:border-white/[0.07] transition-colors"
                              title="Télécharger / Voir le fichier"
                            >
                              <Download className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Motif de rejet + action à faire */}
                      {isRejected && (
                        <div className="mt-1 p-3 rounded-xl bg-white dark:bg-white/[0.04] border border-red-200 dark:border-red-500/30">
                          <div className="flex items-start gap-2">
                            <AlertCircle className="w-3.5 h-3.5 text-[#E11D48] flex-shrink-0 mt-0.5" />
                            <div className="space-y-1">
                              <p className="text-xs font-bold text-[#E11D48]">Document rejeté — action requise</p>
                              {piece.commentaire ? (
                                <p className="text-sm text-[#475569] leading-relaxed">
                                  <span className="font-semibold">Motif :</span> {piece.commentaire}
                                </p>
                              ) : (
                                <p className="text-xs text-[#475569]">
                                  Ce document n'a pas pu être validé. Veuillez déposer une version corrigée.
                                </p>
                              )}
                              <p className="text-[11px] text-[#0F766E] dark:text-[#5EEAD4] font-semibold mt-1">
                                → Sélectionnez <strong>{PIECE_TYPE_LABEL[piece.type] || piece.type}</strong> dans le formulaire ci-dessus et déposez un fichier corrigé.
                              </p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Privacy Trust Card */}
          <div className="p-5 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0] flex items-center gap-4 text-xs text-[#64748B]">
            <Lock className="w-5 h-5 text-[#0F766E] flex-shrink-0" />
            <p>
              Vos données personnelles et justificatifs sont chiffrés et traités dans le respect strict des réglementations en vigueur sur la protection des données.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default VerificationPage;
