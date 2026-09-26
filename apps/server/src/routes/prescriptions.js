import { Router } from 'express';
import {
  idParamsSchema,
  prescriptionCreateSchema,
  prescriptionListQuerySchema,
  prescriptionPreviewSchema,
  prescriptionTemplateCreateSchema,
  prescriptionTemplateUpdateSchema,
  prescriptionUpdateSchema,
} from '#shared';
import { parseBody, parseParams, parseQuery } from '../lib/validate.js';
import { authenticate, requireRole } from '../middleware/auth.js';

/**
 * Prescription templates and issued prescriptions. Every role reads (and can print);
 * admins and nutritionists write.
 * @param {import('../context.js').AppContext} ctx
 * @param {import('../services/index.js').Services} services
 */
export function prescriptionsRouter(ctx, { prescriptions }) {
  const router = Router();
  const auth = authenticate(ctx);
  const editors = requireRole('admin', 'nutritionist');
  router.use(['/prescription-templates', '/prescriptions'], auth);

  // ---- templates ----
  router.get('/prescription-templates', async (_req, res) => {
    res.json({ data: await prescriptions.listTemplates() });
  });
  router.post('/prescription-templates', editors, async (req, res) => {
    res
      .status(201)
      .json(await prescriptions.createTemplate(parseBody(req, prescriptionTemplateCreateSchema)));
  });
  router.post('/prescription-templates/defaults', editors, async (_req, res) => {
    res.json(await prescriptions.installDefaultTemplates());
  });
  router.get('/prescription-templates/:id', async (req, res) => {
    res.json(await prescriptions.getTemplate(parseParams(req, idParamsSchema).id));
  });
  router.put('/prescription-templates/:id', editors, async (req, res) => {
    const { id } = parseParams(req, idParamsSchema);
    res.json(
      await prescriptions.updateTemplate(id, parseBody(req, prescriptionTemplateUpdateSchema)),
    );
  });
  router.delete('/prescription-templates/:id', editors, async (req, res) => {
    await prescriptions.removeTemplate(parseParams(req, idParamsSchema).id);
    res.status(204).end();
  });

  // ---- issued prescriptions ----
  router.get('/patients/:id/prescriptions', auth, async (req, res) => {
    res.json({ data: await prescriptions.listForPatient(parseParams(req, idParamsSchema).id) });
  });
  router.get('/prescriptions', async (req, res) => {
    res.json(await prescriptions.list(parseQuery(req, prescriptionListQuerySchema)));
  });
  router.post('/prescriptions/preview', editors, async (req, res) => {
    res.json(await prescriptions.preview(parseBody(req, prescriptionPreviewSchema)));
  });
  router.post('/prescriptions', editors, async (req, res) => {
    res.status(201).json(await prescriptions.create(parseBody(req, prescriptionCreateSchema)));
  });
  router.get('/prescriptions/:id', async (req, res) => {
    res.json(await prescriptions.get(parseParams(req, idParamsSchema).id));
  });
  router.put('/prescriptions/:id', editors, async (req, res) => {
    const { id } = parseParams(req, idParamsSchema);
    res.json(await prescriptions.update(id, parseBody(req, prescriptionUpdateSchema)));
  });
  router.delete('/prescriptions/:id', editors, async (req, res) => {
    await prescriptions.remove(parseParams(req, idParamsSchema).id);
    res.status(204).end();
  });

  return router;
}
