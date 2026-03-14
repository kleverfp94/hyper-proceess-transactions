import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { CreateTransactionDto } from '../dto/create-transaction.dto';
import { KafkaProducerService } from '../kafka/kafka-producer.service';
import { KafkaTopics } from '../kafka/kafka.topics';
import { TransactionsService } from '../transactions.service';
import {
  PROCESS_TRANSACTION_JOB,
  TRANSACTIONS_QUEUE,
} from './transactions.queue';

@Processor(TRANSACTIONS_QUEUE)
export class TransactionsProcessor extends WorkerHost {
  private readonly logger = new Logger(TransactionsProcessor.name);

  constructor(
    private readonly service: TransactionsService,
    private readonly kafka: KafkaProducerService,
  ) {
    super();
  }

  async process(job: Job<CreateTransactionDto>): Promise<void> {
    if (job.name !== PROCESS_TRANSACTION_JOB) return;

    const dto = job.data;
    this.logger.log({
      msg: 'Processing job',
      jobId: job.id,
      externalId: dto.externalId,
    });

    try {
      const { transaction, created } = await this.service.create(dto);

      this.logger.log({
        msg: created ? 'Transaction persisted' : 'Duplicate — skipped',
        jobId: job.id,
        transactionId: transaction.id,
      });

      // Notifica outros serviços que a transação foi processada com sucesso
      await this.kafka.emit(KafkaTopics.TRANSACTION_PROCESSED, {
        transactionId: transaction.id,
        externalId: transaction.externalId,
        tenantId: transaction.tenantId,
        amount: transaction.amount,
        type: transaction.type,
        status: transaction.status,
        duplicate: !created,
        processedAt: new Date().toISOString(),
      });
    } catch (err) {
      const error = err as Error;
      this.logger.error({
        msg: 'Failed to process transaction',
        jobId: job.id,
        error: error.message,
      });

      // Notifica outros serviços sobre a falha antes de re-lançar para o BullMQ
      await this.kafka.emit(KafkaTopics.TRANSACTION_FAILED, {
        externalId: dto.externalId,
        tenantId: dto.tenantId,
        error: error.message,
        jobId: job.id,
        failedAt: new Date().toISOString(),
      });

      // Re-throw para o BullMQ aplicar retry/backoff
      throw err;
    }
  }
}
