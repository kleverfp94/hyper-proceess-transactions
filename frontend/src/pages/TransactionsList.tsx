import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { fetchTransactions } from '../api/transactions'
import { StatusBadge, TypeBadge } from '../components/StatusBadge'
import { TENANT_ID } from '../config/tenant'
import { TransactionStatus, TransactionType, type Transaction } from '../types/transaction'
import styles from './TransactionsList.module.css'

export default function TransactionsList() {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filters, setFilters] = useState({ status: '', type: '' })

  async function load() {
    setLoading(true)
    setError(null)
    try {
      const params = {
        tenantId: TENANT_ID,
        ...(filters.status ? { status: filters.status } : {}),
        ...(filters.type ? { type: filters.type } : {}),
      }
      const data = await fetchTransactions(params)
      setTransactions(data)
    } catch {
      setError('Erro ao carregar transações.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  function formatAmount(amount: number) {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(amount)
  }

  function formatDate(date: string) {
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(date))
  }

  return (
    <div>
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.title}>Transações</h1>
          <p className={styles.subtitle}>Gerencie e acompanhe todas as transações</p>
        </div>
        <Link to="/nova" className={styles.btnPrimary}>
          + Nova Transação
        </Link>
      </div>

      <div className={styles.filters}>
        <select
          className={styles.select}
          value={filters.status}
          onChange={(e) => setFilters((f) => ({ ...f, status: e.target.value }))}
        >
          <option value="">Todos os status</option>
          <option value={TransactionStatus.PENDING}>Pendente</option>
          <option value={TransactionStatus.PROCESSED}>Processado</option>
          <option value={TransactionStatus.FAILED}>Falhou</option>
        </select>
        <select
          className={styles.select}
          value={filters.type}
          onChange={(e) => setFilters((f) => ({ ...f, type: e.target.value }))}
        >
          <option value="">Todos os tipos</option>
          <option value={TransactionType.CREDIT}>Crédito</option>
          <option value={TransactionType.DEBIT}>Débito</option>
        </select>
        <button className={styles.btnSecondary} onClick={load}>
          Buscar
        </button>
      </div>

      {loading && <div className={styles.state}>Carregando...</div>}
      {error && <div className={styles.stateError}>{error}</div>}

      {!loading && !error && transactions.length === 0 && (
        <div className={styles.state}>Nenhuma transação encontrada.</div>
      )}

      {!loading && !error && transactions.length > 0 && (
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>External ID</th>
                <th>Tenant</th>
                <th>Tipo</th>
                <th>Valor</th>
                <th>Status</th>
                <th>Data</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((tx) => (
                <tr key={tx.id}>
                  <td className={styles.mono}>{tx.externalId}</td>
                  <td>{tx.tenantId}</td>
                  <td>
                    <TypeBadge type={tx.type} />
                  </td>
                  <td className={styles.amount}>{formatAmount(tx.amount)}</td>
                  <td>
                    <StatusBadge status={tx.status} />
                  </td>
                  <td className={styles.date}>{formatDate(tx.createdAt)}</td>
                  <td>
                    <Link to={`/transacoes/${tx.id}`} className={styles.linkDetail}>
                      Ver →
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
