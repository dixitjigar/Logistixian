import prisma from '../config/database';
import { QuoteStatus } from '../types';

export class QuoteService {
  static async createQuote(data: {
    rfqId: string;
    supplierId: string;
    validUntil: Date;
    notes?: string;
    items: Array<{
      rfqItemId: string;
      unitPrice: number;
      quantity: number;
      leadTime?: number;
      specifications?: string;
    }>;
  }) {
    const rfq = await prisma.rFQ.findUnique({
      where: { id: data.rfqId },
      include: { items: true },
    });

    if (!rfq) {
      throw new Error('RFQ not found');
    }

    if (rfq.status !== 'OPEN') {
      throw new Error('RFQ is not open for quotes');
    }

    const quoteItems = data.items.map(item => ({
      rfqItemId: item.rfqItemId,
      unitPrice: item.unitPrice,
      quantity: item.quantity,
      totalPrice: item.unitPrice * item.quantity,
      leadTime: item.leadTime,
      specifications: item.specifications,
    }));

    const totalAmount = quoteItems.reduce((sum, item) => sum + item.totalPrice, 0);

    const quote = await prisma.quote.create({
      data: {
        rfqId: data.rfqId,
        supplierId: data.supplierId,
        status: QuoteStatus.SUBMITTED,
        validUntil: data.validUntil,
        notes: data.notes,
        totalAmount,
        currency: 'USD',
        items: {
          create: quoteItems,
        },
      },
      include: {
        items: true,
        supplier: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            company: true,
          },
        },
        rfq: {
          select: {
            id: true,
            title: true,
          },
        },
      },
    });

    return quote;
  }

  static async getQuoteById(id: string) {
    const quote = await prisma.quote.findUnique({
      where: { id },
      include: {
        items: true,
        supplier: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            company: true,
          },
        },
        rfq: {
          include: {
            buyer: {
              select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        },
      },
    });

    if (!quote) {
      throw new Error('Quote not found');
    }

    return quote;
  }

  static async getQuotesByRFQ(rfqId: string) {
    const quotes = await prisma.quote.findMany({
      where: { rfqId },
      include: {
        items: true,
        supplier: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            company: true,
          },
        },
      },
      orderBy: { totalAmount: 'asc' },
    });

    return quotes;
  }

  static async getQuotesBySupplier(supplierId: string) {
    const quotes = await prisma.quote.findMany({
      where: { supplierId },
      include: {
        items: true,
        rfq: {
          select: {
            id: true,
            title: true,
            buyer: {
              select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return quotes;
  }

  static async updateQuoteStatus(id: string, status: QuoteStatus) {
    const quote = await prisma.quote.update({
      where: { id },
      data: { status },
    });

    return quote;
  }

  static async rejectQuote(id: string) {
    const quote = await prisma.quote.update({
      where: { id },
      data: { status: QuoteStatus.REJECTED },
    });

    return quote;
  }
}
