import axios from 'axios'
import type { CreateTransactionPayload, Transaction } from '../types/transaction'

const api = axios.create({
  baseURL: '/api',
})

export async function fetchTransactions(params?: {
  tenantId?: string
  status?: string
  type?: string
}): Promise<Transaction[]> {
  const res = await api.get('/transactions', { params })
  return res.data.data
}

export async function fetchTransaction(id: string): Promise<Transaction> {
  const res = await api.get(`/transactions/${id}`)
  return res.data.data
}

export async function createTransaction(payload: CreateTransactionPayload) {
  const res = await api.post('/transactions', payload)
  return res.data
}
