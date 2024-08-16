import { ApiProperty } from '@nestjs/swagger';
import { AppResponse } from '../app/app.response';
import { RoleService } from '../role/role.service';
import { RoleResponse } from '../role/role.response';
import { UserEntity } from './user.entity';
import { AuthResponse } from '../auth/auth.response';

export class UserResponse {
  @ApiProperty()
  id: string;
  @ApiProperty()
  username: string;
  @ApiProperty()
  firstName: string;
  @ApiProperty()
  lastName: string;
  @ApiProperty()
  email: string;
  @ApiProperty()
  created: string;
  @ApiProperty()
  hasGrantedAccess: boolean;
  @ApiProperty()
  grantedAccessOn: string;
  @ApiProperty({ isArray: true, type: RoleResponse })
  roles: RoleResponse[];
  @ApiProperty({ isArray: true, type: AppResponse })
  apps: AppResponse[];
  @ApiProperty({ isArray: true, type: AuthResponse })
  auths: AuthResponse[];

  constructor(user: UserEntity, roleService: RoleService) {
    this.id = user.userId;
    this.username = user.username;
    this.firstName = user.firstName;
    this.email = user.email;
    this.lastName = user.lastName;
    this.hasGrantedAccess = user.hasGrantedAccess;
    this.grantedAccessOn = user.grantedAccessOn?.toISOString();
    this.created = user.created?.toISOString();
    this.auths = user?.auths?.map((auth) => new AuthResponse(auth));
    this.roles = user.roleIds
      ?.map((roleId) => {
        const role = roleService.tryFindById(roleId);
        if (!role) {
          return undefined;
        }
        return new RoleResponse(role);
      })
      .filter(Boolean);
    this.apps = user?.apps?.map((app) => new AppResponse(app));
  }
}

export class UsersResponse {
  @ApiProperty({ type: [UserResponse] })
  users: UserResponse[];
  @ApiProperty()
  total: number;
  @ApiProperty()
  hasNextPage: boolean;
  @ApiProperty()
  page: number;
  @ApiProperty()
  take: number;
}
