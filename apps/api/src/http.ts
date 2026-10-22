import type { ErrorRequestHandler } from 'express';
import { z } from 'zod';

// Every error response: { error: { code, message, details? } }
export class HttpError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
    public details?: unknown,
  ) {
    super(message);
  }
}

export const notFound = () => new HttpError(404, 'NOT_FOUND', 'Recurso no encontrado');

export function parse<T extends z.ZodType>(schema: T, input: unknown): z.infer<T> {
  const result = schema.safeParse(input);
  if (!result.success) {
    throw new HttpError(422, 'VALIDATION_ERROR', 'Datos inválidos', z.flattenError(result.error));
  }
  return result.data;
}

// Supabase/PostgREST errors are unexpected here: log them, never leak them
export function check<R extends { data: unknown; error: unknown }>(result: R): Exclude<R, { error: object }>['data'] {
  if (result.error) throw result.error;
  return result.data;
}

export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  if (err instanceof HttpError) {
    res.status(err.status).json({ error: { code: err.code, message: err.message, details: err.details } });
    return;
  }
  // Postgres FK violation: the client referenced a row that does not exist (e.g. municipality_id)
  if (err?.code === '23503') {
    res.status(422).json({ error: { code: 'INVALID_REFERENCE', message: 'Referencia inválida' } });
    return;
  }
  // body-parser errors (bad JSON, 413 too large) are safe to expose
  if (err?.expose && err.status) {
    const code = err.type === 'entity.parse.failed' ? 'BAD_JSON' : 'BAD_REQUEST';
    res.status(err.status).json({ error: { code, message: 'Solicitud inválida' } });
    return;
  }
  console.error(err);
  res.status(500).json({ error: { code: 'INTERNAL', message: 'Error interno' } });
};
