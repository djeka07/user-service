/* eslint-disable quotes */
import { LokiLoggerService } from '@djeka07/nestjs-loki-logger';
import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { UpdatePasswordRequest } from '../auth/auth.model';
import { RoleEntity } from '../role/role.entity';
import { Role as RoleEnum } from '../role/role.enum';
import { UpdateSelfPasswordRequest } from '../self/self.request';

import { AppEntity } from '../app/app.entity';
import { isEmpty, unique } from '../app/helpers/arrays';
import { UserEntity } from './user.entity';
import { FindAllByRoleModel, FindAllModel } from './user.models';
import {
  UpdateUserAccessRequest,
  UpdateUserRoleRequest,
  UpdateUsersAccessRequest,
  UserRequest,
} from './user.request';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
    private readonly loggerService: LokiLoggerService,
    private readonly configService: ConfigService,
  ) {}

  async create(user: UserRequest): Promise<UserEntity> {
    const usr = new UserEntity();
    usr.username = user.email;
    usr.firstName = user.firstName;
    usr.lastName = user.lastName;
    usr.email = user.email;
    usr.hasGrantedAccess = false;

    usr.roleIds = user.roles.map((role) => role.roleId);

    return this.userRepository.save(usr);
  }

  async updatePassword(
    email: string,
    request: UpdateSelfPasswordRequest,
  ): Promise<UserEntity> {
    const user = await this.validatePassword(email, request.currentPassword);
    if (!user) {
      throw new BadRequestException();
    }
    user.password = request.password;
    user.hashPassword();

    return this.userRepository.save(user);
  }

  async updatePasswordFromResetToken(
    email: string,
    request: UpdatePasswordRequest,
  ): Promise<UserEntity> {
    const user = await this.findByEmail(email);
    user.password = request.password;
    user.passwordResetToken = '';
    user.hashPassword();
    return this.userRepository.save(user);
  }

  async updateUser(id: string, request: UserRequest): Promise<UserEntity> {
    const user = await this.findById(id);
    user.firstName = request.firstName;
    user.lastName = request.lastName;
    user.email = request.email;
    user.roleIds = request.roles.map((r) => r.roleId);
    return this.userRepository.save(user);
  }

  async updateRoles(
    id: string,
    request: UpdateUserRoleRequest,
  ): Promise<UserEntity> {
    const user = await this.findById(id);
    let userRoles = user.roleIds;

    if (!isEmpty(request.rolesToRemove)) {
      userRoles = userRoles.filter(
        (userRoleId) => !request.rolesToRemove.includes(userRoleId),
      );
    }

    if (!isEmpty(request.rolesToAdd)) {
      userRoles = unique([...userRoles, ...request.rolesToAdd], 'roleId');
    }

    user.roleIds = userRoles;
    return this.userRepository.save(user);
  }

  async updateUserAccess(
    id: string,
    request: UpdateUserAccessRequest,
    apps: AppEntity[],
  ): Promise<UserEntity> {
    const user = await this.internalUpdateUserAccess(id, request, apps);
    return this.userRepository.save(user);
  }

  async updateUsersAccess(
    request: UpdateUsersAccessRequest,
    apps: AppEntity[],
  ): Promise<UserEntity[]> {
    const appIds = apps.map((app) => app.appId);
    const users = await this.userRepository.find({
      where: { userId: In(request.userIds) },
    });

    users.forEach((user) => {
      if (request.grantAccess) {
        user.apps = [
          ...(user.apps?.filter((a) => !appIds.includes(a.appId)) || []),
          ...apps,
        ];
      } else {
        user.apps = [
          ...(user.apps?.filter((a) => !appIds.includes(a.appId)) || []),
        ];
      }

      user.hasGrantedAccess = !isEmpty(user.apps);

      if (request.grantAccess) {
        user.grantedAccessOn = new Date();
      }
    });

    return this.userRepository.save(users);
  }

  async findAllByRole({ take, page, roleId }: FindAllByRoleModel) {
    const skip = (page - 1) * take;
    const [users, total] = await this.userRepository
      .createQueryBuilder('user')
      .where('user.role_ids IN (:roles)', {
        roles: [roleId],
      })
      .leftJoinAndSelect('user.apps', 'apps')
      .leftJoinAndSelect('user.auths', 'auths')
      .leftJoinAndSelect('auths.application', 'application')
      .skip(skip)
      .take(take)
      .getManyAndCount();

    return { users, total, hasNextPage: page * take < total };
  }

  async findAll({ take, page, includeApiRole, filter }: FindAllModel) {
    const skip = (page - 1) * take;
    const query = this.userRepository.createQueryBuilder('user');

    if (!includeApiRole) {
      query.andWhere('user.role_ids NOT IN (:...roles)', {
        roles: [RoleEnum.Api],
      });
    }

    if (filter.hasGrantedAccess !== undefined) {
      query.andWhere('user.has_granted_access = :access', {
        access: `${filter.hasGrantedAccess}`,
      });
    }

    if (!isEmpty(filter.roleIds)) {
      query.andWhere('user.role_ids && :roles', {
        roles: [...filter.roleIds],
      });
    }

    const [users, total] = await query
      .leftJoinAndSelect('user.apps', 'apps')
      .leftJoinAndSelect('user.auths', 'auths')
      .leftJoinAndSelect('auths.application', 'application')
      .skip(skip)
      .take(take)
      .getManyAndCount();
    return { users, total, hasNextPage: page * take < total };
  }

  async searchUsers(query: string, page: number, take: number) {
    const skip = (page - 1) * take;
    const [users, total] = await this.userRepository
      .createQueryBuilder('user')
      .where("CONCAT(user.first_name, ' ', user.last_name) ILIKE :fullName", {
        fullName: `%${query}%`,
      })
      .skip(skip)
      .take(take)
      .cache(true)
      .getManyAndCount();

    return { users, total, hasNextPage: page * take < total };
  }

  async findById(id: string): Promise<UserEntity> {
    return this.userRepository
      .createQueryBuilder('user')
      .where('user.user_id = :id', { id })
      .leftJoinAndSelect('user.apps', 'apps')
      .leftJoinAndSelect('user.auths', 'auths')
      .leftJoinAndSelect('auths.application', 'application')
      .getOneOrFail();
  }

  async findByUsername(username: string): Promise<UserEntity> {
    return this.userRepository
      .createQueryBuilder('user')
      .where('user.username = :username', { username })
      .leftJoinAndSelect('user.apps', 'apps')
      .leftJoinAndSelect('user.auths', 'auths')
      .leftJoinAndSelect('auths.application', 'application')
      .getOneOrFail();
  }

  async findByEmail(email: string): Promise<UserEntity> {
    return this.userRepository
      .createQueryBuilder('user')
      .where('user.email = :email', { email })
      .leftJoinAndSelect('user.apps', 'apps')
      .leftJoinAndSelect('user.auths', 'auths')
      .leftJoinAndSelect('auths.application', 'application')
      .getOneOrFail();
  }

  async validatePassword(email: string, password: string): Promise<UserEntity> {
    const user = await this.findByEmail(email);
    if (user?.checkIfUnencryptedPasswordIsValid(password)) {
      return user;
    }
    return null;
  }

  async deleteUser(id: string): Promise<UserEntity> {
    const user = await this.findById(id);
    const userId = user?.userId;
    const result = await this.userRepository.remove(user);
    return Object.assign({}, result, { userId });
  }

  async createApiUser(apiRole: RoleEntity, apiApp: AppEntity): Promise<void> {
    const apiUsername = this.configService.get<string>('API_USER_USERNAME');
    const apiPassword = this.configService.get<string>('API_USER_PASSWORD');
    const hasUser = await this.findByUsername(apiUsername);

    if (hasUser) {
      this.loggerService.info('Api user already created');
      return;
    }

    const user = new UserEntity();

    user.email = apiUsername;
    user.username = apiUsername;
    user.firstName = 'Api';
    user.lastName = 'User';
    user.password = apiPassword;
    user.roleIds = [apiRole.roleId];
    user.hasGrantedAccess = true;
    user.apps = [apiApp];
    user.grantedAccessOn = new Date();
    user.hashPassword();

    await this.userRepository.save(user);
  }

  private async internalUpdateUserAccess(
    id: string,
    accessRequest: UpdateUserAccessRequest,
    apps: AppEntity[],
  ): Promise<UserEntity> {
    const appIds = apps.map((app) => app.appId);
    const user = await this.findById(id);

    if (accessRequest.grantAccess) {
      user.apps = [
        ...user.apps.filter((a) => !appIds.includes(a.appId)),
        ...apps,
      ];
    } else {
      user.apps = [...user.apps.filter((a) => !appIds.includes(a.appId))];
    }

    user.hasGrantedAccess = !isEmpty(user.apps);

    if (accessRequest.grantAccess) {
      user.grantedAccessOn = new Date();
    }

    return user;
  }
}
