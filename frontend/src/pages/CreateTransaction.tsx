import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { createTransaction } from '../api/transactions'
import { TENANT_ID } from '../config/tenant'
import { TransactionType } from '../types/transaction'
import styles from './CreateTransaction.module.css'

interface FormState {
  externalId: string
  amount: string
  type: TransactionType
  description: string
}

const initial: FormState = {
  externalId: '',
  amount: '',
  type: TransactionType.CREDIT,
  description: '',
}

export default function CreateTransaction() {
  const navigate = useNavigate()
  const [form, setForm] = useState<FormState>(initial)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<{ jobId: string; externalId: string } | null>(null)

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    const amount = parseFloat(form.amount)
    if (isNaN(amount) || amount <= 0) {
      setError('Informe um valor válido e positivo.')
      return
    }

    setLoading(true)
    try {
      const result = await createTransaction({
        externalId: form.externalId,
        tenantId: TENANT_ID,
        amount,
        type: form.type,
        ...(form.description ? { description: form.description } : {}),
      })
      setSuccess({ jobId: result.jobId, externalId: result.externalId })
      setForm(initial)
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string | string[] } } }
      const msg = axiosErr?.response?.data?.message
      setError(Array.isArray(msg) ? msg.join(', ') : (msg ?? 'Erro ao criar transação.'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <div className={styles.breadcrumb}>
        <Link to="/" className={styles.breadcrumbLink}>
          Transações
        </Link>
        <span className={styles.breadcrumbSep}>/</span>
        <span className={styles.breadcrumbCurrent}>Nova Transação</span>
      </div>

      <div className={styles.header}>
        <h1 className={styles.title}>Nova Transação</h1>
        <p className={styles.subtitle}>Preencha os campos para criar uma nova transação</p>
      </div>

      <div className={styles.formCard}>
        {success && (
          <div className={styles.successBanner}>
            <div>
              <strong>Transação enviada com sucesso!</strong>
            </div>
            <div className={styles.successActions}>
              <button className={styles.btnLink} onClick={() => setSuccess(null)}>
                Nova
              </button>
              <button className={styles.btnLink} onClick={() => navigate('/')}>
                Ver lista
              </button>
            </div>
          </div>
        )}

        {error && <div className={styles.errorBanner}>{error}</div>}

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.row}>
            <div className={styles.field}>
              <label className={styles.label} htmlFor="externalId">
                External ID <span className={styles.required}>*</span>
              </label>
              <input
                id="externalId"
                name="externalId"
                className={styles.input}
                placeholder="ex: TXN-001"
                value={form.externalId}
                onChange={handleChange}
                required
              />
              <span className={styles.hint}>Identificador único da transação no sistema de origem</span>
            </div>

          </div>

          <div className={styles.row}>
            <div className={styles.field}>
              <label className={styles.label} htmlFor="amount">
                Valor (R$) <span className={styles.required}>*</span>
              </label>
              <input
                id="amount"
                name="amount"
                type="number"
                step="0.01"
                min="0.01"
                className={styles.input}
                placeholder="0,00"
                value={form.amount}
                onChange={handleChange}
                required
              />
            </div>

            <div className={styles.field}>
              <label className={styles.label} htmlFor="type">
                Tipo <span className={styles.required}>*</span>
              </label>
              <select
                id="type"
                name="type"
                className={styles.select}
                value={form.type}
                onChange={handleChange}
                required
              >
                <option value={TransactionType.CREDIT}>Crédito</option>
                <option value={TransactionType.DEBIT}>Débito</option>
              </select>
            </div>
          </div>

          <div className={styles.field}>
            <label className={styles.label} htmlFor="description">
              Descrição <span className={styles.optional}>(opcional)</span>
            </label>
            <textarea
              id="description"
              name="description"
              className={styles.textarea}
              placeholder="Descreva a transação..."
              value={form.description}
              onChange={handleChange}
              rows={3}
            />
          </div>

          <div className={styles.formActions}>
            <Link to="/" className={styles.btnCancel}>
              Cancelar
            </Link>
            <button type="submit" className={styles.btnSubmit} disabled={loading}>
              {loading ? 'Enviando...' : 'Criar Transação'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
