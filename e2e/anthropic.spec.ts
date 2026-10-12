import { _electron as electron, expect, test, type ElectronApplication } from '@playwright/test';
import { mkdir, mkdtemp, readdir, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { SIGNATURE_MARKER, STEP1_TEXT, STEP2_TEXT, startAnthropicFake } from './fixtures/anthropic-fake';

// The Anthropic journey of docs/specification/more-models-phase2.md ("Tests the builders owe", Windows e2e) and
// REQUIREMENTS-P2 T-4, against the loopback fake in fixtures/anthropic-fake.ts, which checks every request as it
// arrives and refuses a wrong one (each check names the guard that turns it red). Every stream it serves is built
// from E-10 shapes and the 2026-10-12 live recordings, not a capture.

// Not a real credential: a value shaped like one, so the fake can tell the profile's key from any other.
const KEY = 'sk-ant-e2e-only-0123456789abcdef';
const MODEL = 'claude-e2e-fixture';
// Not the form's default (2048) nor the 32 other kinds' Test connection sends, so every request shows the profile's own.
const MAX_TOKENS = 3072;
const PROMPT = 'List the project folder.';
const PROJECT_FILE = 'notes.txt';
const COOKIE = { name: 'moonaliza_e2e', value: 'provider-session-cookie' };

async function files(directory: string): Promise<string[]> {
  const found: string[] = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) found.push(...await files(path)); else if (entry.isFile()) found.push(path);
  }
  return found;
}

