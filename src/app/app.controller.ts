/*
https://docs.nestjs.com/controllers#controllers
*/

import { Controller, Get, Param, ParseIntPipe, Query } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { AppService } from './app.service';
import {
  GetApplicationUsersResponse,
  GetApplicationsResponse,
} from './app.response';
import { AuthGuard } from '../auth/auth.guard';
import { UserResponse } from '../user/user.response';
import { RoleService } from '../role/role.service';

@ApiTags('Applications')
@Controller('/api/v1/applications')
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly roleService: RoleService,
  ) {}

  @ApiBearerAuth()
  @ApiOkResponse({ type: GetApplicationsResponse })
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
  @Get()
  async get(
    @Query('take', ParseIntPipe) take = 10,
    @Query('page', ParseIntPipe) page = 1,
  ) {
    const { applications, hasNextPage, total } = await this.appService.findAll({
      take,
      page,
    });
    return new GetApplicationsResponse(applications, total, hasNextPage);
  }

  @ApiBearerAuth()
  @ApiOkResponse({ type: GetApplicationUsersResponse })
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
  @Get('/:appId/users')
  async getAppUsers(
    @Query('take', ParseIntPipe) take = 10,
    @Query('page', ParseIntPipe) page = 1,
    @Param('appId') appId: string,
  ) {
    const { hasNextPage, total, users } =
      await this.appService.findAllUsersByAppId({ appId, take, page });

    return {
      hasNextPage,
      total,
      users: users?.map((u) => new UserResponse(u, this.roleService)),
    };
  }

  @ApiBearerAuth()
  @ApiOkResponse({ type: GetApplicationUsersResponse })
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
  @Get('/:appId/users/no-accesses')
  async getAppUsersAccess(
    @Query('take', ParseIntPipe) take = 10,
    @Query('page', ParseIntPipe) page = 1,
    @Param('appId') appId: string,
  ) {
    const { hasNextPage, total, users } =
      await this.appService.findAllUsersByNotInAppId({ appId, take, page });

    return {
      hasNextPage,
      total,
      users: users?.map((u) => new UserResponse(u, this.roleService)),
    };
  }
}
