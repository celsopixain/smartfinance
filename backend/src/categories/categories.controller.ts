import {
  Controller, Get, Post, Patch, Delete,
  Body, Param, Request, UseGuards,
  HttpCode, HttpStatus,
} from '@nestjs/common'
import { Request as ExpressRequest } from 'express'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'
import { CategoriesService } from './categories.service'
import { CreateCategoryDto } from './dto/create-category.dto'
import { UpdateCategoryDto } from './dto/update-category.dto'

interface AuthRequest extends ExpressRequest {
  user: { userId: string; email: string }
}

@Controller('categories')
@UseGuards(JwtAuthGuard)
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Get()
  findAll(@Request() req: AuthRequest) {
    return this.categoriesService.findAll(req.user.userId)
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Request() req: AuthRequest, @Body() dto: CreateCategoryDto) {
    return this.categoriesService.create(req.user.userId, dto)
  }

  @Patch(':id')
  update(
    @Request() req: AuthRequest,
    @Param('id') id: string,
    @Body() dto: UpdateCategoryDto,
  ) {
    return this.categoriesService.update(req.user.userId, id, dto)
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  remove(@Request() req: AuthRequest, @Param('id') id: string) {
    return this.categoriesService.remove(req.user.userId, id)
  }
}
