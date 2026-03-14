import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { CreateTransactionDto } from '../dto/create-transaction.dto';
import {
  PROCESS_TRANSACTION_JOB,
  TRANSACTIONS_QUEUE,
} from './transactions.queue';
import { TransactionsService } from '../transactions.service';

@Processor(TRANSACTIONS_QUEUE)
export class TransactionsProcessor extends WorkerHost {
  private readonly logger = new Logger(TransactionsProcessor.name);

  constructor(private readonly service: TransactionsService) {
    super();
  }

  async process(job: Job<CreateTransactionDto>): Promise<void> {
    if (job.name !== PROCESS_TRANSACTION_JOB) return;

    const dto = job.data;
    this.logger.log({
      msg: 'Processing job',
      jobId: job.id,
      externalId: dto.externalId,
      tenantId: dto.tenantId,
    });

    try {
      const { transaction, created } = await this.service.create(dto);
      this.logger.log({
        msg: created ? 'Transaction persisted' : 'Duplicate — skipped',
        jobId: job.id,
        transactionId: transaction.id,
      });
    } catch (err) {
      this.logger.error({
        msg: 'Failed to process transaction',
        jobId: job.id,
        error: (err as Error).message,
      });
      // Re-throw para o BullMQ registrar a falha e aplicar retry/backoff
      throw err;
    }
  }
}
