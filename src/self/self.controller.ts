import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Put,
  Req,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiBody,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { ErrorResponse } from '../app/app.model';

import { RoleService } from '../role/role.service';
import { UserResponse } from '../user/user.response';
import { UserService } from '../user/user.service';
import { UpdateSelfPasswordRequest } from './self.request';

@ApiTags('Self')
@Controller('api/v1/selfs')
export class SelfController {
  constructor(
    private readonly userService: UserService,
    private readonly roleService: RoleService,
  ) {}

  @ApiBearerAuth()
  @ApiOkResponse({ type: UserResponse })
  @ApiOperation({ summary: 'Get self' })
  @Get()
  async get(@Req() request) {
    const user = await this.userService.findByEmail(request.user.email);
    return new UserResponse(user, this.roleService);
  }

  @Put('/passwords')
  @ApiBearerAuth()
  @ApiOkResponse({ type: UserResponse })
  @ApiBadRequestResponse({ type: ErrorResponse })
  @ApiOperation({ summary: 'Update password' })
  async updatePassword(
    @Req() request,
    @Body() body: UpdateSelfPasswordRequest,
  ) {
    if (body?.password !== body?.confirmPassword) {
      throw new BadRequestException('Passwords dont match', 'NoMatch');
    }
    const user = await this.userService.updatePassword(
      request.user.email,
      body,
    );
    return new UserResponse(user, this.roleService);
  }
}
