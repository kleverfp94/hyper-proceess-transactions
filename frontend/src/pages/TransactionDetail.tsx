import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { fetchTransaction } from '../api/transactions'
import { StatusBadge, TypeBadge } from '../components/StatusBadge'
import { type Transaction } from '../types/transaction'
import styles from './TransactionDetail.module.css'

export default function TransactionDetail() {
  const { id } = useParams<{ id: string }>()
  const [transaction, setTransaction] = useState<Transaction | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!id) return
    fetchTransaction(id)
      .then(setTransaction)
      .catch(() => setError('Transação não encontrada.'))
      .finally(() => setLoading(false))
  }, [id])

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
      second: '2-digit',
    }).format(new Date(date))
  }

  if (loading) return <div className={styles.state}>Carregando...</div>
  if (error || !transaction) return <div className={styles.stateError}>{error}</div>

  return (
    <div>
      <div className={styles.breadcrumb}>
        <Link to="/" className={styles.breadcrumbLink}>
          Transações
        </Link>
        <span className={styles.breadcrumbSep}>/</span>
        <span className={styles.breadcrumbCurrent}>Detalhes</span>
      </div>

      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Detalhes da Transação</h1>
          <p className={styles.id}>{transaction.id}</p>
        </div>
        <div className={styles.badges}>
          <StatusBadge status={transaction.status} />
          <TypeBadge type={transaction.type} />
        </div>
      </div>

      <div className={styles.amountCard}>
        <span className={styles.amountLabel}>Valor</span>
        <span className={styles.amountValue}>{formatAmount(transaction.amount)}</span>
      </div>

      <div className={styles.grid}>
        <div className={styles.card}>
          <h2 className={styles.cardTitle}>Identificação</h2>
          <div className={styles.fields}>
            <Field label="ID Interno" value={transaction.id} mono />
            <Field label="External ID" value={transaction.externalId} mono />
            <Field label="Tenant ID" value={transaction.tenantId} />
          </div>
        </div>

        <div className={styles.card}>
          <h2 className={styles.cardTitle}>Informações</h2>
          <div className={styles.fields}>
            <Field label="Tipo" value={transaction.type === 'credit' ? 'Crédito' : 'Débito'} />
            <Field label="Status" value={transaction.status} />
            <Field
              label="Descrição"
              value={transaction.description ?? '—'}
            />
          </div>
        </div>

        <div className={styles.card}>
          <h2 className={styles.cardTitle}>Datas</h2>
          <div className={styles.fields}>
            <Field label="Criado em" value={formatDate(transaction.createdAt)} />
            <Field label="Atualizado em" value={formatDate(transaction.updatedAt)} />
          </div>
        </div>
      </div>

      <div className={styles.actions}>
        <Link to="/" className={styles.btnBack}>
          ← Voltar para lista
        </Link>
      </div>
    </div>
  )
}

function Field({
  label,
  value,
  mono,
}: {
  label: string
  value: string
  mono?: boolean
}) {
  return (
    <div className={styles.field}>
      <span className={styles.fieldLabel}>{label}</span>
      <span className={`${styles.fieldValue} ${mono ? styles.mono : ''}`}>{value}</span>
    </div>
  )
}
