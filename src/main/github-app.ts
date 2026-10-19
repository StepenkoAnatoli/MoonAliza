/**
 * MoonAliza's GitHub App (docs/specification/github-sign-in.md 3.1; UD-1): public identifiers, not credentials. No client
 * secret exists for this app's use (F-20). Both values stay empty until the user registers the app and the lead copies them
 * from its public page (Edit, Public page, Install; E-12 l.49-53), never derived from the app's name (E-03 l.53, R2-8);
 * until then the sign-in reports "not configured". Main only, with no Electron import: the e2e imports this file.
 */
export const GITHUB_APP: Readonly<{ clientId: string; installUrl: string }> = { clientId: '', installUrl: '' };
export const DEVICE_CODE_URL = 'https://github.com/login/device/code';      // E-01 l.118
export const TOKEN_URL = 'https://github.com/login/oauth/access_token';     // E-01 l.138, E-02 l.72
export const DEVICE_PAGE_URL = 'https://github.com/login/device';          // E-01 l.130: the only accepted verification_uri
export const USER_URL = 'https://api.github.com/user';                      // E-20 l.34-39, E-06 l.1231
/** Step 1 sends scope=offline_access (E-01 l.120). It forces expiring tokens even when the registration turns expiry off (E-02 l.40-42),
 *  so it flips to false only together with UD-6's "turn expiry off" fallback (DR-1, DC-3). */
export const REQUEST_OFFLINE_ACCESS = true;
export const isConfigured = (app: { clientId: string; installUrl: string }) => app.clientId !== '' && app.installUrl !== '';
