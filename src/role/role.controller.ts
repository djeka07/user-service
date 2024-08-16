import { Controller, Get, Param, ParseIntPipe, Query } from '@nestjs/common';
import { RoleService } from './role.service';
import { AuthGuard } from '../auth/auth.guard';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { RoleResponse } from './role.response';
import { UserResponse } from '../user/user.response';

@ApiTags('Roles')
@Controller('/api/v1/roles')
export class RoleController {
  constructor(private readonly roleService: RoleService) {}

  @ApiBearerAuth()
  @ApiOkResponse({ type: [RoleResponse] })
  @Get()
  async getRoles() {
    return this.roleService.roles.map((role) => new RoleResponse(role));
  }

  @ApiBearerAuth()
  @ApiOkResponse({ type: RoleResponse })
  @Get('/:id')
  async getById(@Param('id') id: string) {
    return new RoleResponse(this.roleService.findById(id));
  }

  @ApiBearerAuth()
  @ApiOkResponse({ type: RoleResponse })
  @ApiQuery({
    name: 'take',
    type: Number,
    example: 10,
    required: false,
    allowEmptyValue: true,
  })
  @ApiQuery({
    name: 'page',
    type: Number,
    example: 1,
    required: false,
    allowEmptyValue: true,
  })
  @Get('/:id/users')
  async getAllUsersByRoleId(
    @Param('id') id: string,
    @Query('take', ParseIntPipe) take = 10,
    @Query('page', ParseIntPipe) page = 1,
  ) {
    const { hasNextPage, total, users } = await this.roleService.findUsersById({
      take,
      page,
      roleId: id,
    });
    return {
      users: users?.map((u) => new UserResponse(u, this.roleService)),
      hasNextPage,
      total,
    };
  }
}
