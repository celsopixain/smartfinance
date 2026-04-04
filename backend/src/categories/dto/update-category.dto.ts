import { IsString, IsOptional, MaxLength, IsUUID, Matches } from 'class-validator'

export class UpdateCategoryDto {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  name?: string

  @IsOptional()
  @IsString()
  @MaxLength(10)
  icon?: string

  @IsOptional()
  @IsString()
  @Matches(/^#[0-9A-Fa-f]{6}$/, { message: 'color deve ser uma cor hexadecimal válida (#RRGGBB)' })
  color?: string

  @IsOptional()
  @IsUUID()
  parentId?: string
}
