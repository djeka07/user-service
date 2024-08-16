import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import * as compression from 'compression';
import { HttpExceptionFilter } from './app/http-exception.filter';
import { MainModule } from './main.module';
import { RoleService } from './role/role.service';
import { UserService } from './user/user.service';
import { AppService } from './app/app.service';
import { RoleExtraModels, Role } from './role/role.enum';
import { LokiLoggerService } from '@djeka07/nestjs-loki-logger';
import { AuthEvent } from './auth/auth.event';

async function bootstrap() {
  const app = await NestFactory.create(MainModule, {
    bufferLogs: true,
    cors: true,
  });
  const loggerService = app.get(LokiLoggerService);
  app.useLogger(loggerService);
  app.useGlobalPipes(new ValidationPipe());
  app.useGlobalFilters(new HttpExceptionFilter(loggerService));
  app.use(compression());

  const swaggerConfig = new DocumentBuilder()
    .addBearerAuth()
    .setTitle('User service')
    .setDescription('A API for handling users')
    .setVersion('1.0')
    .build();
  const document = SwaggerModule.createDocument(app, swaggerConfig, {
    extraModels: [RoleExtraModels, AuthEvent],
  });
  SwaggerModule.setup('swagger', app, document);

  const config: ConfigService = app.get(ConfigService);
  const appService = app.get(AppService);
  const roleService = app.get(RoleService);
  const userService = app.get(UserService);
  const apiApp = await appService.createApiApp();
  await userService.createApiUser(
    roleService.roles.find((r) => r.roleId === Role.Api),
    apiApp,
  );

  const port = config.get('PORT') || 3000;
  await app.listen(port, '0.0.0.0');
  loggerService.info(`Application is listening to port ${port}`);
}
bootstrap();
