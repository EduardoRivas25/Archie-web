import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import * as authService from '@/services/authService';
import { determineRoleForNewUser } from '@/services/roleService';
import type { UserProfile } from '@/services/authService';

// ─── Types ───────────────────────────────────────────────────────────
interface AuthUser {
  id: string;
  email: string;
  emailVerified: boolean;
  profile?: { name?: string; avatar_url?: string };
}

interface AuthContextType {
  user: AuthUser | null;
  profile: UserProfile | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, name: string) => Promise<{ requireEmailVerification?: boolean; email?: string }>;
  signInWithGoogle: () => Promise<void>;
  signInWithGitHub: () => Promise<void>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// ─── Provider ────────────────────────────────────────────────────────
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load user on mount
  const loadUser = useCallback(async () => {
    try {
      const currentUser = await authService.getCurrentUser();
      if (currentUser) {
        setUser(currentUser as AuthUser);
        // Load profile from DB
        const userProfile = await authService.getUserProfile(currentUser.id);
        setProfile(userProfile);
      } else {
        setUser(null);
        setProfile(null);
      }
    } catch {
      setUser(null);
      setProfile(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUser();
  }, [loadUser]);

  const refreshProfile = useCallback(async () => {
    if (user) {
      const userProfile = await authService.getUserProfile(user.id);
      setProfile(userProfile);
    }
  }, [user]);

  // ─── Auth Methods ────────────────────────────────────────────────

  const signIn = async (email: string, password: string) => {
    const data = await authService.signIn({ email, password });
    if (data?.user) {
      setUser(data.user as AuthUser);
      const userProfile = await authService.getUserProfile(data.user.id);
      setProfile(userProfile);
    }
  };

  const signUp = async (email: string, password: string, name: string) => {
    const data = await authService.signUp({ email, password, name });

    if (data?.requireEmailVerification) {
      return { requireEmailVerification: true, email };
    }

    if (data?.user && data?.accessToken) {
      setUser(data.user as AuthUser);

      // Determine role and create profile
      const role = await determineRoleForNewUser(email);
      const userProfile = await authService.createUserProfile(
        data.user.id,
        name,
        email,
        role
      );
      setProfile(userProfile);
    }

    return {};
  };

  const signInWithGoogle = async () => {
    await authService.signInWithGoogle();
  };

  const signInWithGitHub = async () => {
    await authService.signInWithGitHub();
  };

  const signOutFn = async () => {
    await authService.signOut();
    setUser(null);
    setProfile(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        isLoading,
        isAuthenticated: !!user,
        signIn,
        signUp,
        signInWithGoogle,
        signInWithGitHub,
        signOut: signOutFn,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// ─── Hook ────────────────────────────────────────────────────────────
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
