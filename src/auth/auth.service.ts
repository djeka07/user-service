import {
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UserService } from '../user/user.service';
import {
  Payload,
  RegisterRequest,
  Token,
  UpdatePasswordRequest,
} from './auth.model';
import { UserEntity } from '../user/user.entity';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { AuthEntity } from './auth.entity';
import { MoreThanOrEqual, Repository } from 'typeorm';
import { AppEntity } from '../app/app.entity';

@Injectable()
export class AuthService {
  private accessTokenExpiresIn: number;
  private refreshTokenExpiresIn: number;
  private resetTokenExpiresIn: number;
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    @InjectRepository(AuthEntity)
    private readonly authRepository: Repository<AuthEntity>,
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
  ) {
    this.accessTokenExpiresIn = configService.get<number>(
      'AUTH_ACCESS_TOKEN_EXPIRES_IN',
    );
    this.refreshTokenExpiresIn = configService.get<number>(
      'AUTH_REFRESH_TOKEN_EXPIRES_IN',
    );
    this.resetTokenExpiresIn = configService.get<number>(
      'AUTH_RESET_TOKEN_EXPIRES_IN',
    );
  }

  async findAmountOfLoggedInUsersFromDate(fromDate: string): Promise<number> {
    const [, amount] = await this.authRepository.findAndCount({
      where: { created: MoreThanOrEqual(fromDate) },
    });

    return amount;
  }

  async findByRefreshToken(refreshToken: string) {
    return this.authRepository.findOneByOrFail({ refreshToken });
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

  async validate(email: string, password: string): Promise<UserEntity> {
    const user = await this.findByEmail(email);
    if (
      user?.checkIfUnencryptedPasswordIsValid(password) &&
      user.hasGrantedAccess
    ) {
      return user;
    }
    return null;
  }

  async register({
    email,
    firstName,
    lastName,
    password,
  }: RegisterRequest): Promise<UserEntity> {
    if (await this.userRepository.findOneBy({ email })) {
      throw new ForbiddenException();
    }
    const user = new UserEntity();
    user.firstName = firstName;
    user.lastName = lastName;
    user.email = email;
    user.username = email;
    user.password = password;
    user.hashPassword();

    const usr = await this.userRepository.save(user);
    return usr;
  }

  async updatePasswordResetToken(
    email: string,
    resetToken: string,
  ): Promise<UserEntity> {
    const user = await this.findByEmail(email);
    user.passwordResetToken = resetToken;
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

  private createTokens = (payload: Payload): Token => ({
    type: 'Bearer',
    accessToken: this.jwtService.sign(payload, {
      expiresIn: `${this.accessTokenExpiresIn}s`,
    }),
    refreshToken: this.jwtService.sign(payload, {
      expiresIn: `${this.refreshTokenExpiresIn}s`,
    }),
    expiresIn: this.accessTokenExpiresIn,
  });

  public createResetToken(payload: Payload) {
    return this.jwtService.sign(payload, {
      expiresIn: `${this.resetTokenExpiresIn}s`,
    });
  }

  async auth(user: UserEntity, application: AppEntity) {
    const payload = {
      email: user.email,
      roles: user.roleIds?.map((role) => role),
      id: user.userId,
      applicationId: application.appId,
    };
    const { accessToken, expiresIn, refreshToken, type } =
      this.createTokens(payload);
    const authToSave =
      (await this.authRepository.findOne({
        relations: { user: true, application: true },
        where: {
          user: { userId: user.userId },
          application: { appId: application.appId },
        },
      })) || new AuthEntity();
    authToSave.accessToken = accessToken;
    authToSave.user = user;
    authToSave.expiresIn = expiresIn;
    authToSave.created = new Date().toISOString();
    authToSave.refreshToken = refreshToken;
    authToSave.application = application;
    authToSave.type = type;

    await this.authRepository.save(authToSave);

    return { accessToken, expiresIn, refreshToken, type };
  }

  async verifyRefreshToken(token: string): Promise<Payload> {
    return await this.jwtService.verifyAsync<Payload>(token);
  }

  async findByRefreshTokenUserAndApplication(
    refreshToken: string,
    user: UserEntity,
    application: AppEntity,
  ) {
    return this.authRepository.findOneOrFail({
      relations: { user: true, application: true },
      where: {
        refreshToken,
        user: { userId: user.userId },
        application: { appId: application.appId },
      },
    });
  }

  async refresh(
    payload: Payload,
    refreshTkn: string,
    user: UserEntity,
    app: AppEntity,
  ): Promise<Token> {
    try {
      const { email, roles, id, applicationId } = payload;
      const { accessToken, expiresIn, type, refreshToken } = this.createTokens({
        email,
        roles,
        id,
        refresh: true,
        applicationId,
      });
      const authToSave = await this.findByRefreshTokenUserAndApplication(
        refreshTkn,
        user,
        app,
      );
      authToSave.accessToken = accessToken;
      authToSave.expiresIn = expiresIn;
      authToSave.refreshToken = refreshToken;
      authToSave.type = type;
      await this.authRepository.save(authToSave);
      return { accessToken, expiresIn, type, refreshToken };
    } catch {
      throw new UnauthorizedException();
    }
  }
}
