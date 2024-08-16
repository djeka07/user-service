import {
  BadRequestException,
  Body,
  Controller,
  ForbiddenException,
  Get,
  HttpCode,
  Param,
  Post,
  Put,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';

import { Emit, Emittable } from '@djeka07/nestjs-azure-service-bus';
import { UnauthorizedException } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiForbiddenResponse,
  ApiOkResponse,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
  ApiUnauthorizedResponse,
  getSchemaPath,
} from '@nestjs/swagger';
import { ErrorResponse } from '../app/app.model';
import { AppService } from '../app/app.service';
import { UserEntity } from '../user/user.entity';
import { UserService } from '../user/user.service';
import { Public } from './auth.decorator';
import { AuthEvent } from './auth.event';
import {
  AuthBody,
  RegisterRequest,
  ResetRequest,
  Token,
  UpdatePasswordRequest,
} from './auth.model';
import {
  OkResponse,
  UsersLoggedInResponse,
  VerifyPasswordTokenResponse,
} from './auth.response';
import { AuthService } from './auth.service';
import { LocalAuthGuard } from './local-auth.guard';

@ApiTags('Auth')
@Controller('/api/v1/auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly appService: AppService,
    @Emittable('user_logged_in')
    private readonly userLoggedInEmit: Emit,
  ) {}

  @ApiOperation({ description: 'Login in to the service', summary: 'Login' })
  @ApiForbiddenResponse({
    type: ErrorResponse,
    description: 'No application with id found',
  })
  @ApiUnauthorizedResponse({
    type: ErrorResponse,
    description: 'Wrong password or email',
  })
  @ApiOkResponse({ status: 200, type: Token })
  @HttpCode(200)
  @UseGuards(LocalAuthGuard)
  @Public()
  @Post()
  async auth(@Request() req, @Body() body: AuthBody) {
    const userAppIds = (req.user as UserEntity)?.apps?.map((a) => a.appId);
    const application = await this.appService.findById(body?.applicationId);
    if (!userAppIds.includes(body?.applicationId) || !application) {
      throw new UnauthorizedException();
    }

    const auth = this.authService.auth(req.user, application);
    this.userLoggedInEmit({
      payload: { body: new AuthEvent(req.user, application) },
    });
    return auth;
  }

  @ApiOperation({
    description: 'Register user.',
    summary: 'Register user',
  })
  @Post('/register')
  @Public()
  @HttpCode(200)
  @ApiOkResponse({ status: 200, type: OkResponse })
  @ApiBadRequestResponse({
    type: ErrorResponse,
    description: 'Something went wrong',
  })
  async register(
    @Body() registerRequest: RegisterRequest,
  ): Promise<OkResponse> {
    try {
      if (registerRequest.password !== registerRequest.confirmPassword) {
        throw new BadRequestException('Passwords dont match', 'NoMatch');
      }

      await this.authService.register(registerRequest);
      return new OkResponse('User has been registered', 200);
    } catch (error) {
      if (error instanceof ForbiddenException) {
        throw new BadRequestException(
          'Something went wrong',
          'Unexpected error',
        );
      }
      throw error;
    }
  }

  @ApiOperation({
    description:
      'Create a reset password token to be able to change account password.',
    summary: 'Create a reset password token',
  })
  @Put('/resets')
  @HttpCode(200)
  @Public()
  @ApiOkResponse({ status: 200, type: OkResponse })
  async resetPasswordToken(@Body() resetRequest: ResetRequest) {
    try {
      const { userId, email, roleIds } =
        (await this.authService.findByEmail(resetRequest.email)) || {};
      const resetToken = this.authService.createResetToken({
        email,
        id: userId,
        roles: roleIds,
        applicationId: resetRequest.applicationId,
      });
      await this.authService.updatePasswordResetToken(email, resetToken);
      return new OkResponse('Ok', 200);
    } catch (error) {
      return new OkResponse('Ok', 200);
    }
  }

  @ApiOperation({
    description: 'Get the amount of logged in users from Date and time',
    summary: 'Get amount of logged in users',
  })
  @Get('/amounts')
  @ApiResponse({ type: UsersLoggedInResponse })
  @HttpCode(200)
  @ApiQuery({ name: 'dateFrom', type: 'string', example: '2024-02-02 12:30' })
  async getNumberOfLoggedInUsersFromDate(@Query('dateFrom') dateFrom: string) {
    const usersLoggedIn =
      await this.authService.findAmountOfLoggedInUsersFromDate(dateFrom);
    return new UsersLoggedInResponse(usersLoggedIn);
  }

  @ApiUnauthorizedResponse({
    schema: {
      $ref: getSchemaPath(ErrorResponse),
      example: { statusCode: 401 },
    },
    description: '',
  })
  @ApiOkResponse({ type: Token })
  @ApiOperation({ description: 'Refresh token', summary: 'Refresh token' })
  @Put('/:token')
  @Public()
  async refresh(@Param('token') token: string) {
    const { applicationId, email, ...rest } =
      await this.authService.verifyRefreshToken(token);
    const [user, application] = await Promise.all([
      this.authService.findByEmail(email),
      this.appService.findById(applicationId),
    ]);
    if (!user || !application) throw new UnauthorizedException();
    return this.authService.refresh(
      { applicationId, email, ...rest },
      token,
      user,
      application,
    );
  }

  @Get('/resets/:token')
  @ApiOkResponse({ type: VerifyPasswordTokenResponse })
  @ApiOperation({
    description: 'Validate reset token',
    summary: 'Validate reset token',
  })
  @Public()
  async verifyResetToken(@Param('token') token: string) {
    const payload = await this.authService.verifyRefreshToken(token);
    return new VerifyPasswordTokenResponse(payload.email);
  }

  @Put('/resets/:token')
  @ApiOkResponse({ type: OkResponse })
  @ApiBadRequestResponse({ schema: { $ref: getSchemaPath(ErrorResponse) } })
  @Public()
  async updatePasswordFromResetToken(
    @Param('token') token: string,
    @Body() updatePasswordRequest: UpdatePasswordRequest,
  ) {
    if (
      updatePasswordRequest.password !== updatePasswordRequest.confirmPassword
    ) {
      throw new BadRequestException('Passwords dont match');
    }
    const { email } = await this.authService.verifyRefreshToken(token);
    if (!email) throw new BadRequestException('Token expired');
    await this.authService.updatePasswordFromResetToken(
      email,
      updatePasswordRequest,
    );
    return new OkResponse('Ok', 200);
  }
}
