import { insforge } from '@/lib/insforge';

// ─── Role Constants ──────────────────────────────────────────────────
export const ROLES = {
  FREE: 'free',
  PRO: 'pro',
  STUDENT: 'student',
  SUPERADMIN: 'superadmin',
} as const;

export type RoleType = typeof ROLES[keyof typeof ROLES];

// Initial superadmin email
const SUPERADMIN_EMAIL = 'jr6814353@gmail.com';

// ─── Role Permissions ────────────────────────────────────────────────
export const ROLE_PERMISSIONS: Record<RoleType, {
  label: string;
  maxChats: number;
  canAccessPro: boolean;
  canManageUsers: boolean;
  models: string[];
}> = {
  free: {
    label: 'Free',
    maxChats: 50,
    canAccessPro: false,
    canManageUsers: false,
    models: ['rapido'],
  },
  pro: {
    label: 'Pro',
    maxChats: Infinity,
    canAccessPro: true,
    canManageUsers: false,
    models: ['rapido', 'pensar', 'pro'],
  },
  student: {
    label: 'Estudiante',
    maxChats: 200,
    canAccessPro: true,
    canManageUsers: false,
    models: ['rapido', 'pensar'],
  },
  superadmin: {
    label: 'Superadministrador',
    maxChats: Infinity,
    canAccessPro: true,
    canManageUsers: true,
    models: ['rapido', 'pensar', 'pro'],
  },
};

// ─── Role Logic ──────────────────────────────────────────────────────

/**
 * Determine the role for a new user.
 * If the email matches the superadmin email, assign superadmin.
 * Otherwise, check if this is the first user ever (also superadmin).
 * Default: free.
 */
export async function determineRoleForNewUser(email: string): Promise<RoleType> {
  // Superadmin email always gets superadmin
  if (email.toLowerCase() === SUPERADMIN_EMAIL.toLowerCase()) {
    return ROLES.SUPERADMIN;
  }

  // Check if any users exist
  try {
    const { data } = await insforge.database
      .from('user_profiles')
      .select('id', { count: 'exact' })
      .limit(1);

    // If no users exist, first user is superadmin
    if (!data || data.length === 0) {
      return ROLES.SUPERADMIN;
    }
  } catch {
    // If we can't check, default to free
  }

  return ROLES.FREE;
}

export function getRolePermissions(role: RoleType) {
  return ROLE_PERMISSIONS[role] || ROLE_PERMISSIONS.free;
}

export function getRoleLabel(role: RoleType): string {
  return ROLE_PERMISSIONS[role]?.label || 'Free';
}

export async function assignRole(userId: string, role: RoleType) {
  const { data, error } = await insforge.database
    .from('user_profiles')
    .update({ role, updated_at: new Date().toISOString() })
    .eq('user_id', userId)
    .select();

  if (error) throw error;
  return data?.[0];
}
