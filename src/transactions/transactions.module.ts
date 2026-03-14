import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { TransactionsProcessor } from './jobs/transactions.processor';
import { TRANSACTIONS_QUEUE } from './jobs/transactions.queue';
import { KafkaProducerService } from './kafka/kafka-producer.service';
import { Transaction } from './models/transaction.model';
import { TransactionsController } from './transactions.controller';
import { TransactionsRepository } from './transactions.repository';
import { TransactionsService } from './transactions.service';

@Module({
  imports: [
    SequelizeModule.forFeature([Transaction]),
    BullModule.registerQueue({ name: TRANSACTIONS_QUEUE }),
  ],
  controllers: [TransactionsController],
  providers: [
    TransactionsService,
    TransactionsRepository,
    TransactionsProcessor,
    KafkaProducerService,
  ],
})
export class TransactionsModule {}
