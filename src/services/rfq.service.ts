import prisma from '../config/database';
import { RFQStatus, QuoteStatus } from '../types';

export class RFQService {
  static async createRFQ(data: {
    title: string;
    description: string;
    buyerId: string;
    deadline: Date;
    items: Array<{
      name: string;
      description: string;
      quantity: number;
      unit: string;
      specifications?: string;
    }>;
  }) {
    const rfq = await prisma.rFQ.create({
      data: {
        title: data.title,
        description: data.description,
        buyerId: data.buyerId,
        deadline: data.deadline,
        status: RFQStatus.OPEN,
        items: {
          create: data.items.map(item => ({
            name: item.name,
            description: item.description,
            quantity: item.quantity,
            unit: item.unit,
            specifications: item.specifications,
          })),
        },
      },
      include: {
        items: true,
        buyer: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    return rfq;
  }

  static async getRFQById(id: string) {
    const rfq = await prisma.rFQ.findUnique({
      where: { id },
      include: {
        items: true,
        buyer: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
        quotes: {
          include: {
            supplier: {
              select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                company: true,
              },
            },
            items: true,
          },
        },
      },
    });

    if (!rfq) {
      throw new Error('RFQ not found');
    }

    return rfq;
  }

  static async searchRFQs(query?: {
    buyerId?: string;
    status?: RFQStatus;
    search?: string;
  }) {
    const where: any = {};

    if (query?.buyerId) {
      where.buyerId = query.buyerId;
    }

    if (query?.status) {
      where.status = query.status;
    }

    if (query?.search) {
      where.OR = [
        { title: { contains: query.search, mode: 'insensitive' } },
        { description: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    const rfqs = await prisma.rFQ.findMany({
      where,
      include: {
        items: true,
        buyer: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            company: true,
          },
        },
        _count: {
          select: { quotes: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return rfqs;
  }

  static async closeRFQ(id: string) {
    const rfq = await prisma.rFQ.update({
      where: { id },
      data: { status: RFQStatus.CLOSED },
    });

    return rfq;
  }

  static async awardQuote(rfqId: string, quoteId: string) {
    const [rfq, quote] = await Promise.all([
      prisma.rFQ.findUnique({ where: { id: rfqId } }),
      prisma.quote.findUnique({ where: { id: quoteId } }),
    ]);

    if (!rfq) {
      throw new Error('RFQ not found');
    }

    if (!quote) {
      throw new Error('Quote not found');
    }

    if (quote.rfqId !== rfqId) {
      throw new Error('Quote does not belong to this RFQ');
    }

    const updatedRFQ = await prisma.rFQ.update({
      where: { id: rfqId },
      data: {
        awardedQuoteId: quoteId,
        status: RFQStatus.AWARDED,
      },
    });

    await prisma.quote.update({
      where: { id: quoteId },
      data: { status: QuoteStatus.ACCEPTED },
    });

    return updatedRFQ;
  }

  static async cancelRFQ(id: string) {
    const rfq = await prisma.rFQ.update({
      where: { id },
      data: { status: RFQStatus.CANCELLED },
    });

    return rfq;
  }
}
