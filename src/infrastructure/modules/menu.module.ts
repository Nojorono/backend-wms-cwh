import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Menu } from '../../core/domain/entities/menu.entity';
import { MenuController } from 'src/presentation/controllers/menu.controller';
import { MenuService } from '../services/menu.service';
import { MenuRepository } from '../repositories/menu.repository';
import { MENU_REPOSITORY } from 'src/core/domain/interfaces/menu.repository.interface';

@Module({
  imports: [TypeOrmModule.forFeature([Menu])],
  controllers: [MenuController],
  providers: [
    MenuService,
    {
      provide: MENU_REPOSITORY,
      useClass: MenuRepository,
    },
  ],
  exports: [MenuService],
})
export class MenuModule {}
