/**
 * Centre de notifications candidat — RhConnect
 *
 * Architecture : les notifications sont construites côté client à partir
 * des données réelles (candidatures, vérification, profil).
 * Un endpoint backend `/notifications` peut être branché plus tard
 * en remplaçant la fonction `buildNotifications`.
 *
 * Persistance des lectures : localStorage (clé `rhconnect_read_notifs`).
 */
import client from './client';

export type NotifType =
  | 'APPLICATION_STATUS'   // changement de statut candidature
  | 'VERIFICATION_REJECTED' // pièce rejetée
  | 'VERIFICATION_VALIDATED' // dossier validé
  | 'OFFER_RECOMMENDED'    // nouvelle offre matchante
  | 'PROFILE_INCOMPLETE'   // profil à compléter
  | 'INTERVIEW_SCHEDULED'  // entretien planifié
  | 'APPLICATION_ACCEPTED' // candidature acceptée
  | 'APPLICATION_REFUSED'; // candidature refusée

export interface Notification {
  id: string;
  type: NotifType;
  title: string;
  message: string;
  link: string;
  createdAt: string;
  read: boolean;
}

const READ_KEY = 'rhconnect_read_notifs';
const DELETED_KEY = 'rhconnect_deleted_notifs';

function getReadIds(): Set<string> {
  try {
    const raw = localStorage.getItem(READ_KEY);
    return new Set(raw ? JSON.parse(raw) : []);
  } catch {
    return new Set();
  }
}

function saveReadIds(ids: Set<string>): void {
  try {
    localStorage.setItem(READ_KEY, JSON.stringify([...ids]));
  } catch {}
}

function getDeletedIds(): Set<string> {
  try {
    const raw = localStorage.getItem(DELETED_KEY);
    return new Set(raw ? JSON.parse(raw) : []);
  } catch {
    return new Set();
  }
}

function saveDeletedIds(ids: Set<string>): void {
  try {
    localStorage.setItem(DELETED_KEY, JSON.stringify([...ids]));
  } catch {}
}

/** Tente un endpoint backend, retourne null si absent (graceful) */
async function fetchFromBackend(): Promise<Notification[] | null> {
  try {
    const res = await client.get<any[]>('/notifications');
    if (Array.isArray(res.data)) return res.data;
    return null;
  } catch {
    return null; // endpoint non implémenté — on passe au fallback local
  }
}

/** Construit les notifications à partir des données réelles de l'entreprise */
async function buildFromCompanyData(): Promise<Notification[]> {
  type RawNotif = Omit<Notification, 'read'>;
  const notifs: RawNotif[] = [];

  // Pour company: notifications de contacts/messages reçus
  try {
    const contactsRes = await client.get<any[]>('/company/contacts');
    const contacts = (contactsRes.data || []);

    for (const contact of contacts) {
      const senderName = contact.senderName || contact.senderEmail?.split('@')[0] || 'Contact anonyme';
      const subject = contact.subject || contact.message?.substring(0, 50) || 'Message sans sujet';
      const dateStr = contact.createdAt || contact.receivedAt || new Date().toISOString();

      // Nouveau contact/message reçu (non lu)
      if (!contact.read) {
        notifs.push({
          id: `contact-${contact.id}`,
          type: 'APPLICATION_STATUS',
          title: 'Nouveau message reçu',
          message: `${senderName} a envoyé: "${subject}"`,
          link: '/company/profile', // Lier vers la section messages/contacts
          createdAt: dateStr,
        });
      }
    }
  } catch (err) {
    // Silencieux: endpoint peut ne pas exister
    console.debug('Company contacts fetch failed (graceful)', err);
  }

  // Tri anti-chronologique (plus récentes d'abord)
  notifs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  // Déduplique par id (au cas où il y a des doublons)
  const seen = new Set<string>();
  return notifs
    .filter((n) => {
      if (seen.has(n.id)) return false;
      seen.add(n.id);
      return true;
    })
    .map((n) => ({ ...n, read: false }));
}


