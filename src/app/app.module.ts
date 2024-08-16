import { AppController } from './app.controller';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AppEntity } from './app.entity';
import { AppService } from './app.service';
import { UserEntity } from '../user/user.entity';
import { RoleModule } from '../role/role.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([AppEntity]),
    TypeOrmModule.forFeature([UserEntity]),
    RoleModule,
  ],
  controllers: [AppController],
  providers: [AppService],
  exports: [TypeOrmModule, AppService],
})
export class AppModule {}
