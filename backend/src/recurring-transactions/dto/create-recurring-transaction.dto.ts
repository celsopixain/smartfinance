import { IsUUID, IsEnum, IsPositive, IsString, IsInt, Min, Max, MaxLength } from 'class-validator'
import { Type } from 'class-transformer'

export class CreateRecurringTransactionDto {
  @IsUUID()
  accountId: string

  @IsUUID()
  categoryId: string

  @IsEnum(['INCOME', 'EXPENSE'])
  type: 'INCOME' | 'EXPENSE'

  @IsPositive()
  @Type(() => Number)
  amount: number

  @IsString()
  @MaxLength(255)
  description: string

  @IsInt()
  @Min(1)
  @Max(28)
  @Type(() => Number)
  dayOfMonth: number
}
