import { z } from 'zod';
import { IdSchema } from './contracts';
import { PublicErrorSchema, type PublicError } from './errors';
import { MethodSpec, type MethodInput, type MethodName, type MethodParams, type MethodResult } from './params';

export type Request = { [M in MethodName]: { protocolVersion: 1; clientRequestId: string; method: M; params: MethodInput<M> } }[MethodName];
export type RequestInput = { [M in MethodName]: { protocolVersion: 1; clientRequestId: string; method: M; params: MethodParams<M> } }[MethodName];
export type Response = { [M in MethodName]: { protocolVersion: 1; clientRequestId: string; method: M } & ({ ok: true; result: MethodResult<M> } | { ok: false; error: PublicError }) }[MethodName];
export const MethodNameSchema = z.enum(Object.keys(MethodSpec) as [MethodName, ...MethodName[]]);
const identity = { protocolVersion: z.literal(1), clientRequestId: IdSchema, method: MethodNameSchema };
export const RequestSchema = z.object({ ...identity, params: z.unknown() }).strict().transform((value, context): Request => {
  const params = MethodSpec[value.method].params.safeParse(value.params);
  if (!params.success) { for (const issue of params.error.issues) context.addIssue({ code: 'custom', path: ['params', ...issue.path], message: issue.message }); return z.NEVER; }
  return { ...value, params: params.data } as Request;
});
export const ResponseSchema = z.discriminatedUnion('ok', [
  z.object({ ...identity, ok: z.literal(true), result: z.unknown() }).strict(),
  z.object({ ...identity, ok: z.literal(false), error: PublicErrorSchema }).strict(),
]).transform((value, context): Response => {
  if (!value.ok) return value as Response;
  const result = MethodSpec[value.method].result.safeParse(value.result);
  if (!result.success) { for (const issue of result.error.issues) context.addIssue({ code: 'custom', path: ['result', ...issue.path], message: issue.message }); return z.NEVER; }
  return { ...value, result: result.data } as Response;
});
export function parseRequest(value: unknown): Request { return RequestSchema.parse(value); }
export function parseResult<M extends MethodName>(method: M, value: unknown): MethodResult<M> { return MethodSpec[method].result.parse(value) as MethodResult<M>; }
export function parseResponse(value: unknown): Response { return ResponseSchema.parse(value); }
