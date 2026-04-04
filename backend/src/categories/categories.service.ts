import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { CreateCategoryDto } from './dto/create-category.dto'
import { UpdateCategoryDto } from './dto/update-category.dto'

@Injectable()
export class CategoriesService {
  constructor(private readonly prisma: PrismaService) {}

  findAll(userId: string) {
    return this.prisma.category.findMany({
      where: { userId },
      orderBy: { name: 'asc' },
    })
  }

  async create(userId: string, dto: CreateCategoryDto) {
    if (dto.parentId) {
      await this.findOwned(userId, dto.parentId)
    }
    return this.prisma.category.create({ data: { userId, ...dto } })
  }

  async update(userId: string, id: string, dto: UpdateCategoryDto) {
    await this.findOwned(userId, id)
    if (dto.parentId) {
      if (dto.parentId === id) {
        throw new BadRequestException('Uma categoria não pode ser subcategoria de si mesma')
      }
      await this.findOwned(userId, dto.parentId)
    }
    return this.prisma.category.update({ where: { id }, data: dto })
  }

  async remove(userId: string, id: string) {
    await this.findOwned(userId, id)

    const childCount = await this.prisma.category.count({ where: { parentId: id, userId } })
    if (childCount > 0) {
      throw new BadRequestException('Remova as subcategorias antes de excluir esta categoria')
    }

    const txCount = await this.prisma.transaction.count({ where: { categoryId: id, userId } })
    if (txCount > 0) {
      throw new BadRequestException('Esta categoria possui transações vinculadas e não pode ser excluída')
    }

    await this.prisma.category.delete({ where: { id } })
    return { message: 'Categoria removida com sucesso' }
  }

  private async findOwned(userId: string, id: string) {
    const category = await this.prisma.category.findFirst({ where: { id, userId } })
    if (!category) throw new NotFoundException('Categoria não encontrada')
    return category
  }
}
