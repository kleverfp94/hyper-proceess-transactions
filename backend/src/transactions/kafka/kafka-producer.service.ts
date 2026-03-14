import {
  Inject,
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { Kafka, Producer } from 'kafkajs';
import { kafkaConfig } from '../../config';

type KafkaConfig = { brokers: string[]; clientId: string };

@Injectable()
export class KafkaProducerService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(KafkaProducerService.name);
  private readonly producer: Producer;

  constructor(@Inject(kafkaConfig.KEY) cfg: KafkaConfig) {
    const kafka = new Kafka({ clientId: cfg.clientId, brokers: cfg.brokers });
    this.producer = kafka.producer();
  }

  async onModuleInit() {
    await this.producer.connect();
    this.logger.log({ msg: 'Kafka producer connected' });
  }

  async onModuleDestroy() {
    await this.producer.disconnect();
  }

  async emit(topic: string, payload: object): Promise<void> {
    await this.producer.send({
      topic,
      messages: [{ value: JSON.stringify(payload) }],
    });

    this.logger.log({ msg: 'Kafka event emitted', topic });
  }
}
