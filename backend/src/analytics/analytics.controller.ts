import { Controller, Get, Query, Request, UseGuards } from '@nestjs/common'
import { Request as ExpressRequest } from 'express'
import { IsInt, Min, Max } from 'class-validator'
import { Type } from 'class-transformer'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'
import { AnalyticsService } from './analytics.service'

class MonthlyQueryDto {
  @IsInt() @Min(2020) @Type(() => Number) year: number
}

class CategoryQueryDto {
  @IsInt() @Min(1) @Max(12) @Type(() => Number) month: number
  @IsInt() @Min(2020)       @Type(() => Number) year: number
}

interface AuthRequest extends ExpressRequest {
  user: { userId: string; email: string }
}

@Controller('analytics')
@UseGuards(JwtAuthGuard)
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('monthly')
  getMonthly(@Request() req: AuthRequest, @Query() query: MonthlyQueryDto) {
    return this.analyticsService.getMonthlyReport(req.user.userId, query.year)
  }

  @Get('categories')
  getCategories(@Request() req: AuthRequest, @Query() query: CategoryQueryDto) {
    return this.analyticsService.getCategoryBreakdown(req.user.userId, query.month, query.year)
  }
}
