import prisma from '../config/database';
import { DocumentType, DocumentStatus } from '../types';

export class DocumentService {
  static async createDocument(data: {
    title: string;
    type: DocumentType;
    senderId: string;
    recipientId: string;
    content: string;
    expiresAt?: Date;
  }) {
    const document = await prisma.document.create({
      data: {
        ...data,
        status: DocumentStatus.PENDING_SIGNATURE,
      },
      include: {
        sender: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
        recipient: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    return document;
  }

  static async getDocumentById(id: string) {
    const document = await prisma.document.findUnique({
      where: { id },
      include: {
        sender: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
        recipient: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    if (!document) {
      throw new Error('Document not found');
    }

    return document;
  }

  static async getDocumentsByUserId(userId: string, role: 'sender' | 'recipient') {
    const documents = await prisma.document.findMany({
      where: role === 'sender' ? { senderId: userId } : { recipientId: userId },
      include: {
        sender: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
        recipient: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return documents;
  }

  static async signDocument(id: string, userId: string, signatureData: string, blockchainTxHash?: string) {
    const document = await prisma.document.findUnique({
      where: { id },
    });

    if (!document) {
      throw new Error('Document not found');
    }

    if (document.recipientId !== userId) {
      throw new Error('Only the recipient can sign this document');
    }

    if (document.status !== DocumentStatus.PENDING_SIGNATURE) {
      throw new Error('Document is not pending signature');
    }

    const signedDocument = await prisma.document.update({
      where: { id },
      data: {
        signatureData,
        signedAt: new Date(),
        status: DocumentStatus.SIGNED,
        blockchainTxHash,
      },
      include: {
        sender: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
        recipient: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    return signedDocument;
  }

  static async rejectDocument(id: string, userId: string) {
    const document = await prisma.document.findUnique({
      where: { id },
    });

    if (!document) {
      throw new Error('Document not found');
    }

    if (document.recipientId !== userId) {
      throw new Error('Only the recipient can reject this document');
    }

    const rejectedDocument = await prisma.document.update({
      where: { id },
      data: {
        status: DocumentStatus.REJECTED,
      },
    });

    return rejectedDocument;
  }

  static async updateDocument(id: string, data: {
    title?: string;
    content?: string;
    expiresAt?: Date;
  }) {
    const document = await prisma.document.update({
      where: { id },
      data,
    });

    return document;
  }
}
