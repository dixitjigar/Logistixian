import { Router } from 'express';
import { body, query } from 'express-validator';
import { authenticate, validate } from '../middleware/auth';
import { validate as validateRequest } from '../middleware/validation';
import { DocumentService } from '../services/document.service';
import { blockchainService } from '../services/blockchain.service';
import { DocumentType, DocumentStatus } from '../types';

const router = Router();

/**
 * POST /api/documents
 * Create and send a document for signature
 */
router.post(
  '/',
  authenticate,
  body('title').trim().notEmpty().withMessage('Title is required'),
  body('type').isIn(Object.values(DocumentType)).withMessage('Invalid document type'),
  body('recipientId').notEmpty().withMessage('Recipient ID is required'),
  body('content').notEmpty().withMessage('Content is required'),
  body('expiresAt').optional().isISO8601(),
  validate,
  async (req: any, res) => {
    try {
      const { title, type, recipientId, content, expiresAt } = req.body;

      const document = await DocumentService.createDocument({
        title,
        type: type as DocumentType,
        senderId: req.user.id,
        recipientId,
        content,
        expiresAt: expiresAt ? new Date(expiresAt) : undefined,
      });

      // Record on blockchain (async, non-blocking)
      blockchainService
        .recordDocumentHash(document.id, content, req.user.id, recipientId)
        .then(txHash => {
          if (txHash) {
            console.log(`📝 Document ${document.id} recorded on blockchain: ${txHash}`);
          }
        })
        .catch(err => console.error('Blockchain recording failed:', err));

      res.status(201).json({
        message: 'Document created and sent for signature',
        data: document,
      });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }
);

/**
 * GET /api/documents/sent
 * Get documents sent by current user
 */
router.get('/sent', authenticate, async (req: any, res) => {
  try {
    const documents = await DocumentService.getDocumentsByUserId(req.user.id, 'sender');
    res.json({ data: documents });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/documents/received
 * Get documents received by current user
 */
router.get('/received', authenticate, async (req: any, res) => {
  try {
    const documents = await DocumentService.getDocumentsByUserId(req.user.id, 'recipient');
    res.json({ data: documents });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/documents/:id
 * Get document by ID
 */
router.get('/:id', authenticate, async (req: any, res) => {
  try {
    const { id } = req.params;
    const document = await DocumentService.getDocumentById(id);

    // Verify access
    if (document.senderId !== req.user.id && document.recipientId !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    res.json({ data: document });
  } catch (error: any) {
    res.status(404).json({ error: error.message });
  }
});

/**
 * POST /api/documents/:id/sign
 * Sign a document
 */
router.post(
  '/:id/sign',
  authenticate,
  body('signatureData').notEmpty().withMessage('Signature data is required'),
  validate,
  async (req: any, res) => {
    try {
      const { id } = req.params;
      const { signatureData } = req.body;

      const document = await DocumentService.getDocumentById(id);

      // Verify access
      if (document.recipientId !== req.user.id) {
        return res.status(403).json({ error: 'Only the recipient can sign this document' });
      }

      // Record signature on blockchain
      const txHash = await blockchainService.recordDocumentHash(
        id,
        document.content + signatureData,
        document.senderId,
        document.recipientId
      );

      const signedDocument = await DocumentService.signDocument(
        id,
        req.user.id,
        signatureData,
        txHash || undefined
      );

      res.json({
        message: 'Document signed successfully',
        data: signedDocument,
      });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }
);

/**
 * POST /api/documents/:id/reject
 * Reject a document
 */
router.post('/:id/reject', authenticate, async (req: any, res) => {
  try {
    const { id } = req.params;
    const rejectedDocument = await DocumentService.rejectDocument(id, req.user.id);
    res.json({ message: 'Document rejected', data: rejectedDocument });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

/**
 * PUT /api/documents/:id
 * Update a draft document
 */
router.put(
  '/:id',
  authenticate,
  body('title').optional().trim(),
  body('content').optional(),
  body('expiresAt').optional().isISO8601(),
  validate,
  async (req: any, res) => {
    try {
      const { id } = req.params;
      const updates = req.body;

      const document = await DocumentService.getDocumentById(id);

      // Only sender can update draft documents
      if (document.senderId !== req.user.id) {
        return res.status(403).json({ error: 'Only the sender can update this document' });
      }

      if (document.status !== DocumentStatus.DRAFT && document.status !== DocumentStatus.PENDING_SIGNATURE) {
        return res.status(400).json({ error: 'Cannot update signed or rejected documents' });
      }

      const updated = await DocumentService.updateDocument(id, updates);
      res.json({ message: 'Document updated', data: updated });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }
);

/**
 * GET /api/documents/:id/verify
 * Verify document integrity against blockchain
 */
router.get('/:id/verify', authenticate, async (req: any, res) => {
  try {
    const { id } = req.params;
    const document = await DocumentService.getDocumentById(id);

    const isValid = await blockchainService.verifyDocument(id, document.content);

    res.json({
      data: {
        documentId: id,
        isValid,
        blockchainTxHash: document.blockchainTxHash,
        verifiedAt: new Date().toISOString(),
      },
    });
  } catch (error: any) {
    res.status(404).json({ error: error.message });
  }
});

export default router;
