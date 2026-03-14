export enum TransactionType {
  CREDIT = 'credit',
  DEBIT = 'debit',
}

export enum TransactionStatus {
  PENDING = 'pending',
  PROCESSED = 'processed',
  FAILED = 'failed',
}

export interface Transaction {
  id: string
  externalId: string
  tenantId: string
  amount: number
  type: TransactionType
  status: TransactionStatus
  description: string | null
  createdAt: string
  updatedAt: string
}

export interface CreateTransactionPayload {
  externalId: string
  tenantId: string
  amount: number
  type: TransactionType
  description?: string
}
