import express from 'express';
import swaggerUi from 'swagger-ui-express';
import { errorHandler, notFound } from './http.js';
import { openapi } from './openapi.js';
import { router as favorites } from './routes/favorites.js';
import { router as pets } from './routes/pets.js';
import { router as profile } from './routes/profile.js';

export const app = express();
app.use(express.json({ limit: '100kb' }));

app.get('/health', (_req, res) => {
  res.json({ ok: true });
});
app.use('/docs', swaggerUi.serve, swaggerUi.setup(openapi));
app.use(profile);
app.use(pets);
app.use(favorites);
app.use(() => {
  throw notFound();
});
app.use(errorHandler);
