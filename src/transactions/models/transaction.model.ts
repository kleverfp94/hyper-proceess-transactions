import {
  Column,
  CreatedAt,
  DataType,
  Index,
  Model,
  Table,
  UpdatedAt,
} from 'sequelize-typescript';

export enum TransactionType {
  CREDIT = 'credit',
  DEBIT = 'debit',
}

export enum TransactionStatus {
  PENDING = 'pending',
  PROCESSED = 'processed',
  FAILED = 'failed',
}

@Table({
  tableName: 'transactions',
  timestamps: true,
  indexes: [
    // Constraint composta: mesma transação (externalId) não pode ser
    // processada duas vezes dentro do mesmo tenant (tenantId).
    // Tenants diferentes podem ter o mesmo externalId sem conflito.
    { unique: true, fields: ['tenant_id', 'external_id'], name: 'uq_tenant_external' },
  ],
})
export class Transaction extends Model {
  @Column({
    type: DataType.UUID,
    defaultValue: DataType.UUIDV4,
    primaryKey: true,
  })
  declare id: string;

  @Column({ type: DataType.STRING, allowNull: false })
  declare externalId: string;

  @Column({ type: DataType.STRING, allowNull: false })
  declare tenantId: string;

  @Column({ type: DataType.DECIMAL(15, 2), allowNull: false })
  declare amount: number;

  @Column({ type: DataType.ENUM(...Object.values(TransactionType)), allowNull: false })
  declare type: TransactionType;

  @Column({
    type: DataType.ENUM(...Object.values(TransactionStatus)),
    defaultValue: TransactionStatus.PENDING,
  })
  declare status: TransactionStatus;

  @Column({ type: DataType.STRING, allowNull: true })
  declare description: string | null;

  @CreatedAt
  declare createdAt: Date;

  @UpdatedAt
  declare updatedAt: Date;
}
