import {
  IsNumber,
  IsPositive,
  IsDateString,
  IsString,
  IsUUID,
  IsEnum,
  MaxLength,
  Min,
} from 'class-validator'
import { TransactionType } from '@prisma/client'

export class CreateTransactionDto {
  @IsNumber()
  @IsPositive()
  @Min(0.01)
  amount!: number

  @IsDateString()
  date!: string

  @IsString()
  @MaxLength(255)
  description!: string

  @IsUUID()
  categoryId!: string

  @IsUUID()
  accountId!: string

  @IsEnum(TransactionType)
  type!: TransactionType
}
