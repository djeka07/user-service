import { Role } from '../role/role.enum';
import { UserFilter } from './user.request';

export type FindAllByRoleModel = {
  take: number;
  page: number;
  roleId: Role;
};

export type FindAllModel = {
  take: number;
  page: number;
  includeApiRole: boolean;
  filter: UserFilter;
};
