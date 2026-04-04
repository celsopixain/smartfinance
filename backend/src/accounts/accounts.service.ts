import { Injectable, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { CreateAccountDto } from './dto/create-account.dto'
import { UpdateAccountDto } from './dto/update-account.dto'

@Injectable()
export class AccountsService {
  constructor(private readonly prisma: PrismaService) {}

  findAll(userId: string) {
    return this.prisma.account.findMany({
      where: { userId },
      orderBy: { name: 'asc' },
    })
  }

  create(userId: string, dto: CreateAccountDto) {
    return this.prisma.account.create({
      data: { userId, ...dto },
    })
  }

  async update(userId: string, id: string, dto: UpdateAccountDto) {
    await this.findOwned(userId, id)
    return this.prisma.account.update({ where: { id }, data: dto })
  }

  async remove(userId: string, id: string) {
    await this.findOwned(userId, id)
    await this.prisma.account.delete({ where: { id } })
    return { message: 'Conta removida com sucesso' }
  }

  private async findOwned(userId: string, id: string) {
    const account = await this.prisma.account.findFirst({ where: { id, userId } })
    if (!account) throw new NotFoundException('Conta não encontrada')
    return account
  }
}
