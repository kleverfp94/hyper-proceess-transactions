import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { TransactionStatus, TransactionType } from '../models/transaction.model';

export class QueryTransactionsDto {
  @IsString()
  @IsNotEmpty()
  tenantId: string;

  @IsEnum(TransactionStatus)
  @IsOptional()
  status?: TransactionStatus;

  @IsEnum(TransactionType)
  @IsOptional()
  type?: TransactionType;
}
