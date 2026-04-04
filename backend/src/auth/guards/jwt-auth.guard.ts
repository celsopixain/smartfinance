import {
  Injectable,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common'
import { AuthGuard } from '@nestjs/passport'
import { RedisService } from '../../redis/redis.service'
import { ExtractJwt } from 'passport-jwt'
import { Request } from 'express'

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private readonly redisService: RedisService) {
    super()
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // 1. Valida assinatura e expiração via Passport
    const isValid = await super.canActivate(context)
    if (!isValid) return false

    // 2. Verifica se o token está na blacklist do Redis
    const request = context.switchToHttp().getRequest<Request>()
    const token = ExtractJwt.fromAuthHeaderAsBearerToken()(request)
    if (!token) throw new UnauthorizedException()

    const isBlacklisted = await this.redisService.exists(`blacklist:${token}`)
    if (isBlacklisted) throw new UnauthorizedException('Token revogado')

    return true
  }
}
