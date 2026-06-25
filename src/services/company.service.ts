import prisma from '../config/database';
import { UserRole } from '../types';

export class CompanyService {
  static async createCompany(data: {
    name: string;
    type: UserRole.BUYER | UserRole.SUPPLIER;
    industry?: string;
    country?: string;
    website?: string;
    description?: string;
  }) {
    const company = await prisma.company.create({
      data,
      select: {
        id: true,
        name: true,
        type: true,
        industry: true,
        country: true,
        website: true,
        description: true,
        verified: true,
        rating: true,
        createdAt: true,
      },
    });

    return company;
  }

  static async getCompanyById(id: string) {
    const company = await prisma.company.findUnique({
      where: { id },
      include: {
        users: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            role: true,
          },
        },
      },
    });

    if (!company) {
      throw new Error('Company not found');
    }

    return company;
  }

  static async searchCompanies(query?: {
    search?: string;
    type?: UserRole.BUYER | UserRole.SUPPLIER;
    country?: string;
    industry?: string;
    verified?: boolean;
  }) {
    const where: any = {};

    if (query?.search) {
      where.OR = [
        { name: { contains: query.search, mode: 'insensitive' } },
        { description: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    if (query?.type) {
      where.type = query.type;
    }

    if (query?.country) {
      where.country = query.country;
    }

    if (query?.industry) {
      where.industry = query.industry;
    }

    if (query?.verified !== undefined) {
      where.verified = query.verified;
    }

    const companies = await prisma.company.findMany({
      where,
      select: {
        id: true,
        name: true,
        type: true,
        industry: true,
        country: true,
        website: true,
        verified: true,
        rating: true,
        description: true,
        createdAt: true,
      },
      orderBy: { rating: 'desc' },
      take: 50,
    });

    return companies;
  }

  static async updateCompany(id: string, data: {
    name?: string;
    industry?: string;
    country?: string;
    website?: string;
    description?: string;
  }) {
    const company = await prisma.company.update({
      where: { id },
      data,
      select: {
        id: true,
        name: true,
        type: true,
        industry: true,
        country: true,
        website: true,
        description: true,
        verified: true,
        rating: true,
        updatedAt: true,
      },
    });

    return company;
  }

  static async verifyCompany(id: string, verified: boolean) {
    const company = await prisma.company.update({
      where: { id },
      data: { verified },
      select: {
        id: true,
        name: true,
        verified: true,
        updatedAt: true,
      },
    });

    return company;
  }
}
