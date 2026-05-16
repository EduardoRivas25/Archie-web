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
  biometricVerified: boolean;
  requiresBiometricVerification: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, name: string) => Promise<{ requireEmailVerification?: boolean; email?: string }>;
  signInWithGoogle: () => Promise<void>;
  signInWithGitHub: () => Promise<void>;
  signOut: () => Promise<void>;
  completeBiometricVerification: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  updateName: (newName: string) => Promise<void>;
  updatePassword: (currentPassword: string, newPassword: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// ─── Provider ────────────────────────────────────────────────────────
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [biometricVerified, setBiometricVerified] = useState(false);

  const biometricSessionKey = (userId: string) => `archie:biometric-verified:${userId}`;

  // Load user on mount
  const loadUser = useCallback(async () => {
    try {
      const currentUser = await authService.getCurrentUser();
      if (currentUser) {
        setUser(currentUser as AuthUser);
        setBiometricVerified(sessionStorage.getItem(biometricSessionKey(currentUser.id)) === 'true');
        // Load profile from DB
        const userProfile = await authService.getUserProfile(currentUser.id);
        setProfile(userProfile);
      } else {
        setUser(null);
        setProfile(null);
        setBiometricVerified(false);
      }
    } catch {
      setUser(null);
      setProfile(null);
      setBiometricVerified(false);
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
      setBiometricVerified(false);
      sessionStorage.removeItem(biometricSessionKey(data.user.id));
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
      setBiometricVerified(false);

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
    if (user) sessionStorage.removeItem(biometricSessionKey(user.id));
    setUser(null);
    setProfile(null);
    setBiometricVerified(false);
  };

  const completeBiometricVerification = async () => {
    let verifiedUser = user;
    if (!verifiedUser) {
      const currentUser = await authService.getCurrentUser();
      verifiedUser = currentUser as AuthUser | null;
      if (verifiedUser) setUser(verifiedUser);
    }

    if (!verifiedUser) throw new Error('No autenticado.');
    sessionStorage.setItem(biometricSessionKey(verifiedUser.id), 'true');
    setBiometricVerified(true);
  };

  const updateName = async (newName: string) => {
    if (!user) throw new Error('No autenticado.');
    await authService.updateUserName(user.id, newName);
    // Refresh local state
    const updatedProfile = await authService.getUserProfile(user.id);
    setProfile(updatedProfile);
    // Also update the user object's display name
    setUser(prev => prev ? { ...prev, profile: { ...prev.profile, name: newName } } : prev);
  };

  const updatePasswordFn = async (currentPassword: string, newPassword: string) => {
    await authService.updatePassword(currentPassword, newPassword);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        isLoading,
        isAuthenticated: !!user,
        biometricVerified,
        requiresBiometricVerification: !!user && !biometricVerified,
        signIn,
        signUp,
        signInWithGoogle,
        signInWithGitHub,
        signOut: signOutFn,
        completeBiometricVerification,
        refreshProfile,
        updateName,
        updatePassword: updatePasswordFn,
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
