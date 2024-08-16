import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';

import { AppEntity } from './app.entity';
import { ConfigService } from '@nestjs/config';
import { LokiLoggerService } from '@djeka07/nestjs-loki-logger';
import { UserEntity } from '../user/user.entity';

@Injectable()
export class AppService {
  constructor(
    @InjectRepository(AppEntity)
    private readonly appRepository: Repository<AppEntity>,
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
    private readonly configService: ConfigService,
    private readonly loggerService: LokiLoggerService,
  ) {}

  async findAll({ take, page }: { take: number; page: number }) {
    const skip = (page - 1) * take;
    const query = this.appRepository.createQueryBuilder('apps');

    const [applications, total] = await query
      .skip(skip)
      .take(take)
      .getManyAndCount();
    return { applications, total, hasNextPage: page * take < total };
  }

  async findAllUsersByAppId({
    take,
    page,
    appId,
  }: {
    take: number;
    page: number;
    appId: string;
  }) {
    const skip = (page - 1) * take;
    const [users, total] = await this.userRepository
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.apps', 'apps')
      .where('apps.application_id = :appId', { appId })
      .skip(skip)
      .take(take)
      .getManyAndCount();
    return { users, total, hasNextPage: page * take < total };
  }

  async findAllUsersByNotInAppId({
    take,
    page,
    appId,
  }: {
    take: number;
    page: number;
    appId: string;
  }) {
    const skip = (page - 1) * take;
    const [users, total] = await this.userRepository
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.apps', 'apps')
      .where('apps.application_id != :appId', { appId })
      .skip(skip)
      .take(take)
      .getManyAndCount();
    return { users, total, hasNextPage: page * take < total };
  }

  async findById(appId: string): Promise<AppEntity | null> {
    return this.appRepository.findOne({ where: { appId } });
  }

  async findByIds(appIds: string[]): Promise<AppEntity[] | null> {
    return this.appRepository.find({ where: { appId: In(appIds) } });
  }

  async createApiApp(): Promise<AppEntity> {
    const apiAppUuid = this.configService.get<string>('API_APP_UUID');
    const app = await this.findById(apiAppUuid);

    if (app) {
      this.loggerService.log('Api app already exists');
      return app;
    }

    const newApp = new AppEntity();
    newApp.appId = apiAppUuid;
    newApp.appName = 'ApiApp';
    return await this.appRepository.save(newApp);
  }
}
