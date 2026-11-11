// תלויות חיצוניות של פונקציות ה-API, במקום אחד כדי שהבדיקות יוכלו להחליף אותן.
import { createSupabaseStore, getServiceClient, type OrderRow, type Store } from './store.js';
import { verifierFromEnv, type TranzilaVerifier } from './tranzila.js';
import { sendConfirmationEmail, type EmailOptions } from './confirmationEmail.js';

export interface AuthUser {
  id: string;
  email: string;
}

/** ניהול משתמשי Supabase Auth (למשפיעניות). זורק duplicate_user אם האימייל כבר רשום */
export interface AuthAdmin {
  createUser(email: string, password: string): Promise<string>;
  deleteUser(userId: string): Promise<void>;
  setPassword(userId: string, password: string): Promise<void>;
}

export interface Deps {
  store: Store;
  verifier: TranzilaVerifier;
  sendEmail: (order: OrderRow, options?: EmailOptions) => Promise<void>;
  /** מחזיר את המשתמש לפי JWT של Supabase Auth, או null אם הטוקן לא תקף */
  getUserFromToken: (token: string) => Promise<AuthUser | null>;
  authAdmin: AuthAdmin;
  now: () => Date;
}

let overrides: Partial<Deps> = {};
let defaultStore: Store | null = null;
let defaultVerifier: TranzilaVerifier | null = null;

async function getUserFromSupabase(token: string): Promise<AuthUser | null> {
  const { data, error } = await getServiceClient().auth.getUser(token);
  if (error || !data.user) return null;
  return { id: data.user.id, email: data.user.email ?? '' };
}

const supabaseAuthAdmin: AuthAdmin = {
  async createUser(email, password) {
    const { data, error } = await getServiceClient().auth.admin.createUser({ email, password, email_confirm: true });
    if (error || !data.user) {
      const message = error?.message ?? '';
      if (/already|exists|registered/i.test(message)) throw new Error('duplicate_user');
      throw new Error(message || 'create_user_failed');
    }
    return data.user.id;
  },
  async deleteUser(userId) {
    const { error } = await getServiceClient().auth.admin.deleteUser(userId);
    if (error) throw new Error(error.message);
  },
  async setPassword(userId, password) {
    const { error } = await getServiceClient().auth.admin.updateUserById(userId, { password });
    if (error) throw new Error(error.message);
  }
};

export function deps(): Deps {
  return {
    get store() {
      return overrides.store ?? (defaultStore ??= createSupabaseStore());
    },
    get verifier() {
      return overrides.verifier ?? (defaultVerifier ??= verifierFromEnv());
    },
    sendEmail: overrides.sendEmail ?? sendConfirmationEmail,
    getUserFromToken: overrides.getUserFromToken ?? getUserFromSupabase,
    authAdmin: overrides.authAdmin ?? supabaseAuthAdmin,
    now: overrides.now ?? (() => new Date())
  };
}

export function setDepsForTests(next: Partial<Deps>): void {
  overrides = next;
}
