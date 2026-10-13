/**
 * The seam between the GitHub reader and the signed-in account (docs/specification/github-sign-in.md 3.4). Types and three
 * constants only: the reader depends on this file, the lifecycle service (src/main/github-signin.ts) implements it.
 */
export type Fetcher = (url: string, init: RequestInit) => Promise<Response>;
/** Main's fetch, looked up per call: the service is built at startup, before an e2e patch of globalThis.fetch lands (spec section 10). */
export const lateFetch: Fetcher = (url, init) => globalThis.fetch(url, init);
export interface GitHubSend { response: Response; authenticated: boolean }
export interface GitHubCredential {
  /**
   * Sends one GitHub API request.
   * Signed out or not configured: calls request(undefined) exactly once and returns its response, authenticated: false.
   * Signed in: the expiry pre-check (joining or starting the single-flight refresh when due), then request(`Bearer ${token}`)
   * called synchronously inside vault.withSecret under a fresh 'github' grant, then the 401 rule (at most one refresh, one retry).
   * request must call its fetcher synchronously, before any await, and keep no copy of the authorization value.
   * signal ends only this caller's waiting; it never aborts a refresh.
   * Originates only members of CREDENTIAL_ERRORS, or rejects when signal aborts. It rethrows the request's own rejection and a local
   * vault error while decrypting the access token (ENCRYPTION_UNAVAILABLE, a missing or undecryptable entry) unchanged;
   * the reader maps those to GITHUB_UNAVAILABLE, as today (GS-6).
   */
  send(request: (authorization: string | undefined) => Promise<Response>, signal: AbortSignal): Promise<GitHubSend>;
}
export const SIGNED_OUT: GitHubCredential = { async send(request) { return { response: await request(undefined), authenticated: false }; } };
/** Every error send() originates (spec 3.9 layer 3). G-19 parses each in GitHubErrorCodeSchema (DC-7). */
export const CREDENTIAL_ERRORS = ['GITHUB_SIGN_IN_REQUIRED', 'GITHUB_RENEWAL_UNAVAILABLE', 'GITHUB_RATE_LIMIT'] as const;
export type CredentialError = (typeof CREDENTIAL_ERRORS)[number];
