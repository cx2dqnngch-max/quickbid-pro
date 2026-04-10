export interface BusinessProfile {
  businessName: string;
  ownerName: string;
  phone: string;
  email: string;
  address?: string;
  defaultNotes?: string;
  defaultTerms?: string;
  estimatePrefix: string;
  invoicePrefix: string;
  currencySymbol: string;
  nextEstimateNumber: number;
  nextInvoiceNumber: number;
  onboardingComplete: boolean;
}

export interface Customer {
  id: string;
  fullName: string;
  companyName?: string;
  phone: string;
  email: string;
  serviceAddress: string;
  billingAddress?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface LineItem {
  id: string;
  title: string;
  description?: string;
  quantity: number;
  unitPrice: number;
}

export type EstimateStatus = "draft" | "sent" | "accepted" | "declined";
export type InvoiceStatus = "draft" | "sent" | "paid" | "unpaid" | "overdue";
export type DocumentType = "estimate" | "invoice";

export interface Estimate {
  id: string;
  estimateNumber: string;
  customerId: string;
  customerSnapshot?: Customer;
  status: EstimateStatus;
  date: string;
  expirationDate?: string;
  lineItems: LineItem[];
  discount?: number;
  discountType?: "flat" | "percent";
  depositRequested?: number;
  notes?: string;
  terms?: string;
  createdAt: string;
  updatedAt: string;
  convertedToInvoiceId?: string;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  customerId: string;
  customerSnapshot?: Customer;
  status: InvoiceStatus;
  issueDate: string;
  dueDate?: string;
  paidDate?: string;
  lineItems: LineItem[];
  discount?: number;
  discountType?: "flat" | "percent";
  depositRequested?: number;
  paymentNote?: string;
  notes?: string;
  terms?: string;
  fromEstimateId?: string;
  createdAt: string;
  updatedAt: string;
}

// Reserved for future subscription support
export interface AppSettings {
  subscriptionStatus: "free" | "pro";
  subscriptionExpiry?: string;
}
