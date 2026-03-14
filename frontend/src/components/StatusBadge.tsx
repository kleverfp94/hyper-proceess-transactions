import { TransactionStatus, TransactionType } from '../types/transaction'
import styles from './StatusBadge.module.css'

interface StatusBadgeProps {
  status: TransactionStatus
}

interface TypeBadgeProps {
  type: TransactionType
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const labels: Record<TransactionStatus, string> = {
    [TransactionStatus.PENDING]: 'Pendente',
    [TransactionStatus.PROCESSED]: 'Processado',
    [TransactionStatus.FAILED]: 'Falhou',
  }

  return (
    <span className={`${styles.badge} ${styles[status]}`}>
      <span className={styles.dot} />
      {labels[status]}
    </span>
  )
}

export function TypeBadge({ type }: TypeBadgeProps) {
  return (
    <span className={`${styles.badge} ${styles[type]}`}>
      {type === TransactionType.CREDIT ? '↑ Crédito' : '↓ Débito'}
    </span>
  )
}
