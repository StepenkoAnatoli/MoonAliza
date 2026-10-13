import type { GitHubAccountStatus } from '../shared';

/**
 * Every GitHub sign-in text the renderer shows (docs/specification/github-sign-in.md 8.2-8.4). A test keeps the outcome and
 * ended texts in step with GitHubAttemptOutcomeSchema and GitHubEndedSchema, pins the wording, and forbids "revoked" and
 * "erased": sign-out is local, and deleted conversation text may remain on disk (F-12, UD-3).
 */
type SignedOut = Extract<GitHubAccountStatus, { state: 'signed-out' }>;
export type GitHubOutcome = NonNullable<SignedOut['lastOutcome']>;
export type GitHubEnded = NonNullable<SignedOut['ended']>;

export const GITHUB_LABELS = {
  sidebar: 'GitHub', dialog: 'GitHub account', signIn: 'Sign in', openDevice: 'Open GitHub', cancel: 'Cancel',
  install: 'Install on repositories', signInAgain: 'Sign in again', signOut: 'Sign out',
} as const;

/** UD-4: signed-in reads always carry the sign-in. */
const PUBLIC_READS = "While you are signed in, every GitHub read MoonAliza makes, public repositories included, uses your sign-in and counts toward your GitHub account's rate limit.";
/** UD-3: private repository text is handled like local project files. Never "erased": `secure_delete` is not set. */
const PRIVATE_TEXT = "Text read from a private repository is handled like your local project files. It is read only in conversations where you pasted the repository's URL. It is saved in that conversation and its search. It is sent to a cloud model only when that conversation allows cloud models. Signing out does not delete it; deleting the conversation removes it from MoonAliza.";

export const GITHUB_TEXT = {
  notConfigured: 'GitHub sign-in is not configured in this build.',
  signedOut: {
    intro: "Sign in to GitHub so MoonAliza can read your private repositories, read-only. MoonAliza shows a code that you enter at github.com/login/device. It can then read repositories where you install MoonAliza's GitHub App, and only repositories you paste into a conversation. It never writes to GitHub. Your sign-in is kept encrypted on this computer, and MoonAliza never shows it to models or asks you to paste a token.",
    publicReads: PUBLIC_READS,
    privateText: PRIVATE_TEXT,
  },
  pending: {
    enterCode: 'Enter this code at github.com/login/device:',
    expiresIn: (left: string) => `The code expires in ${left}.`,
    waiting: 'Waiting for GitHub…',
    phishing: "Only enter a code shown in this dialog. MoonAliza never asks for a code in a conversation. On GitHub, check that you are authorizing MoonAliza's GitHub App, which asks for read-only access to repository contents and metadata.",
    keepOpen: 'Keep this dialog open until GitHub confirms: closing it cancels the sign-in.',
    staySignedInAs: (login: string) => `You stay signed in as ${login} until this sign-in finishes.`,
    staySignedIn: 'You stay signed in until this sign-in finishes.',
    /** Once GitHub confirmed the code (DC-5): the only text, with no button; closing the dialog cancels nothing. */
    confirmed: 'GitHub confirmed the code. Finishing sign-in…',
  },
  signedIn: {
    as: (login: string) => `Signed in as ${login}.`,
    unknownLogin: 'Signed in to GitHub (account name unavailable).',
    install: "Signing in installs nothing. To let MoonAliza read a private repository, install MoonAliza's GitHub App on the account that owns it; on GitHub you choose All repositories or Only select repositories. In an organization, an owner installs it, or you can request it from the install page.",
    renewalHeld: 'MoonAliza could not renew your GitHub sign-in just now, so some GitHub reads fail until it can. If this continues, sign in again.',
    unchanged: 'Your existing sign-in is unchanged.',
    // The UD-4 and UD-3 sentences "in short form" (spec 8.2 gives no wording for them).
    publicReads: "Every GitHub read MoonAliza makes, public repositories included, uses your sign-in and counts toward your GitHub account's rate limit.",
    privateText: 'Text read from a private repository is handled like your local project files: it is read only in conversations where you pasted its URL, reaches a cloud model only when that conversation allows cloud models, and stays there after you sign out until you delete the conversation.',
  },
  /** F-12, in its four parts. `done` and `incomplete` are the first part; `incomplete` replaces `done` (DC-6). */
  signOut: {
    done: 'MoonAliza stopped using your GitHub sign-in. Its encrypted copy on this computer is deleted now, or, if a file cannot be deleted at once, the next time MoonAliza starts.',
    incomplete: "MoonAliza stopped using your GitHub sign-in, but could not finish removing its copy from this computer's disk. After MoonAliza restarts you may be signed in again; if so, sign out again.",
    notRevoked: 'This did not revoke anything on GitHub: the authorization and its tokens stay valid there until you revoke them or they expire, up to 8 hours for the access token and 6 months for the refresh token.',
    howToRevoke: "To revoke it on GitHub: click your profile picture, then Settings; in the Integrations section of the sidebar, click Applications; open the Authorized GitHub Apps tab; then click Revoke next to MoonAliza's app.",
    whoRevokes: 'Only the person who authorized the app can revoke it; an organization owner can uninstall the app from the organization instead.',
  },
} as const;

