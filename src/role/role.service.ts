import { Injectable } from '@nestjs/common';

import { RoleEntity } from './role.entity';
import { Role as RoleEnum } from './role.enum';
import { InjectRepository } from '@nestjs/typeorm';
import { UserEntity } from '../user/user.entity';
import { Repository } from 'typeorm';

@Injectable()
export class RoleService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
  ) {}
  public get roles(): RoleEntity[] {
    const roles: RoleEntity[] = [];
    for (const role in RoleEnum) {
      roles.push({ name: role, roleId: RoleEnum[role] });
    }
    return roles;
  }

  findById(id: string): RoleEntity {
    return this.roles.find((r) => r.roleId === id);
  }

  tryFindById(id: string): RoleEntity {
    try {
      return this.roles.find((r) => r.roleId === id);
    } catch (error) {
      return undefined;
    }
  }

  findByIds(ids: string[]): RoleEntity[] {
    return this.roles.filter((r) => ids.includes(r.roleId));
  }

  async findUsersById({
    take,
    page,
    roleId,
  }: {
    take: number;
    page: number;
    roleId: string;
  }) {
    const skip = (page - 1) * take;
    const [users, total] = await this.userRepository
      .createQueryBuilder('user')
      .where('user.role_ids IN (:...roles)', {
        roles: [roleId],
      })
      .leftJoinAndSelect('user.apps', 'apps')
      .skip(skip)
      .take(take)
      .getManyAndCount();

    return { users, total, hasNextPage: page * take < total };
  }
}
