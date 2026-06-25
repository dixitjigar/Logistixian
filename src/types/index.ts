export enum UserRole {
  BUYER = 'BUYER',
  SUPPLIER = 'SUPPLIER',
  ADMIN = 'ADMIN',
}

export enum DocumentType {
  NDA = 'NDA',
  CONTRACT = 'CONTRACT',
  MOU = 'MOU',
  LOI = 'LOI',
  AGREEMENT = 'AGREEMENT',
  INVOICE = 'INVOICE',
  QUOTE = 'QUOTE',
  RFQ = 'RFQ',
}

export enum DocumentStatus {
  DRAFT = 'DRAFT',
  PENDING_SIGNATURE = 'PENDING_SIGNATURE',
  SIGNED = 'SIGNED',
  REJECTED = 'REJECTED',
  EXPIRED = 'EXPIRED',
}

export enum RFQStatus {
  DRAFT = 'DRAFT',
  OPEN = 'OPEN',
  CLOSED = 'CLOSED',
  EVALUATING = 'EVALUATING',
  AWARDED = 'AWARDED',
  CANCELLED = 'CANCELLED',
}

export enum QuoteStatus {
  PENDING = 'PENDING',
  SUBMITTED = 'SUBMITTED',
  ACCEPTED = 'ACCEPTED',
  REJECTED = 'REJECTED',
  NEGOTIATING = 'NEGOTIATING',
}

export enum AuditStatus {
  SCHEDULED = 'SCHEDULED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
}

export interface IUser {
  id: string;
  email: string;
  passwordHash: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  companyId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ICompany {
  id: string;
  name: string;
  type: UserRole.BUYER | UserRole.SUPPLIER;
  industry?: string;
  country?: string;
  website?: string;
  description?: string;
  verified: boolean;
  rating?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface IDocument {
  id: string;
  title: string;
  type: DocumentType;
  status: DocumentStatus;
  senderId: string;
  recipientId: string;
  content: string;
  signatureData?: string;
  signedAt?: Date;
  expiresAt?: Date;
  blockchainTxHash?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IRFQ {
  id: string;
  title: string;
  description: string;
  buyerId: string;
  status: RFQStatus;
  items: RFQItem[];
  deadline: Date;
  awardedQuoteId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface RFQItem {
  id: string;
  name: string;
  description: string;
  quantity: number;
  unit: string;
  specifications?: string;
}

export interface IQuote {
  id: string;
  rfqId: string;
  supplierId: string;
  status: QuoteStatus;
  items: QuoteItem[];
  totalAmount: number;
  currency: string;
  validUntil: Date;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface QuoteItem {
  id: string;
  rfqItemId: string;
  unitPrice: number;
  quantity: number;
  totalPrice: number;
  leadTime?: number;
  specifications?: string;
}

export interface IAudit {
  id: string;
  supplierId: string;
  auditorId: string;
  status: AuditStatus;
  scheduledDate: Date;
  completedDate?: Date;
  findings?: AuditFinding[];
  score?: number;
  report?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface AuditFinding {
  id: string;
  category: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  description: string;
  remediation?: string;
  status: 'OPEN' | 'RESOLVED';
}

export interface IQBR {
  id: string;
  buyerId: string;
  supplierId: string;
  quarter: string; // e.g., "2024-Q1"
  meetingDate?: Date;
  kpis: QBRKPI[];
  actionItems: QBRActionItem[];
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface QBRKPI {
  id: string;
  name: string;
  target: number;
  actual: number;
  unit: string;
  weight: number;
}

export interface QBRActionItem {
  id: string;
  description: string;
  owner: string;
  dueDate: Date;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED';
}

export interface ISupplierEvaluation {
  id: string;
  supplierId: string;
  evaluatorId: string;
  period: string;
  categories: EvaluationCategory[];
  overallScore: number;
  comments?: string;
  createdAt: Date;
}

export interface EvaluationCategory {
  id: string;
  name: string;
  score: number;
  maxScore: number;
  weight: number;
  comments?: string;
}