/** Détecte le contexte actuel (candidat ou company) */
function getCurrentRole(): string {
  try {
    const stored = localStorage.getItem('rhconnect_user');
    if (!stored) return 'CANDIDATE';
    const user = JSON.parse(stored);
    return user?.role || 'CANDIDATE';
  } catch {
    return 'CANDIDATE';
  }
}

/** Construit les notifications à partir des données réelles du candidat ou company */
async function buildFromData(): Promise<Notification[]> {
  type RawNotif = Omit<Notification, 'read'>;
  
  // Détecte le contexte (candidat ou company) depuis localStorage
  const role = getCurrentRole();
  const isCompany = role === 'COMPANY' || role === 'RECRUITER';

  if (isCompany) {
    return buildFromCompanyData();
  }

  // ===== CANDIDAT =====
  const notifs: RawNotif[] = [];

  // Candidatures
  try {
    const appsRes = await client.get<any[]>('/applications/me');
    const apps = (appsRes.data || []).map((a: any) => ({
      ...a,
      status: a.status || a.statut,
    }));

    for (const app of apps) {
      const offerTitle = app.offerTitle || "l'offre";
      const company = app.companyName ? ` — ${app.companyName}` : '';
      const dateStr = app.updatedAt || app.dateSoumission || new Date().toISOString();

      if (app.status === 'ENTRETIEN') {
        notifs.push({
          id: `app-interview-${app.id}`,
          type: 'INTERVIEW_SCHEDULED',
          title: 'Entretien planifié',
          message: `${app.companyName || 'Une entreprise'} vous invite à un entretien pour le poste "${offerTitle}".`,
          link: '/candidate/applications',
          createdAt: dateStr,
        });
      } else if (app.status === 'ACCEPTE') {
        notifs.push({
          id: `app-accepted-${app.id}`,
          type: 'APPLICATION_ACCEPTED',
          title: 'Candidature acceptée 🎉',
          message: `Votre candidature pour "${offerTitle}"${company} a été acceptée.`,
          link: '/candidate/applications',
          createdAt: dateStr,
        });
      } else if (app.status === 'REFUSE') {
        notifs.push({
          id: `app-refused-${app.id}`,
          type: 'APPLICATION_REFUSED',
          title: 'Candidature non retenue',
          message: `Votre candidature pour "${offerTitle}"${company} n'a pas été retenue.`,
          link: '/candidate/applications',
          createdAt: dateStr,
        });
      } else if (app.status === 'TRANSMIS') {
        notifs.push({
          id: `app-transmis-${app.id}`,
          type: 'APPLICATION_STATUS',
          title: 'Dossier transmis au recruteur',
          message: `Votre dossier pour "${offerTitle}"${company} a été transmis à l'entreprise.`,
          link: '/candidate/applications',
          createdAt: dateStr,
        });
      }
    }
  } catch {}

  // Vérification
  try {
    const verifRes = await client.get<any>('/verifications/me');
    const verif = verifRes.data;
    if (verif) {
      const globalStatus = verif.statusGlobal || verif.statut;
      const pieces = verif.pieces || [];

      if (globalStatus === 'VERIFIE' || globalStatus === 'VALIDE') {
        notifs.push({
          id: 'verif-validated',
          type: 'VERIFICATION_VALIDATED',
          title: 'Dossier certifié ✓',
          message: 'Toutes vos pièces justificatives ont été vérifiées. Votre badge Certifié est actif.',
          link: '/candidate/verification',
          createdAt: verif.updatedAt || new Date().toISOString(),
        });
      }

      for (const piece of pieces) {
        if (piece.status === 'REJETE') {
          notifs.push({
            id: `piece-rejected-${piece.id}`,
            type: 'VERIFICATION_REJECTED',
            title: 'Document rejeté — action requise',
            message: piece.commentaire
              ? `"${piece.nomFichier}" rejeté : ${piece.commentaire}`
              : `Le document "${piece.nomFichier}" n'a pas pu être validé. Veuillez déposer une version corrigée.`,
            link: '/candidate/verification',
            createdAt: piece.uploadedAt || new Date().toISOString(),
          });
        }
      }
    }
  } catch {}

  // Profil incomplet
  try {
    const profRes = await client.get<any>('/candidates/me');
    const prof = profRes.data || {};
    const isIncomplete =
      !prof.bio ||
      !prof.phone ||
      !(prof.competences?.length >= 3) ||
      !prof.cvFileName;

    if (isIncomplete) {
      notifs.push({
        id: 'profile-incomplete',
        type: 'PROFILE_INCOMPLETE',
        title: 'Profil incomplet',
        message: 'Complétez votre profil pour augmenter votre visibilité auprès des recruteurs.',
        link: '/candidate/profile',
        createdAt: new Date().toISOString(),
      });
    }
  } catch {}

  // Offres recommandées (prend la plus récente)
  try {
    const offersRes = await client.get<any>('/offers', { params: { limit: 1 } });
    const offers = offersRes.data?.content || offersRes.data?.data || offersRes.data || [];
    if (Array.isArray(offers) && offers.length > 0) {
      const offer = offers[0];
      notifs.push({
        id: `offer-rec-${offer.id}`,
        type: 'OFFER_RECOMMENDED',
        title: 'Nouvelle offre recommandée',
        message: `"${offer.title}" chez ${offer.companyName || 'une entreprise partenaire'} correspond à votre profil.`,
        link: `/candidate/offers/${offer.id}`,
        createdAt: offer.createdAt || new Date().toISOString(),
      });
    }
  } catch {}

  // Tri anti-chronologique
  notifs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  // Déduplique par id (au cas où backend renvoie aussi des entrées)
  const seen = new Set<string>();
  return notifs
    .filter((n) => {
      if (seen.has(n.id)) return false;
      seen.add(n.id);
      return true;
    })
    .map((n) => ({ ...n, read: false }));
}

