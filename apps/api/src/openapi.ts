import { z } from 'zod';
import { UpdateProfile } from './routes/profile.js';
import { CatalogQuery, CreatePet, ReportBody, SetPhotosBody, StatusBody, UpdatePet, UploadUrlsBody } from './routes/pets.js';

const body = (schema: z.ZodType) => ({
  required: true,
  content: { 'application/json': { schema: z.toJSONSchema(schema, { io: 'input', unrepresentable: 'any' }) } },
});
const ok = (description: string) => ({ description });
const secured = [{ bearer: [] }];
const idParam = [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }];
const catalogParams = Object.entries(z.toJSONSchema(CatalogQuery, { io: 'input' }).properties ?? {}).map(([name, schema]) => ({
  name,
  in: 'query',
  schema,
}));

export const openapi = {
  openapi: '3.1.0',
  info: {
    title: 'Petzo API',
    version: '0.1.0',
    description:
      'Errors: `{ error: { code, message, details? } }`. Auth: `Authorization: Bearer <Supabase access token>`.',
  },
  components: { securitySchemes: { bearer: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' } } },
  paths: {
    '/health': { get: { summary: 'Health check', responses: { 200: ok('OK') } } },
    '/municipalities': { get: { summary: 'Municipios de Gran Caracas', responses: { 200: ok('Lista') } } },
    '/me': {
      get: { summary: 'Mi perfil (se crea en el primer acceso)', security: secured, responses: { 200: ok('Perfil') } },
      patch: { summary: 'Editar perfil', security: secured, requestBody: body(UpdateProfile), responses: { 200: ok('Perfil'), 422: ok('Validación') } },
    },
    '/me/avatar/upload-url': {
      post: { summary: 'URL firmada para subir el avatar (avatars/{user_id}.jpg)', security: secured, responses: { 200: ok('{ path, signed_url, token }') } },
    },
    '/me/avatar': {
      put: { summary: 'Publicar el avatar ya subido', security: secured, responses: { 200: ok('Perfil'), 409: ok('AVATAR_NOT_UPLOADED') } },
    },
    '/me/pets': { get: { summary: 'Mis publicaciones (todos los estados)', security: secured, responses: { 200: ok('Lista') } } },
    '/pets': {
      get: { summary: 'Catálogo (solo aprobadas, 20 por página)', parameters: catalogParams, responses: { 200: ok('{ data, pagination }') } },
      post: {
        summary: 'Crear publicación en borrador',
        security: secured,
        requestBody: body(CreatePet),
        responses: { 201: ok('Mascota'), 409: ok('PROFILE_INCOMPLETE'), 422: ok('Validación') },
      },
    },
    '/pets/{id}': {
      get: { summary: 'Detalle (aprobada o propia); publisher.pets_count = publicadas', parameters: idParam, responses: { 200: ok('Mascota'), 404: ok('No encontrada') } },
      delete: { summary: 'Eliminar borrador', security: secured, parameters: idParam, responses: { 204: ok('Eliminado'), 409: ok('INVALID_STATUS') } },
      patch: {
        summary: 'Editar: aprobada → pending_review; pausada o rechazada → draft',
        security: secured,
        parameters: idParam,
        requestBody: body(UpdatePet),
        responses: { 200: ok('Mascota'), 404: ok('No encontrada') },
      },
    },
    '/pets/{id}/photos/upload-urls': {
      post: {
        summary: 'URLs firmadas para subir fotos',
        security: secured,
        parameters: idParam,
        requestBody: body(UploadUrlsBody),
        responses: { 200: ok('[{ path, signed_url, token }]') },
      },
    },
    '/pets/{id}/photos': {
      put: {
        summary: 'Fijar fotos subidas (1 a 5, en orden)',
        security: secured,
        parameters: idParam,
        requestBody: body(SetPhotosBody),
        responses: { 200: ok('{ photos }'), 422: ok('INVALID_PHOTOS') },
      },
    },
    '/pets/{id}/status': {
      patch: {
        summary: 'Cambiar estado: enviar a revisión, pausar, reanudar, adoptada',
        description: 'draft → pending_review · approved → paused · paused → approved · approved|paused|pending_review → adopted',
        security: secured,
        parameters: idParam,
        requestBody: body(StatusBody),
        responses: { 200: ok('Mascota'), 409: ok('INVALID_STATUS | PLAN_LIMIT | PHOTOS_REQUIRED | PROFILE_INCOMPLETE') },
      },
    },
    '/pets/{id}/reports': {
      post: {
        summary: 'Reportar una publicación (HU-11)',
        security: secured,
        parameters: idParam,
        requestBody: body(ReportBody),
        responses: { 201: ok('{ ok }'), 404: ok('No encontrada') },
      },
    },
    '/me/favorites': { get: { summary: 'Mis favoritos (solo los aún visibles)', security: secured, responses: { 200: ok('Lista') } } },
    '/me/favorites/{petId}': {
      put: {
        summary: 'Guardar en favoritos',
        security: secured,
        parameters: [{ name: 'petId', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        responses: { 204: ok('Guardado'), 404: ok('No encontrada') },
      },
      delete: {
        summary: 'Quitar de favoritos',
        security: secured,
        parameters: [{ name: 'petId', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        responses: { 204: ok('Quitado') },
      },
    },
    '/admin/pets': {
      get: {
        summary: 'Admin: publicaciones por estado (default pending_review)',
        security: secured,
        parameters: [{ name: 'status', in: 'query', schema: { type: 'string' } }],
        responses: { 200: ok('Lista'), 403: ok('FORBIDDEN') },
      },
    },
  },
};
