import { contextBridge, ipcRenderer } from 'electron';
import { parseRequest, ResponseSchema, EventSchema, ResearchSchema } from '../shared';

contextBridge.exposeInMainWorld('moonaliza', {
  async invoke(method: string, params: unknown = {}) {
    const request = parseRequest({ protocolVersion: 1, clientRequestId: crypto.randomUUID(), method, params });
    const response = ResponseSchema.parse(await ipcRenderer.invoke('moonaliza:invoke', request));
    if (response.clientRequestId !== request.clientRequestId || response.method !== request.method) throw new Error('Response identity mismatch');
    if (!response.ok) throw new Error(response.error.message);
    return response.result;
  },
  onEvent(callback: (event: unknown) => void) {
    const listener = (_event: Electron.IpcRendererEvent, raw: unknown) => {
      const parsed = EventSchema.safeParse(raw); if (parsed.success) callback(parsed.data);
    };
    ipcRenderer.on('moonaliza:event', listener);
    return () => ipcRenderer.removeListener('moonaliza:event', listener);
  },
  onResearch(callback: (research: unknown) => void) {
    const listener = (_event: Electron.IpcRendererEvent, raw: unknown) => {
      const parsed = ResearchSchema.safeParse(raw); if (parsed.success) callback(parsed.data);
    };
    ipcRenderer.on('moonaliza:research', listener);
    return () => ipcRenderer.removeListener('moonaliza:research', listener);
  },
});
