import {
  LogLevel,
  LokiLoggerModule,
  LokiRequestLoggerInterceptorProvider,
} from '@djeka07/nestjs-loki-logger';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AzureServiceBusModule } from '@djeka07/nestjs-azure-service-bus';
import { AppEntity } from './app/app.entity';
import { AppModule } from './app/app.module';
import { AuthEntity } from './auth/auth.entity';
import { AuthModule } from './auth/auth.module';
import { RoleEntity } from './role/role.entity';
import { RoleModule } from './role/role.module';
import { SelfModule } from './self/self.module';
import { UserEntity } from './user/user.entity';
import { UserModule } from './user/user.module';

type Environment = 'development' | 'production';
@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        ssl: false,
        host: configService.get('DB_HOST'),
        port: +configService.get<number>('DB_PORT'),
        username: configService.get('DB_USERNAME'),
        password: configService.get('DB_PASSWORD'),
        database: configService.get('DB_NAME'),
        logging: false,
        entities: [AuthEntity, AppEntity, UserEntity, RoleEntity],
        synchronize: true,
      }),
      inject: [ConfigService],
    }),
    LokiLoggerModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        app: 'user-service',
        host: configService.get('LOGGING_HOST'),
        userId: configService.get('LOGGING_USER_ID'),
        password: configService.get('LOGGING_PASSWORD'),
        environment: process.env.NODE_ENV as Environment,
        logLevel: LogLevel.info,
      }),
      inject: [ConfigService],
    }),
    AzureServiceBusModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => {
        return {
          connectionString: configService.get(
            'AZURE_SERVICE_BUS_CONNECTION_STRING',
          ),
        };
      },
      inject: [ConfigService],
    }),
    SelfModule,
    UserModule,
    RoleModule,
    AuthModule,
    AppModule,
  ],
  controllers: [],
  providers: [LokiRequestLoggerInterceptorProvider],
})
export class MainModule {}
