import { IsString, IsEnum, IsNumber, IsOptional, MaxLength } from 'class-validator'
import { AccountType } from '@prisma/client'

export class UpdateAccountDto {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  name?: string

  @IsOptional()
  @IsEnum(AccountType)
  type?: AccountType

  @IsOptional()
  @IsNumber()
  balance?: number
}
