import { parseRequest, parseResult, type Request } from '../shared';

export interface FrameIdentity { webContentsId: number; frameId: number; url: string }
export interface SenderIdentity extends FrameIdentity { isMainFrame: boolean }
export function isTrustedSender(sender: SenderIdentity, expected: FrameIdentity): boolean {
  return sender.isMainFrame && sender.webContentsId === expected.webContentsId
    && sender.frameId === expected.frameId && sender.url === expected.url;
}

/** Only explicitly mapped errors are allowed across IPC. Raw exceptions may contain credentials or paths. */
const publicMessages: Record<string, string> = {
  PROJECT_TICKET_INVALID: 'The folder selection expired. Choose the folder again.',
  PROJECT_VOLUME_UNSUPPORTED: 'Choose a folder on a local fixed drive.',
  PROJECT_UNTRUSTED: 'Trust this project before running a task.',
  PROJECT_NOT_FOUND: 'This project is no longer available.',
  SESSION_NOT_FOUND: 'This conversation is no longer available.',
  PROFILE_NOT_FOUND: 'Choose an available model profile.',
  CLOUD_NOT_ALLOWED: 'This project allows local inference only. Choose a local profile or use Review cloud access to explicitly allow this project’s content to reach the selected provider.',
  CREDENTIAL_UNAVAILABLE: 'A saved key cannot be reused at a different endpoint or provider type. Enter the key for the new destination, or create a separate profile.',
  RUN_CANCELLED: 'The run was stopped.',
  RUN_ACTIVE: 'Wait for the active run to finish, or stop it first.',
  REQUEST_CONFLICT: 'This request identity was already used with different content.',
  ENGINE_UNAVAILABLE: 'The engine is restarting. Try again when it is ready.',
  NOT_IMPLEMENTED: 'This capability is not available in this development build.',
  ENCRYPTION_UNAVAILABLE: 'Windows credential encryption is unavailable. The credential was not saved.',
  NOT_FOUND: 'This operation is no longer available.',
  APPROVAL_STALE: 'This approval is no longer valid. Review the current task again.',
  FILE_CONFLICT: 'The file changed since this edit was recorded. Your current file was preserved.',
  UNDO_UNAVAILABLE: 'Undo is unavailable for this change or its original snapshot.',
  RECOVERY_REQUIRED: 'Review interrupted operations in Recovery before starting another Build task.',
  SNAPSHOT_QUOTA: 'The snapshot budget is full of protected edits. Finish the run or review interrupted operations before proposing more edits.',
  SNAPSHOT_CORRUPT: 'Snapshot storage contains damaged or unexpected files. No project files were changed by this request.',
  PATH_OUTSIDE_PROJECT: 'This path is outside the permitted project files.',
};

export function safeError(error: unknown): { code: string; message: string; retry: 'never' | 'after-reconcile' } {
  const code = error instanceof Error && error.message in publicMessages ? error.message : 'INTERNAL_ERROR';
  return { code, message: publicMessages[code] ?? 'The operation could not be completed. No private error details were shared.',
    retry: code === 'ENGINE_UNAVAILABLE' ? 'after-reconcile' : 'never' };
}

export function createBridge(expected: () => FrameIdentity, handler: (request: Request) => Promise<unknown>) {
  return async (sender: SenderIdentity, input: unknown) => {
    if (!isTrustedSender(sender, expected())) throw new Error('UNTRUSTED_SENDER');
    let request: Request;
    try {
      if (JSON.stringify(input).length > 2_000_000) throw new Error('oversized');
      request = parseRequest(input);
    } catch { throw new Error('INVALID_REQUEST'); }
    const identity = { protocolVersion: 1 as const, clientRequestId: request.clientRequestId, method: request.method };
    try {
      const result = parseResult(request.method, await handler(request));
      return { ...identity, ok: true as const, result };
    } catch (error) {
      return { ...identity, ok: false as const, error: safeError(error) };
    }
  };
}
