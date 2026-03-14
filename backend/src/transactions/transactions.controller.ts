import { InjectQueue } from '@nestjs/bullmq';
import {
  Body,
  Controller,
  Get,
  HttpStatus,
  Logger,
  Param,
  Post,
  Query,
} from '@nestjs/common';
import { Queue } from 'bullmq';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { QueryTransactionsDto } from './dto/query-transactions.dto';
import {
  PROCESS_TRANSACTION_JOB,
  TRANSACTIONS_QUEUE,
} from './jobs/transactions.queue';
import { TransactionsService } from './transactions.service';

@Controller('transactions')
export class TransactionsController {
  private readonly logger = new Logger(TransactionsController.name);

  constructor(
    private readonly service: TransactionsService,
    @InjectQueue(TRANSACTIONS_QUEUE) private readonly queue: Queue,
  ) {}

  @Post()
  async create(@Body() dto: CreateTransactionDto) {
    const job = await this.queue.add(PROCESS_TRANSACTION_JOB, dto, {
      jobId: `${dto.tenantId}:${dto.externalId}`, // jobId único = idempotência na fila também
      attempts: 3,
      backoff: { type: 'exponential', delay: 1000 },
    });

    this.logger.log({
      msg: 'Transaction enqueued',
      jobId: job.id,
      externalId: dto.externalId,
    });

    return {
      statusCode: HttpStatus.CREATED,
      jobId: job.id,
      externalId: dto.externalId,
    };
  }

  @Get()
  async findAll(@Query() query: QueryTransactionsDto) {
    const transactions = await this.service.findAll(query);
    return { statusCode: HttpStatus.OK, data: transactions };
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const transaction = await this.service.findById(id);
    return { statusCode: HttpStatus.OK, data: transaction };
  }
}
