import {
  Injectable,
  ConflictException,
  UnauthorizedException,
} from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import * as bcrypt from 'bcrypt'
import { PrismaService } from '../prisma/prisma.service'
import { RedisService } from '../redis/redis.service'
import { RegisterDto } from './dto/register.dto'
import { LoginDto } from './dto/login.dto'

const BCRYPT_SALT_ROUNDS = 12
const REFRESH_TTL_SECONDS = 7 * 24 * 60 * 60  // 7 dias

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
    private readonly jwt: JwtService,
  ) {}

  async register(dto: RegisterDto) {
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email },
    })
    if (existing) throw new ConflictException('Email já cadastrado')

    const passwordHash = await bcrypt.hash(dto.password, BCRYPT_SALT_ROUNDS)

    const user = await this.prisma.user.create({
      data: { name: dto.name, email: dto.email, passwordHash },
      select: { id: true, name: true, email: true, createdAt: true },
    })

    return user
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    })

    // Mensagem genérica — não revela se o email existe
    const INVALID_MSG = 'Credenciais inválidas'

    if (!user) throw new UnauthorizedException(INVALID_MSG)

    const passwordMatch = await bcrypt.compare(dto.password, user.passwordHash)
    if (!passwordMatch) throw new UnauthorizedException(INVALID_MSG)

    return this.issueTokens(user.id, user.email)
  }

  async refresh(refreshToken: string) {
    const stored = await this.redis.get(`refresh:${refreshToken}`)
    if (!stored) throw new UnauthorizedException('Refresh token inválido ou expirado')

    const { userId, email } = JSON.parse(stored)

    // Rotaciona o refresh token — invalida o antigo
    await this.redis.del(`refresh:${refreshToken}`)

    return this.issueTokens(userId, email)
  }

  async logout(accessToken: string) {
    // Decodifica sem verificar — só para pegar o exp
    const decoded = this.jwt.decode(accessToken) as { exp: number } | null
    if (!decoded) return

    const ttl = decoded.exp - Math.floor(Date.now() / 1000)
    if (ttl > 0) {
      await this.redis.set(`blacklist:${accessToken}`, '1', ttl)
    }
  }

  private async issueTokens(userId: string, email: string) {
    const payload = { sub: userId, email }

    const accessToken = this.jwt.sign(payload)

    const refreshToken = this.jwt.sign(payload, {
      secret: process.env.JWT_SECRET,
      expiresIn: (process.env.JWT_REFRESH_EXPIRES_IN ?? '7d') as any,
    })

    await this.redis.set(
      `refresh:${refreshToken}`,
      JSON.stringify({ userId, email }),
      REFRESH_TTL_SECONDS,
    )

    return { accessToken, refreshToken }
  }
}
