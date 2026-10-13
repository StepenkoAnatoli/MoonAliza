import { z } from 'zod';
import { DateTimeSchema } from './contracts';

// The GitHub account status the renderer sees (docs/specification/github-sign-in.md 3.2; F-21, S-1). It never carries a token,
// the device code, verification_uri, the polling interval, a vault ref, the client ID or any GitHub response text other than
// the validated user code and login.
export const GitHubLoginSchema = z.string().regex(/^[A-Za-z0-9][A-Za-z0-9_-]{0,99}$/);              // '_' for enterprise-managed logins
export const GitHubUserCodeSchema = z.string().max(32).regex(/^[A-Za-z0-9]+(?:-[A-Za-z0-9]+)*$/);    // E-01 l.129: 8 characters with a hyphen; not assumed exactly (DO-12)
export const GitHubAttemptOutcomeSchema = z.enum(['cancelled', 'expired', 'restart', 'denied', 'disabled', 'client-rejected',
  'grant-unsupported', 'email-unverified', 'rate-limited', 'start-failed', 'failed']);
/** Why the app ended the account (L-12); null after a user sign-out. */
export const GitHubEndedSchema = z.enum(['sign-in-ended', 'app-changed', 'client-rejected']);
const PendingAccount = z.object({ login: GitHubLoginSchema.nullable() }).strict();
export const GitHubAccountStatusSchema = z.discriminatedUnion('state', [
  z.object({ state: z.literal('not-configured') }).strict(),
  z.object({ state: z.literal('signed-out'), ended: GitHubEndedSchema.nullable(), signOutIncomplete: z.boolean(), lastOutcome: GitHubAttemptOutcomeSchema.nullable() }).strict(),
  z.object({ state: z.literal('pending'), userCode: GitHubUserCodeSchema, codeExpiresAt: DateTimeSchema, committed: z.boolean(), account: PendingAccount.nullable() }).strict(),
  z.object({ state: z.literal('signed-in'), login: GitHubLoginSchema.nullable(), renewalHeld: z.boolean(), lastOutcome: GitHubAttemptOutcomeSchema.nullable() }).strict(),
]);
export type GitHubAccountStatus = z.infer<typeof GitHubAccountStatusSchema>;
export const GitHubOpenTargetSchema = z.enum(['device', 'install']);
export type GitHubOpenTarget = z.infer<typeof GitHubOpenTargetSchema>;
