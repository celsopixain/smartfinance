import { Module } from '@nestjs/common'
import { AuthModule } from '../auth/auth.module'
import { CategoriesService } from './categories.service'
import { CategoriesController } from './categories.controller'

@Module({
  imports: [AuthModule],
  providers: [CategoriesService],
  controllers: [CategoriesController],
})
export class CategoriesModule {}
