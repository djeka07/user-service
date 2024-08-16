import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpException,
  Param,
  ParseBoolPipe,
  ParseIntPipe,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { Roles } from '../auth/auth.decorator';
import { AuthGuard } from '../auth/auth.guard';
import {
  UserRequest,
  UpdateUserAccessRequest,
  UpdateUserRoleRequest,
  UserFilter,
  UpdateUsersAccessRequest,
  ResetUserPasswordRequest,
} from './user.request';
import { UserService } from './user.service';
import {
  ApiBearerAuth,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiQuery,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { ErrorResponse } from '../app/app.model';
import { UserResponse, UsersResponse } from './user.response';
import { Role } from '../role/role.enum';
import { RoleService } from '../role/role.service';
import { AppService } from '../app/app.service';
import { Emit, Emittable } from '@djeka07/nestjs-azure-service-bus';
import { OkResponse } from '../auth/auth.response';
import { LokiLoggerService } from '@djeka07/nestjs-loki-logger';
import { AuthService } from 'src/auth/auth.service';

@ApiTags('Users')
@Controller('api/v1/users')
export class UserController {
  constructor(
    private readonly userService: UserService,
    private readonly roleService: RoleService,
    private readonly appService: AppService,
    private readonly authService: AuthService,
    private readonly loggerService: LokiLoggerService,
    @Emittable('user_updated')
    private readonly userUpdatedEmit: Emit,
    @Emittable('user_created')
    private readonly userCreatedEmit: Emit,
    @Emittable('user_deleted')
    private readonly userDeletedEmit: Emit,
  ) {}

  @ApiBearerAuth()
  @ApiOkResponse({ type: UsersResponse })
  @ApiUnauthorizedResponse({ type: ErrorResponse })
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
  @ApiQuery({
    name: 'filter',
    type: String,
    example: '{"hasGrantedAccess": true, "roleIds": ["roleId"]}',
    description: 'Send filter as url decoded object',
    required: false,
    allowEmptyValue: true,
  })
  @ApiQuery({
    name: 'includeApiRole',
    type: Boolean,
    example: 'true',
    description: 'If should include the api role',
    required: false,
    allowEmptyValue: true,
  })
  @Get()
  async getUsers(
    @Query('take', ParseIntPipe) take = 10,
    @Query('page', ParseIntPipe) page = 1,
    @Query('filter') filter = '[]',
    @Query('includeApiRole', ParseBoolPipe) includeApiRole: boolean = false,
  ): Promise<UsersResponse> {
    const { total, users, hasNextPage } = await this.userService.findAll({
      includeApiRole,
      take,
      page,
      filter: new UserFilter(filter, this.loggerService),
    });
    const userViewModels = users.map(
      (user) => new UserResponse(user, this.roleService),
    );

    return {
      total,
      page,
      take,
      hasNextPage,
      users: userViewModels,
    };
  }

  @ApiBearerAuth()
  @ApiOkResponse({ type: UsersResponse })
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
  @ApiQuery({
    name: 'query',
    type: String,
    example: 'Test Testsson',
    required: false,
    allowEmptyValue: true,
  })
  @Get('/search')
  async searchUsers(
    @Query('take', ParseIntPipe) take = 10,
    @Query('page', ParseIntPipe) page = 1,
    @Query('query') query = '',
  ): Promise<UsersResponse> {
    const { total, users, hasNextPage } = await this.userService.searchUsers(
      query,
      page,
      take,
    );
    const userViewModels = users.map(
      (user) => new UserResponse(user, this.roleService),
    );
    return { total, page, take, hasNextPage, users: userViewModels };
  }

  @ApiOkResponse({ type: UserResponse })
  @ApiOperation({ summary: 'Create user' })
  @Roles(Role.Administrator, Role.Api)
  @Post()
  async createUser(@Body() user: UserRequest) {
    const usr = await this.userService.create(user);
    const response = new UserResponse(usr, this.roleService);
    this.userCreatedEmit({ payload: { body: response } });
    return response;
  }

  @ApiBearerAuth()
  @ApiOkResponse({ status: 201, type: [UserResponse] })
  @ApiOperation({ summary: 'Grant users access' })
  @Put('/access')
  @Roles(Role.Administrator, Role.Api)
  async grantAccessForUsers(@Body() body: UpdateUsersAccessRequest) {
    const apps = await this.appService.findByIds(body.applicationIds);
    const users = await this.userService.updateUsersAccess(body, apps);
    const viewModels = users?.map(
      (user) => new UserResponse(user, this.roleService),
    );

    viewModels.forEach((viewModel) =>
      this.userUpdatedEmit({ payload: { body: viewModel } }),
    );
    return viewModels;
  }

  @ApiBearerAuth()
  @ApiOkResponse({ type: UserResponse })
  @ApiOperation({ summary: 'Get user' })
  @ApiNotFoundResponse({
    type: ErrorResponse,
    schema: { example: { statusCode: 404 } },
  })
  @Get('/:id')
  async findUserById(@Param('id') id: string) {
    try {
      const user = await this.userService.findById(id);
      return new UserResponse(user, this.roleService);
    } catch (error) {
      throw new HttpException('Could not find user', 404);
    }
  }

  @ApiOkResponse({ type: UserResponse })
  @ApiOperation({ summary: 'Update user' })
  @Roles(Role.Administrator, Role.Api)
  @Put('/:id')
  async updateUser(@Param('id') id: string, @Body() user: UserRequest) {
    const usr = await this.userService.updateUser(id, user);
    const viewModel = new UserResponse(usr, this.roleService);
    this.userUpdatedEmit({ payload: { body: viewModel } });
    return viewModel;
  }

  @ApiOkResponse({ type: OkResponse })
  @ApiOperation({ summary: 'Delete user' })
  @Roles(Role.Administrator, Role.Api)
  @Delete('/:id')
  async deleteUser(@Param('id') id: string): Promise<OkResponse> {
    const usr = await this.userService.deleteUser(id);
    const viewModel = new UserResponse(usr, this.roleService);
    this.userDeletedEmit({ payload: { body: viewModel } });
    return new OkResponse('User deleted', 200);
  }

  @ApiBearerAuth()
  @ApiOkResponse({ status: 201, type: UserResponse })
  @ApiOperation({ summary: 'Grant user access' })
  @Put('/:id/access')
  @Roles(Role.Administrator, Role.Api)
  async grantAccess(
    @Param('id') id: string,
    @Body() body: UpdateUserAccessRequest,
  ) {
    const apps = await this.appService.findByIds(body.applicationIds);
    const user = await this.userService.updateUserAccess(id, body, apps);
    const viewModel = new UserResponse(user, this.roleService);
    this.userUpdatedEmit({ payload: { body: viewModel } });
    return viewModel;
  }

  @ApiBearerAuth()
  @ApiOkResponse({ status: 201, type: OkResponse })
  @ApiOperation({ summary: 'Reset user token' })
  @Put('/:id/resets')
  async resetPasswordToken(
    @Param('id') id: string,
    @Body() resetRequest: ResetUserPasswordRequest,
  ) {
    try {
      const { userId, email, roleIds } =
        (await this.userService.findById(id)) || {};
      const resetToken = this.authService.createResetToken({
        email,
        id: userId,
        roles: roleIds,
        applicationId: resetRequest.applicationId,
      });
      await this.authService.updatePasswordResetToken(email, resetToken);
      return new OkResponse('Ok', 200);
    } catch (error) {
      return new HttpException('Could not reset token', 500);
    }
  }

  @ApiBearerAuth()
  @ApiOkResponse({ status: 201, type: UserResponse })
  @ApiOperation({ summary: 'Update user roles' })
  @Put('/:id/roles')
  @Roles(Role.Administrator, Role.Api)
  async updateRoles(
    @Param('id') id: string,
    @Body() body: UpdateUserRoleRequest,
  ) {
    if (
      body.rolesToAdd.some((roleToAdd) =>
        body.rolesToRemove.includes(roleToAdd),
      )
    ) {
      throw new BadRequestException(
        'Add/Remove arrays cannot contain the same id',
        'DuplicateIds',
      );
    }
    return this.userService.updateRoles(id, body);
  }
}
