import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { ArrayNotEmpty, IsArray, IsBoolean, IsNotEmpty } from 'class-validator';
import { isEmpty } from '../app/helpers/arrays';
import { Role } from '../role/role.enum';
import { LokiLoggerService } from '@djeka07/nestjs-loki-logger';

class UserRoleRequest {
  @ApiProperty()
  @IsNotEmpty()
  public roleId: string;
}

export class UserRequest {
  public id: number;
  @ApiProperty()
  public firstName: string;
  @ApiProperty()
  public lastName: string;
  @ApiProperty()
  @IsNotEmpty()
  public email: string;
  @IsArray()
  @ArrayNotEmpty()
  @Type(() => UserRoleRequest)
  @ApiProperty({ type: UserRoleRequest, isArray: true, required: true })
  public roles: UserRoleRequest[];
}

export class UpdateUsersAccessRequest {
  @ApiProperty()
  @IsBoolean()
  public grantAccess: boolean;
  @ApiProperty({ isArray: true, type: String })
  @IsArray({ always: true })
  public userIds: string[];
  @ApiProperty({ isArray: true, type: String })
  @IsArray({ always: true })
  public applicationIds: string[];
}

export class UpdateUserAccessRequest {
  @ApiProperty()
  @IsBoolean()
  public grantAccess: boolean;
  @ApiProperty({ isArray: true, type: String })
  @IsArray({ always: true })
  public applicationIds: string[];
}

export class UpdateUserRoleRequest {
  @ApiProperty({ isArray: true, type: String, example: ['1', '2'] })
  @IsArray({ always: false })
  public rolesToAdd: string[];
  @ApiProperty({ isArray: true, type: String, example: ['3', '4'] })
  @IsArray({ always: false })
  public rolesToRemove: string[];
}

export class ResetUserPasswordRequest {
  @ApiProperty()
  @IsNotEmpty()
  applicationId: string;
}

export class UserFilter {
  hasGrantedAccess?: boolean;
  roleIds: [Role];
  constructor(filter: string, loggerService: LokiLoggerService) {
    try {
      const parsedFilter = JSON.parse(filter) as UserFilter;
      if (parsedFilter?.hasGrantedAccess !== undefined) {
        this.hasGrantedAccess = parsedFilter.hasGrantedAccess;
      }
      if (
        parsedFilter?.roleIds !== undefined &&
        !isEmpty(parsedFilter?.roleIds)
      ) {
        this.roleIds = parsedFilter.roleIds;
      }
    } catch (error) {
      loggerService.error('An unexpected error occurrued', error);
    }
  }
}
