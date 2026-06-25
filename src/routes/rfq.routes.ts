import { Router } from 'express';
import { body, query } from 'express-validator';
import { authenticate, validate } from '../middleware/auth';
import { validate as validateRequest } from '../middleware/validation';
import { RFQService } from '../services/rfq.service';
import { QuoteService } from '../services/quote.service';
import { RFQStatus, QuoteStatus } from '../types';

const router = Router();

/**
 * POST /api/rfqs
 * Create a new RFQ (Buyer only)
 */
router.post(
  '/',
  authenticate,
  body('title').trim().notEmpty().withMessage('Title is required'),
  body('description').trim().notEmpty().withMessage('Description is required'),
  body('deadline').isISO8601().withMessage('Valid deadline is required'),
  body('items').isArray({ min: 1 }).withMessage('At least one item is required'),
  body('items.*.name').trim().notEmpty(),
  body('items.*.quantity').isFloat({ min: 1 }),
  body('items.*.unit').trim().notEmpty(),
  validate,
  async (req: any, res) => {
    try {
      const { title, description, deadline, items } = req.body;

      const rfq = await RFQService.createRFQ({
        title,
        description,
        buyerId: req.user.id,
        deadline: new Date(deadline),
        items: items.map((item: any) => ({
          name: item.name,
          description: item.description || '',
          quantity: parseFloat(item.quantity),
          unit: item.unit,
          specifications: item.specifications,
        })),
      });

      res.status(201).json({
        message: 'RFQ created successfully',
        data: rfq,
      });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }
);

/**
 * GET /api/rfqs
 * Search RFQs
 */
router.get(
  '/',
  authenticate,
  query('buyerId').optional(),
  query('status').optional().isIn(Object.values(RFQStatus)),
  query('search').optional().trim(),
  validate,
  async (req: any, res) => {
    try {
      const { buyerId, status, search } = req.query;

      const rfqs = await RFQService.searchRFQs({
        buyerId,
        status: status as RFQStatus,
        search,
      });

      res.json({ data: rfqs });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
);

/**
 * GET /api/rfqs/:id
 * Get RFQ by ID
 */
router.get('/:id', authenticate, async (req: any, res) => {
  try {
    const { id } = req.params;
    const rfq = await RFQService.getRFQById(id);
    res.json({ data: rfq });
  } catch (error: any) {
    res.status(404).json({ error: error.message });
  }
});

/**
 * POST /api/rfqs/:id/close
 * Close an RFQ
 */
router.post('/:id/close', authenticate, async (req: any, res) => {
  try {
    const { id } = req.params;
    const rfq = await RFQService.getRFQById(id);

    if (rfq.buyerId !== req.user.id) {
      return res.status(403).json({ error: 'Only the buyer can close this RFQ' });
    }

    const closed = await RFQService.closeRFQ(id);
    res.json({ message: 'RFQ closed', data: closed });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

/**
 * POST /api/rfqs/:id/award
 * Award a quote
 */
router.post(
  '/:id/award',
  authenticate,
  body('quoteId').notEmpty().withMessage('Quote ID is required'),
  validate,
  async (req: any, res) => {
    try {
      const { id } = req.params;
      const { quoteId } = req.body;

      const rfq = await RFQService.getRFQById(id);

      if (rfq.buyerId !== req.user.id) {
        return res.status(403).json({ error: 'Only the buyer can award quotes' });
      }

      const awarded = await RFQService.awardQuote(id, quoteId);
      res.json({ message: 'Quote awarded', data: awarded });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }
);

/**
 * POST /api/rfqs/:id/cancel
 * Cancel an RFQ
 */
router.post('/:id/cancel', authenticate, async (req: any, res) => {
  try {
    const { id } = req.params;
    const rfq = await RFQService.getRFQById(id);

    if (rfq.buyerId !== req.user.id) {
      return res.status(403).json({ error: 'Only the buyer can cancel this RFQ' });
    }

    const cancelled = await RFQService.cancelRFQ(id);
    res.json({ message: 'RFQ cancelled', data: cancelled });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

export default router;
