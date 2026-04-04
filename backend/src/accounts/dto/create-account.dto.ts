import { IsString, IsEnum, IsNumber, IsOptional, MaxLength, Min } from 'class-validator'
import { AccountType } from '@prisma/client'

export class CreateAccountDto {
  @IsString()
  @MaxLength(100)
  name!: string

  @IsEnum(AccountType)
  type!: AccountType

  @IsOptional()
  @IsNumber()
  @Min(0)
  balance?: number
}