test('an Anthropic profile passes Test connection and replays a thinking step unchanged in a cloud-allowed project', async () => {
  // One desktop launch and shutdown, a tool round trip and a userData scan, on a CI host.
  test.setTimeout(120_000);
  const root = await mkdtemp(join(tmpdir(), 'moonaliza-anthropic-'));
  const project = join(root, 'Anthropic project'); await mkdir(project);
  await writeFile(join(project, PROJECT_FILE), 'Anthropic journey fixture.\n');
  const data = join(root, 'app-data'); await mkdir(data);
  const fake = await startAnthropicFake({ key: KEY, model: MODEL, maxTokens: MAX_TOKENS, prompt: PROMPT, toolResultIncludes: PROJECT_FILE });
  const packaged = process.env.MOONALIZA_TEST_EXECUTABLE;
  const launch = () => electron.launch({ ...(packaged ? { executablePath: packaged } : {}), args: [...(packaged ? [] : [resolve('.')]), `--user-data-dir=${data}`] });
  let app: ElectronApplication | undefined;
  try {
    app = await launch(); const page = await app.firstWindow();
    // This spec sorts first, so it takes the runner's cold first launch: the 5 s assertion default is too short there
    // (run 38270784820: the heading rendered after it). The other specs' first steps are actions, bounded by the test.
    await expect(page.getByText('Your work starts here')).toBeVisible({ timeout: 30_000 });

    // A cookie for the fake's origin in the provider session (src/main/index.ts, partition `moonaliza-providers`, held
    // in memory, so it is planted in this launch). Chat requests are sent with `credentials: 'omit'` (INV-5), so the
    // fake refuses any request carrying it. The probe is the positive control: a plain fetch from the same session,
    // without `omit`, does carry it to this origin, so the refusal checks a cookie that would otherwise be sent.
    await app.evaluate(async ({ session }, cookie) => { await session.fromPartition('moonaliza-providers').cookies.set(cookie); }, { url: fake.origin, ...COOKIE });
    expect(await app.evaluate(async ({ session }, url) => (await session.fromPartition('moonaliza-providers').fetch(url)).status, `${fake.origin}/cookie-probe`)).toBe(204);
    expect(fake.probeCookies).toEqual([`${COOKIE.name}=${COOKIE.value}`]);

    // Save the profile: the Anthropic API option fills its own endpoint, which the test points at the fake.
    await page.getByRole('button', { name: 'Model profiles', exact: true }).click();
    await page.getByLabel('Profile name').fill('Anthropic fixture');
    await page.getByRole('combobox', { name: /^Provider/ }).selectOption('anthropic');
    await expect(page.getByLabel('Endpoint')).toHaveValue('https://api.anthropic.com/v1');
    await page.getByLabel('Endpoint').fill(fake.endpoint); await page.getByLabel('Model name').fill(MODEL);
    await page.getByLabel('Context window (tokens)').fill('16384'); await page.getByLabel('Maximum response (tokens)').fill(String(MAX_TOKENS));
    await page.getByLabel('API key').fill(KEY); await page.getByRole('button', { name: 'Save profile' }).click();
    await expect(page.getByRole('dialog')).toHaveCount(0);

    // Test connection: one request, answered by a built `end_turn` text stream.
    await page.getByRole('button', { name: 'Model profiles', exact: true }).click();
    await page.getByRole('button', { name: 'Test connection' }).click();
    await expect(page.getByText('Anthropic fixture: connection succeeded', { exact: true })).toBeVisible();
    expect(fake.requests.map(request => request.turn)).toEqual(['test']);
    await page.getByRole('button', { name: 'Close dialog' }).click();

    // A trusted project, local-only until the user allows cloud inference for it, exactly as
    // e2e/context-recovery.spec.ts:50-51 does, with the Anthropic profile selected.
    await app.evaluate(({ dialog }, selected) => { dialog.showOpenDialog = async () => ({ canceled: false, filePaths: [selected] }); }, project);
    await page.getByRole('button', { name: 'Open project' }).click(); await page.getByRole('button', { name: 'Trust and open' }).click();
    await expect(page.getByRole('heading', { name: 'Anthropic project' })).toBeVisible();
    await page.getByLabel('Model profile', { exact: true }).selectOption({ label: 'Anthropic fixture' });
    await page.getByLabel('Message MoonAliza').fill(PROMPT);
    await expect(page.getByRole('button', { name: 'Send message' })).toBeDisabled();
    await page.getByRole('button', { name: 'Review cloud access' }).click(); await page.getByRole('button', { name: 'Allow for this project' }).click();
    await expect(page.getByRole('button', { name: 'Send message' })).toBeEnabled(); expect(fake.requests).toHaveLength(1);

    // Ask mode, one tool round trip: step 1 thinks (empty thinking, the marker as signature), writes a text block and
    // calls list_files on "."; step 2 answers.
    await page.getByLabel('Mode', { exact: true }).selectOption('ask');
    await page.getByRole('button', { name: 'Send message' }).click();
    await expect(page.getByText(STEP2_TEXT, { exact: true })).toBeVisible();
    await expect(page.getByText(STEP1_TEXT, { exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Stop run' })).toHaveCount(0);

    // Every request passed the fake's checks (Bearer, version, path, max_tokens, no cookie; request 2 = request 1's
    // messages + step 1's content array + one tool_result-only user message; system, tools, model, max_tokens and
    // stream byte-equal between requests 1 and 2), and there were exactly three, so the fake was reached for each:
    // the provider session's proxy did not intercept loopback.
    expect(fake.refusals).toEqual([]);
    expect(fake.requests.map(request => request.turn)).toEqual(['test', 'step1', 'step2']);
    await app.close(); app = undefined;

    // The provider state lives only in the run's memory (more-models-phase2.md section 1): after the app closes, the
    // signature is nowhere under userData. Red with the strip in the engine's message() removed (the events row then
    // holds it). The marker is base64-alphabet only, so JSON escaping cannot hide it; the UTF-16 form covers a
    // Chromium store. The positive control: step 1's text block, stored by design, is found by the same scan.
    let textFound = false;
    for (const file of await files(data)) {
      const bytes = await readFile(file);
      expect(bytes.includes(SIGNATURE_MARKER), file).toBe(false);
      expect(bytes.includes(Buffer.from(SIGNATURE_MARKER, 'utf16le')), file).toBe(false);
      textFound ||= bytes.includes(STEP1_TEXT);
    }
    expect(textFound).toBe(true);
  } catch (error) {
    // A refused or missing request stops the journey where the UI cannot say why (a state dropped from the run's
    // memory, for one, fails step 2 before any fetch): the failure names what the fake saw and why it refused.
    if (error instanceof Error) error.message += `\nThe Anthropic fake saw: ${fake.requests.map(request => request.turn).join(', ') || 'no request'}; refused: ${fake.refusals.join(' | ') || 'none'}`;
    throw error;
  } finally {
    await app?.close(); await fake.close();
    await rm(root, { recursive: true, force: true, maxRetries: 5, retryDelay: 100 });
  }
});
