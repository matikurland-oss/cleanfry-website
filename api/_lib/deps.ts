// תלויות חיצוניות של פונקציות ה-API, במקום אחד כדי שהבדיקות יוכלו להחליף אותן.
import { createSupabaseStore, getServiceClient, type OrderRow, type Store } from './store';
import { verifierFromEnv, type TranzilaVerifier } from './tranzila';
import { sendConfirmationEmail } from './confirmationEmail';

export interface AuthUser {
  id: string;
  email: string;
}

export interface Deps {
  store: Store;
  verifier: TranzilaVerifier;
  sendEmail: (order: OrderRow) => Promise<void>;
  /** מחזיר את המשתמש לפי JWT של Supabase Auth, או null אם הטוקן לא תקף */
  getUserFromToken: (token: string) => Promise<AuthUser | null>;
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
    now: overrides.now ?? (() => new Date())
  };
}

export function setDepsForTests(next: Partial<Deps>): void {
  overrides = next;
}
