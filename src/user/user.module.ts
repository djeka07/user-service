import { UserService } from './user.service';
import { UserController } from './user.controller';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserEntity } from './user.entity';
import { RoleModule } from '../role/role.module';
import { AppModule } from '../app/app.module';
import { AzureServiceBusModule } from '@djeka07/nestjs-azure-service-bus';
import { AuthModule } from 'src/auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([UserEntity]),
    RoleModule,
    AppModule,
    AuthModule,
    AzureServiceBusModule.forFeature([
      { name: 'user_updated' },
      { name: 'user_created' },
      { name: 'user_deleted' },
    ]),
  ],
  controllers: [UserController],
  providers: [UserService],
  exports: [TypeOrmModule, UserService],
})
export class UserModule {}
