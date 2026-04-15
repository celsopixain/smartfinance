import { IsUUID, IsInt, Min, Max } from 'class-validator'
import { IsPositive } from 'class-validator'
import { Type } from 'class-transformer'

export class CreateBudgetDto {
  @IsUUID()
  categoryId!: string

  @IsPositive()
  @Type(() => Number)
  amount!: number

  @IsInt()
  @Min(1)
  @Max(12)
  @Type(() => Number)
  month!: number

  @IsInt()
  @Min(2020)
  @Type(() => Number)
  year!: number
}
