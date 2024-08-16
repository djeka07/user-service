import { BadRequestException, INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { RoleService } from '../role/role.service';
import { UserService } from '../user/user.service';
import { SelfController } from './self.controller';

describe('GIVEN SelfController', () => {
  let app: INestApplication;
  let controller: SelfController;
  const mockUserService = {
    findByEmail: jest.fn(),
    updatePassword: jest.fn(),
  };
  const mockRoleService = {
    tryFindById: jest.fn(),
  };

  let userService: UserService;
  let roleService: RoleService;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [SelfController],
      providers: [UserService, RoleService],
    })
      .overrideProvider(UserService)
      .useValue(mockUserService)
      .overrideProvider(RoleService)
      .useValue(mockRoleService)
      .compile();

    controller = moduleRef.get(SelfController);
    userService = moduleRef.get(UserService);
    roleService = moduleRef.get(RoleService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('WHEN compile THEN controller should be defined', async () => {
    expect(controller).toBeDefined();
  });

  it('WHEN GET THEN services should be called', async () => {
    jest
      .spyOn(roleService, 'tryFindById')
      .mockReturnValue({ name: 'name', roleId: 'roleId' });
    jest.spyOn(userService, 'findByEmail').mockResolvedValue({
      userId: '',
      apps: [],
      auths: [],
      email: 'test@mail.com',
      firstName: 'test',
      lastName: 'Test',
      grantedAccessOn: new Date(),
      created: new Date(),
      hasGrantedAccess: true,
      password: '',
      passwordResetToken: '',
      username: '',
      roleIds: ['a7d00627-194e-4c68-8941-92eb2c45ec15'],
      checkIfUnencryptedPasswordIsValid: jest.fn(),
      hashPassword: jest.fn(),
    });

    expect(userService.findByEmail).toBeDefined();
    expect(roleService.tryFindById).toBeDefined();
    await controller.get({ user: { email: 'test@mail.com' } });
    expect(userService.findByEmail).toHaveBeenCalledTimes(1);
    expect(roleService.tryFindById).toHaveBeenCalledTimes(1);
  });

  it('WHEN updatePassword THEN updatePassword and tryFindById should be called', async () => {
    jest
      .spyOn(roleService, 'tryFindById')
      .mockReturnValue({ name: 'name', roleId: 'roleId' });
    jest.spyOn(userService, 'updatePassword').mockReturnValue(
      Promise.resolve({
        userId: '',
        apps: [],
        auths: [],
        email: 'test@mail.com',
        firstName: 'test',
        lastName: 'Test',
        grantedAccessOn: new Date(),
        created: new Date(),
        hasGrantedAccess: true,
        password: '',
        passwordResetToken: '',
        username: '',
        roleIds: ['a7d00627-194e-4c68-8941-92eb2c45ec15'],
        checkIfUnencryptedPasswordIsValid: jest.fn(),
        hashPassword: jest.fn(),
      }),
    );
    expect(userService.updatePassword).toBeDefined();
    expect(roleService.tryFindById).toBeDefined();
    await controller.updatePassword(
      { user: { email: 'test@mail.com' } },
      { confirmPassword: 'pass', currentPassword: 'curr', password: 'pass' },
    );
    expect(userService.updatePassword).toHaveBeenCalledTimes(1);
    expect(roleService.tryFindById).toHaveBeenCalledTimes(1);
  });
  it('WHEN updatePassword gets different passwords THEN bad exception should be thrown', async () => {
    expect(
      controller.updatePassword(
        { user: { email: 'test@mail.com' } },
        {
          confirmPassword: 'pass',
          currentPassword: 'curr',
          password: 'new',
        },
      ),
    ).rejects.toThrow(
      new BadRequestException('Passwords dont match', 'NoMatch'),
    );
  });
});