/* ── Fonctions publiques ─────────────────────────────────────────── */

export async function getNotifications(): Promise<Notification[]> {
  const readIds = getReadIds();
  const deletedIds = getDeletedIds();

  // Récupérer à la fois le backend et les alertes basées sur les données réelles
  const fromBackend = await fetchFromBackend();
  const fromData = await buildFromData();

  const combined: any[] = [];
  const seenIds = new Set<string>();

  if (Array.isArray(fromBackend)) {
    for (const n of fromBackend) {
      if (n && n.id && !seenIds.has(n.id)) {
        seenIds.add(n.id);
        combined.push(n);
      }
    }
  }

  for (const n of fromData) {
    if (n && n.id && !seenIds.has(n.id)) {
      seenIds.add(n.id);
      combined.push(n);
    }
  }

  // Tri anti-chronologique
  combined.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return combined
    .filter((n: any) => !deletedIds.has(n.id))
    .map((n: any) => ({
      ...n,
      read: n.read || readIds.has(n.id),
    })) as Notification[];
}

export async function deleteNotification(id: string): Promise<void> {
  const ids = getDeletedIds();
  ids.add(id);
  saveDeletedIds(ids);

  try {
    await client.delete(`/notifications/${id}`);
  } catch {}
}

export async function deleteAllNotifications(notifications: Notification[]): Promise<void> {
  const ids = getDeletedIds();
  for (const n of notifications) ids.add(n.id);
  saveDeletedIds(ids);

  try {
    await client.delete('/notifications');
  } catch {}
}

export function markAsRead(id: string): void {
  const ids = getReadIds();
  ids.add(id);
  saveReadIds(ids);
  try {
    void client.patch('/notifications/read-all');
  } catch {}
}

export async function markAllAsRead(notifications: Notification[]): Promise<void> {
  const ids = getReadIds();
  for (const n of notifications) ids.add(n.id);
  saveReadIds(ids);

  try {
    await client.patch('/notifications/read-all');
  } catch {}
}

export function getUnreadCount(notifications: Notification[]): number {
  return notifications.filter((n) => !n.read).length;
}
