import { insforge } from '@/lib/insforge';

// ─── Types ───────────────────────────────────────────────────────────
export interface UserProfile {
  id: string;
  user_id: string;
  full_name: string;
  email: string;
  role: 'free' | 'pro' | 'student' | 'superadmin';
  default_model: string;
  language: string;
  notifications_enabled: boolean;
  created_at: string;
  updated_at: string;
}

export interface SignUpParams {
  email: string;
  password: string;
  name: string;
}

export interface SignInParams {
  email: string;
  password: string;
}

// ─── Auth ────────────────────────────────────────────────────────────

export async function signUp({ email, password, name }: SignUpParams) {
  const { data, error } = await insforge.auth.signUp({
    email,
    password,
    name,
  });
  if (error) throw error;
  return data;
}

export async function signIn({ email, password }: SignInParams) {
  const { data, error } = await insforge.auth.signInWithPassword({
    email,
    password,
  });
  if (error) throw error;
  return data;
}

export async function signInWithGoogle(redirectTo?: string) {
  const { data, error } = await insforge.auth.signInWithOAuth({
    provider: 'google',
    redirectTo: redirectTo || `${window.location.origin}/chat`,
  });
  if (error) throw error;
  return data;
}

export async function signInWithGitHub(redirectTo?: string) {
  const { data, error } = await insforge.auth.signInWithOAuth({
    provider: 'github',
    redirectTo: redirectTo || `${window.location.origin}/chat`,
  });
  if (error) throw error;
  return data;
}

export async function signOut() {
  const { error } = await insforge.auth.signOut();
  if (error) throw error;
}

export async function getCurrentUser() {
  const { data, error } = await insforge.auth.getCurrentUser();
  if (error) throw error;
  return data?.user ?? null;
}

// ─── Email Verification ─────────────────────────────────────────────

export async function verifyEmail(email: string, otp: string) {
  const { data, error } = await insforge.auth.verifyEmail({ email, otp });
  if (error) throw error;
  return data;
}

export async function resendVerificationEmail(email: string) {
  const { data, error } = await insforge.auth.resendVerificationEmail({ email });
  if (error) throw error;
  return data;
}

// ─── Password Reset ─────────────────────────────────────────────────

export async function sendPasswordReset(email: string) {
  const { data, error } = await insforge.auth.sendResetPasswordEmail({
    email,
    redirectTo: `${window.location.origin}/reset-password`,
  });
  if (error) throw error;
  return data;
}

export async function exchangeResetToken(email: string, code: string) {
  const { data, error } = await insforge.auth.exchangeResetPasswordToken({
    email,
    code,
  });
  if (error) throw error;
  return data;
}

export async function resetPassword(newPassword: string, otp: string) {
  const { data, error } = await insforge.auth.resetPassword({
    newPassword,
    otp,
  });
  if (error) throw error;
  return data;
}

// ─── User Profile (DB) ──────────────────────────────────────────────

export async function createUserProfile(
  userId: string,
  fullName: string,
  email: string,
  role: UserProfile['role'] = 'free'
) {
  const { data, error } = await insforge.database
    .from('user_profiles')
    .insert({
      user_id: userId,
      full_name: fullName,
      email: email,
      role: role,
    })
    .select();

  if (error) throw error;
  return data?.[0] as UserProfile;
}

export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  const { data, error } = await insforge.database
    .from('user_profiles')
    .select()
    .eq('user_id', userId)
    .maybeSingle();

  if (error) throw error;
  return data as UserProfile | null;
}

export async function updateUserProfile(
  userId: string,
  updates: Partial<Pick<UserProfile, 'full_name' | 'default_model' | 'language' | 'notifications_enabled'>>
) {
  const { data, error } = await insforge.database
    .from('user_profiles')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('user_id', userId)
    .select();

  if (error) throw error;
  return data?.[0] as UserProfile;
}

// ─── InsForge Profile (Auth) ─────────────────────────────────────────

export async function setAuthProfile(profile: Record<string, unknown>) {
  const { data, error } = await insforge.auth.setProfile(profile);
  if (error) throw error;
  return data;
}
