import 'reflect-metadata'
import { NestFactory } from '@nestjs/core'
import { AppModule } from './app.module'
import helmet from 'helmet'
import * as dotenv from 'dotenv'

dotenv.config()

async function bootstrap() {
  const app = await NestFactory.create(AppModule)

  // Security headers: X-Frame-Options, X-Content-Type-Options,
  // Strict-Transport-Security, X-XSS-Protection, etc.
  app.use(helmet())

  app.enableCors({
    origin: process.env.CORS_ORIGINS?.split(',') ?? ['http://localhost:4200'],
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    credentials: true,
  })

  const port = process.env.PORT ?? 3000
  await app.listen(port)
}

bootstrap()
