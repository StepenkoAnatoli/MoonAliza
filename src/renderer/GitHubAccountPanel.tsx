import { useCallback, useEffect, useEffectEvent, useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import type { GitHubAccountStatus, GitHubOpenTarget } from '../shared';
import type { AppApi } from './App';
import { codeTimeLeft, GITHUB_ENDED, GITHUB_LABELS, GITHUB_OUTCOMES, GITHUB_TEXT } from './github-text';

type Change = 'github.signIn.start' | 'github.signIn.cancel' | 'github.signOut';
/** The preload passes on only the bridge's public message (spec 3.3), which is shown as it is (spec 8.1). */
const failure = (reason: unknown) => reason instanceof Error ? reason.message : 'The operation failed. Try again.';

/**
 * The GitHub account dialog's content (docs/specification/github-sign-in.md 8.1-8.2). It talks to main only through the
 * five github.* methods, reads the status when it mounts and about once a second while a sign-in is pending, and never
 * starts a sign-in except on a click (F-2, U-16). It renders only the status fields it knows and keeps nothing in browser
 * storage; the user code is selectable text with no copy button, because the renderer's permission handlers deny every
 * permission (spec 8.1).
 *
 * `onUnconfirmedChange` reports whether closing the dialog now must cancel: while a start is in flight (step 1, F1) or the
 * status is pending and GitHub has not confirmed the code (spec 6.6, DC-5). It follows what is rendered, so a reply that
 * arrives after the dialog closed reports nothing.
 */
export function GitHubAccountPanel({ api, onUnconfirmedChange }: { api: AppApi; onUnconfirmedChange?: (unconfirmed: boolean) => void }) {
  const [status, setStatus] = useState<GitHubAccountStatus>();
  const [busy, setBusy] = useState<Change | 'github.open' | null>(null);
  const [signedOutHere, setSignedOutHere] = useState(false);
  const [error, setError] = useState('');
  const [now, setNow] = useState(() => Date.now());
  // Replies are applied in the order their requests were sent, so a slow poll cannot bring back a state a later call ended.
  const sent = useRef(0); const shown = useRef(0);
  const track = useCallback(async (reply: Promise<unknown>) => {
    const order = ++sent.current;
    const { account } = await reply as { account: GitHubAccountStatus };
    if (order > shown.current) { shown.current = order; setStatus(account); }
  }, []);
  const read = useCallback(() => track(api.invoke('github.account.read', {})).catch(reason => setError(failure(reason))), [api, track]);
  useEffect(() => { void read(); }, [read]);

  const pending = status?.state === 'pending';
  const poll = useEffectEvent(() => { setNow(Date.now()); void read(); });
  useEffect(() => {
    if (!pending) return;
    setNow(Date.now());
    const timer = setInterval(poll, 1000);
    return () => clearInterval(timer);
  }, [pending]);

  const unconfirmed = busy === 'github.signIn.start' || (status?.state === 'pending' && !status.committed);
  useLayoutEffect(() => { onUnconfirmedChange?.(unconfirmed); }, [unconfirmed, onUnconfirmedChange]);

  async function change(method: Change) {
    setBusy(method); setError('');
    if (method === 'github.signIn.start') setSignedOutHere(false);
    try { await track(api.invoke(method, {})); if (method === 'github.signOut') setSignedOutHere(true); }
    catch (reason) { setError(failure(reason)); } finally { setBusy(null); }
  }
  async function open(target: GitHubOpenTarget) {
    setBusy('github.open'); setError('');
    try { await api.invoke('github.open', { target }); } catch (reason) { setError(failure(reason)); } finally { setBusy(null); }
  }
  const button = (label: string, onClick: () => void, primary = false) =>
    <button className={primary ? 'primary' : undefined} disabled={busy !== null} onClick={onClick}>{label}</button>;

  let notices: ReactNode = null; let body: ReactNode = null;
  if (status?.state === 'not-configured') body = <p>{GITHUB_TEXT.notConfigured}</p>;
  else if (status?.state === 'signed-out') {
    notices = <>
      {signedOutHere && <>
        <p>{status.signOutIncomplete ? GITHUB_TEXT.signOut.incomplete : GITHUB_TEXT.signOut.done}</p>
        <p>{GITHUB_TEXT.signOut.notRevoked}</p><p>{GITHUB_TEXT.signOut.howToRevoke}</p><p>{GITHUB_TEXT.signOut.whoRevokes}</p>
      </>}
      {status.ended && <p>{GITHUB_ENDED[status.ended]}</p>}
      {status.lastOutcome && <p>{GITHUB_OUTCOMES[status.lastOutcome]}</p>}
    </>;
    body = <>
      <p>{GITHUB_TEXT.signedOut.intro}</p><p>{GITHUB_TEXT.signedOut.publicReads}</p><p>{GITHUB_TEXT.signedOut.privateText}</p>
      <div className="modal-actions">{button(GITHUB_LABELS.signIn, () => void change('github.signIn.start'), true)}</div>
    </>;
  } else if (status?.state === 'pending' && status.committed) notices = <p>{GITHUB_TEXT.pending.confirmed}</p>;
  else if (status?.state === 'pending') {
    const left = codeTimeLeft(status.codeExpiresAt, now);
    body = <>
      <p>{GITHUB_TEXT.pending.enterCode}</p>
      <p className="github-user-code">{status.userCode}</p>
      <p>{left ? GITHUB_TEXT.pending.expiresIn(left) : GITHUB_TEXT.pending.waiting}</p>
      <div className="modal-actions">{button(GITHUB_LABELS.openDevice, () => void open('device'), true)}{button(GITHUB_LABELS.cancel, () => void change('github.signIn.cancel'))}</div>
      <p>{GITHUB_TEXT.pending.phishing}</p>
      <p>{GITHUB_TEXT.pending.keepOpen}</p>
      {status.account && <p>{status.account.login ? GITHUB_TEXT.pending.staySignedInAs(status.account.login) : GITHUB_TEXT.pending.staySignedIn}</p>}
    </>;
  } else if (status?.state === 'signed-in') {
    notices = <>
      {status.renewalHeld && <p>{GITHUB_TEXT.signedIn.renewalHeld}</p>}
      {status.lastOutcome && <><p>{GITHUB_OUTCOMES[status.lastOutcome]}</p><p>{GITHUB_TEXT.signedIn.unchanged}</p></>}
    </>;
    body = <>
      <p className="github-login">{status.login ? GITHUB_TEXT.signedIn.as(status.login) : GITHUB_TEXT.signedIn.unknownLogin}</p>
      <p>{GITHUB_TEXT.signedIn.install}</p>
      <div className="modal-actions">
        {button(GITHUB_LABELS.install, () => void open('install'), true)}
        {button(GITHUB_LABELS.signInAgain, () => void change('github.signIn.start'))}
        {button(GITHUB_LABELS.signOut, () => void change('github.signOut'))}
      </div>
      <p>{GITHUB_TEXT.signedIn.publicReads}</p><p>{GITHUB_TEXT.signedIn.privateText}</p>
    </>;
  }
  return <div className="github-account-panel" data-testid="github-account-panel">
    {error && <p className="form-error" role="alert">{error}</p>}
    <div className="github-notices" role="status">{notices}</div>
    {body}
  </div>;
}
