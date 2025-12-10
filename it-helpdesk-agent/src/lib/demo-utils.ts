// Demo account utilities
// Provides functions to check if a user is a demo account and should have all features unlocked

/**
 * List of email addresses that should have full demo access
 * These accounts will have all premium features unlocked and can access demo data
 */
const DEMO_ACCOUNTS = ["suyash@lyzr.ai"];

/**
 * Check if the given email is a demo account
 * Demo accounts have all premium features unlocked and no feature locks
 * @param email - User email address to check
 * @returns true if the email is a demo account
 */
export function isDemoAccount(email: string | null | undefined): boolean {
  if (!email) return false;
  return DEMO_ACCOUNTS.includes(email.toLowerCase().trim());
}

/**
 * Get the demo mode flag for a user
 * Returns false (no demo mode overlay) for demo accounts, true for regular users
 * @param email - User email address
 * @returns false for demo accounts (premium features unlocked), true for regular users (show premium locks)
 */
export function shouldShowPremiumLock(
  email: string | null | undefined
): boolean {
  return !isDemoAccount(email);
}