/** Why the app ended the account (spec 8.2; DC-1, DC-15). */
export const GITHUB_ENDED: Readonly<Record<GitHubEnded, string>> = {
  'sign-in-ended': 'Your GitHub sign-in ended: it expired, or GitHub no longer accepts it. Sign in again to read private repositories.',
  'app-changed': 'This build of MoonAliza uses a different GitHub App from the one you signed in with, so it removed that sign-in. Sign in again to read private repositories.',
  'client-rejected': "GitHub did not accept MoonAliza's GitHub App when renewing your sign-in, so the sign-in ended. Sign in again; if GitHub does not accept the sign-in either, this build cannot sign in.",
};

/** How a sign-in attempt ended (spec 8.3). */
export const GITHUB_OUTCOMES: Readonly<Record<GitHubOutcome, string>> = {
  cancelled: 'Sign-in cancelled. Nothing was saved.',
  expired: 'The code expired before GitHub confirmed it. GitHub may also be limiting sign-ins right now; start again, or try again later.',
  restart: 'GitHub did not accept this sign-in code. Start again to get a new code.',
  denied: 'Access was denied on GitHub, and that code cannot be used again. Start again if you want to sign in.',
  disabled: "GitHub says sign-in with a code is turned off for MoonAliza's GitHub App, so this build cannot sign in.",
  'client-rejected': "GitHub did not recognise this build's GitHub App, so this build cannot sign in.",
  'grant-unsupported': 'GitHub refused the sign-in request this build sent, so this build cannot sign in.',
  'email-unverified': 'GitHub needs a verified email address on your account first. Verify it on GitHub, then start again.',
  'rate-limited': 'GitHub is limiting sign-in requests right now. Wait a few minutes, then start again.',
  'start-failed': 'MoonAliza could not get a sign-in code from GitHub. Check your connection, then try again.',
  failed: 'Sign-in did not complete, and nothing was saved. Start again.',
};

/** The composer footnote outside Build mode (spec 8.4, F-25); Build mode keeps its own text. */
export const GITHUB_FOOTNOTE = {
  chat: 'Paste a GitHub repository URL to read it; private repositories need GitHub sign-in (sidebar). What is read stays in this conversation and reaches a cloud model only if this conversation allows cloud models. General chat has no local file or command access.',
  project: 'This mode does not modify project files. GitHub URLs you paste can be read; private ones need GitHub sign-in.',
} as const;
/** The clause the conversation cloud dialog gains (spec 8.4, UD-3). */
export const GITHUB_CLOUD_CLAUSE = 'This includes text MoonAliza reads from GitHub repositories you paste, private ones too when you are signed in to GitHub.';
/** F-26, in the Model profiles dialog. It never says OpenAI forbids it. */
export const PROVIDER_SIGN_IN_NOTE = 'Claude and OpenAI models use API keys: Anthropic does not permit other apps to offer Claude.ai sign-in, and OpenAI documents Sign in with ChatGPT only for its own apps, so MoonAliza offers neither.';

/** Time left on a user code as m:ss, or null once it has run out (the dialog then says it is waiting for GitHub). */
export function codeTimeLeft(codeExpiresAt: string, now: number): string | null {
  const seconds = Math.ceil((Date.parse(codeExpiresAt) - now) / 1000);
  if (!(seconds > 0)) return null;
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
}
