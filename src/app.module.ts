import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { SequelizeModule } from '@nestjs/sequelize';
import { kafkaConfig, mysqlConfig, redisConfig } from './config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TransactionsModule } from './transactions/transactions.module';

@Module({
  imports: [
    // Carrega todos os configs globalmente — disponíveis em qualquer módulo via injeção
    ConfigModule.forRoot({
      isGlobal: true,
      load: [mysqlConfig, redisConfig, kafkaConfig],
    }),

    SequelizeModule.forRootAsync({
      inject: [mysqlConfig.KEY],
      useFactory: (cfg: ReturnType<typeof mysqlConfig>) => ({
        dialect: 'mysql',
        host: cfg.host,
        port: cfg.port,
        username: cfg.username,
        password: cfg.password,
        database: cfg.database,
        autoLoadModels: true,
        synchronize: true,
        logging: false,
      }),
    }),

    // BullModule global — TransactionsModule só precisa registrar a fila
    BullModule.forRootAsync({
      inject: [redisConfig.KEY],
      useFactory: (cfg: ReturnType<typeof redisConfig>) => ({
        connection: { host: cfg.host, port: cfg.port },
      }),
    }),

    TransactionsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
