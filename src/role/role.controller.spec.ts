import { Test } from '@nestjs/testing';
import { RoleController } from './role.controller';
import { RoleService } from './role.service';
import { RoleResponse } from './role.response';

describe('GIVEN Role controller', () => {
  const mockRoleService = {
    findById: jest.fn(),
    findUsersById: jest.fn(),
    roles: [
      { name: 'one', roleId: 'oneId' },
      { name: 'two', roleId: 'twoId' },
    ],
  };
  let controller: RoleController;
  let roleService: RoleService;
  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [RoleController],
      providers: [RoleService],
    })
      .overrideProvider(RoleService)
      .useValue(mockRoleService)
      .compile();

    roleService = moduleRef.get(RoleService);
    controller = moduleRef.get(RoleController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('WHEN getRoles THEN should return correct roles', async () => {
    expect(roleService.roles).toBeDefined();
    expect(await controller.getRoles()).toStrictEqual([
      new RoleResponse({ name: 'one', roleId: 'oneId' }),
      new RoleResponse({ name: 'two', roleId: 'twoId' }),
    ]);
  });

  it('WHEN getById THEN role service findById should been called', async () => {
    expect(roleService.findById).toBeDefined();
    jest
      .spyOn(roleService, 'findById')
      .mockReturnValue({ name: 'name', roleId: 'roleId' });
    await controller.getById('id');
    expect(roleService.findById).toHaveBeenCalledTimes(1);
  });
  it('WHEN getAllUsersByRoleId THEN role service findUsersById should been', async () => {
    jest
      .spyOn(roleService, 'findUsersById')
      .mockResolvedValue({ hasNextPage: false, total: 0, users: [] });
    await controller.getAllUsersByRoleId('roleId', 10, 0);
    expect(roleService.findUsersById).toHaveBeenCalledTimes(1);
  });
});
