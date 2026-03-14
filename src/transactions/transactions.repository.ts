import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { WhereOptions } from 'sequelize';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { QueryTransactionsDto } from './dto/query-transactions.dto';
import { Transaction, TransactionStatus } from './models/transaction.model';

@Injectable()
export class TransactionsRepository {
  private readonly logger = new Logger(TransactionsRepository.name);

  constructor(@InjectModel(Transaction) private readonly model: typeof Transaction) {}

  // Idempotência por (tenantId + externalId): a mesma transação não pode
  // ser processada duas vezes dentro do mesmo tenant.
  // O índice único composto no banco é a garantia definitiva em concorrência.
  async findOrCreate(dto: CreateTransactionDto): Promise<{ transaction: Transaction; created: boolean }> {
    const [transaction, created] = await this.model.findOrCreate({
      where: { tenantId: dto.tenantId, externalId: dto.externalId },
      defaults: {
        amount: dto.amount,
        type: dto.type,
        description: dto.description ?? null,
        status: TransactionStatus.PROCESSED,
      },
    });

    if (!created) {
      this.logger.warn({ msg: 'Duplicate transaction attempt', tenantId: dto.tenantId, externalId: dto.externalId });
    } else {
      this.logger.log({ msg: 'Transaction created', id: transaction.id, tenantId: dto.tenantId, externalId: dto.externalId });
    }

    return { transaction, created };
  }

  async findAll(query: QueryTransactionsDto): Promise<Transaction[]> {
    const where: WhereOptions = { tenantId: query.tenantId };

    if (query.status) where.status = query.status;
    if (query.type) where.type = query.type;

    return this.model.findAll({ where, order: [['createdAt', 'DESC']] });
  }

  async findById(id: string): Promise<Transaction | null> {
    return this.model.findByPk(id);
  }
}
