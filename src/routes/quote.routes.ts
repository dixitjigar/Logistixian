import { Router } from 'express';
import { body, query } from 'express-validator';
import { authenticate, validate } from '../middleware/auth';
import { validate as validateRequest } from '../middleware/validation';
import { QuoteService } from '../services/quote.service';
import { QuoteStatus } from '../types';

const router = Router();

/**
 * POST /api/quotes
 * Submit a quote for an RFQ (Supplier only)
 */
router.post(
  '/',
  authenticate,
  body('rfqId').notEmpty().withMessage('RFQ ID is required'),
  body('validUntil').isISO8601().withMessage('Valid until date is required'),
  body('notes').optional().trim(),
  body('items').isArray({ min: 1 }).withMessage('At least one item is required'),
  body('items.*.rfqItemId').notEmpty(),
  body('items.*.unitPrice').isFloat({ min: 0 }),
  body('items.*.quantity').isInt({ min: 1 }),
  validate,
  async (req: any, res) => {
    try {
      const { rfqId, validUntil, notes, items } = req.body;

      const quote = await QuoteService.createQuote({
        rfqId,
        supplierId: req.user.id,
        validUntil: new Date(validUntil),
        notes,
        items: items.map((item: any) => ({
          rfqItemId: item.rfqItemId,
          unitPrice: parseFloat(item.unitPrice),
          quantity: parseInt(item.quantity, 10),
          leadTime: item.leadTime,
          specifications: item.specifications,
        })),
      });

      res.status(201).json({
        message: 'Quote submitted successfully',
        data: quote,
      });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }
);

/**
 * GET /api/quotes/rfq/:rfqId
 * Get all quotes for an RFQ
 */
router.get(
  '/rfq/:rfqId',
  authenticate,
  async (req: any, res) => {
    try {
      const { rfqId } = req.params;
      const quotes = await QuoteService.getQuotesByRFQ(rfqId);
      res.json({ data: quotes });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
);

/**
 * GET /api/quotes/my-quotes
 * Get quotes submitted by current user
 */
router.get('/my-quotes', authenticate, async (req: any, res) => {
  try {
    const quotes = await QuoteService.getQuotesBySupplier(req.user.id);
    res.json({ data: quotes });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/quotes/:id
 * Get quote by ID
 */
router.get('/:id', authenticate, async (req: any, res) => {
  try {
    const { id } = req.params;
    const quote = await QuoteService.getQuoteById(id);
    res.json({ data: quote });
  } catch (error: any) {
    res.status(404).json({ error: error.message });
  }
});

/**
 * PUT /api/quotes/:id/status
 * Update quote status
 */
router.put(
  '/:id/status',
  authenticate,
  body('status').isIn(Object.values(QuoteStatus)).withMessage('Invalid status'),
  validate,
  async (req: any, res) => {
    try {
      const { id } = req.params;
      const { status } = req.body;

      const quote = await QuoteService.getQuoteById(id);

      // Only supplier can update their quote status
      if (quote.supplierId !== req.user.id) {
        return res.status(403).json({ error: 'Only the supplier can update this quote' });
      }

      const updated = await QuoteService.updateQuoteStatus(id, status as QuoteStatus);
      res.json({ message: 'Quote status updated', data: updated });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }
);

/**
 * POST /api/quotes/:id/reject
 * Reject a quote (Buyer only)
 */
router.post('/:id/reject', authenticate, async (req: any, res) => {
  try {
    const { id } = req.params;
    const rejected = await QuoteService.rejectQuote(id);
    res.json({ message: 'Quote rejected', data: rejected });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

export default router;
