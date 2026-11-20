import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  type ReactNode,
} from 'react';
import { getProfile, loadMyPhotoBlobUrl } from '../api/candidate.api';
import { useAuth } from './AuthContext';

interface CandidateProfileContextType {
  profile: any | null;
  photoBlobUrl: string | null;
  photoFileId: string | null;
  loading: boolean;
  refreshProfile: () => Promise<void>;
  setPhotoFileId: (id: string | null) => void;
}

const CandidateProfileContext = createContext<CandidateProfileContextType | undefined>(undefined);

export const CandidateProfileProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user } = useAuth();

  const userRole = user?.role || (user?.roles && user.roles[0]);
  const isCandidate = userRole === 'CANDIDATE';
  const userId = user?.id;

  const [profile, setProfile] = useState<any | null>(null);
  const [photoBlobUrl, setPhotoBlobUrl] = useState<string | null>(null);
  const [photoBlobRef, setPhotoBlobRef] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const photoFileId = profile?.photoFileId || user?.candidateProfile?.photoFileId || null;

  const refreshProfile = useCallback(async () => {
    if (!isCandidate || !userId) {
      setProfile(null);
      return;
    }
    try {
      setLoading(true);
      const prof = await getProfile();
      setProfile(prof);
    } catch {
    } finally {
      setLoading(false);
    }
  }, [isCandidate, userId]);

  const setPhotoFileId = useCallback((id: string | null) => {
    setProfile((prev: any) => (prev ? { ...prev, photoFileId: id } : prev));
  }, []);

  useEffect(() => {
    if (isCandidate && userId) {
      refreshProfile();
    } else {
      setProfile(null);
    }
  }, [isCandidate, userId, refreshProfile]);

  useEffect(() => {
    if (!photoFileId) {
      if (photoBlobRef) {
        URL.revokeObjectURL(photoBlobRef);
        setPhotoBlobRef(null);
      }
      setPhotoBlobUrl(null);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const url = await loadMyPhotoBlobUrl();
        if (cancelled) {
          if (url) URL.revokeObjectURL(url);
          return;
        }
        if (photoBlobRef) URL.revokeObjectURL(photoBlobRef);
        if (url) {
          setPhotoBlobRef(url);
          setPhotoBlobUrl(url);
        } else {
          setPhotoBlobRef(null);
          setPhotoBlobUrl(null);
        }
      } catch {
        if (photoBlobRef) {
          URL.revokeObjectURL(photoBlobRef);
          setPhotoBlobRef(null);
        }
        if (!cancelled) setPhotoBlobUrl(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [photoFileId]);

  useEffect(() => {
    return () => {
      if (photoBlobRef) {
        URL.revokeObjectURL(photoBlobRef);
        setPhotoBlobRef(null);
      }
    };
  }, [photoBlobRef]);

  return (
    <CandidateProfileContext.Provider
      value={{
        profile,
        photoBlobUrl,
        photoFileId,
        loading,
        refreshProfile,
        setPhotoFileId,
      }}
    >
      {children}
    </CandidateProfileContext.Provider>
  );
};

export const useCandidateProfile = (): CandidateProfileContextType => {
  const ctx = useContext(CandidateProfileContext);
  if (ctx === undefined) {
    throw new Error('useCandidateProfile must be used within a CandidateProfileProvider');
  }
  return ctx;
};
