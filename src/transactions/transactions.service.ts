import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { QueryTransactionsDto } from './dto/query-transactions.dto';
import { Transaction } from './models/transaction.model';
import { TransactionsRepository } from './transactions.repository';

@Injectable()
export class TransactionsService {
  private readonly logger = new Logger(TransactionsService.name);

  constructor(private readonly repository: TransactionsRepository) {}

  async create(
    dto: CreateTransactionDto,
  ): Promise<{ transaction: Transaction; created: boolean }> {
    this.logger.log({
      msg: 'Processing transaction',
      externalId: dto.externalId,
      tenantId: dto.tenantId,
    });
    return this.repository.findOrCreate(dto);
  }

  async findAll(query: QueryTransactionsDto): Promise<Transaction[]> {
    this.logger.log({ msg: 'Listing transactions', tenantId: query.tenantId });
    return this.repository.findAll(query);
  }

  async findById(id: string): Promise<Transaction> {
    const transaction = await this.repository.findById(id);
    if (!transaction) {
      throw new NotFoundException(`Transaction ${id} not found`);
    }
    return transaction;
  }
}
