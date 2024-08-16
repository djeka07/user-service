import { AppEntity } from '../app/app.entity';
import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';

import { UserEntity } from '../user/user.entity';

@Entity({ name: 'auth' })
@Unique('APP_USER_UN', ['application', 'user'])
export class AuthEntity {
  @PrimaryGeneratedColumn({
    name: 'auth_id',
    type: 'bigint',
  })
  authId: number;

  @Column({ default: '' })
  type: string;

  @Column({ name: 'access_token', nullable: false })
  accessToken: string;

  @Column({ name: 'refresh_token', nullable: false })
  refreshToken: string;

  @Column({ name: 'expires_in', nullable: false })
  expiresIn: number;

  @ManyToOne(() => UserEntity, (user) => user.auths)
  user: UserEntity;

  @ManyToOne(() => AppEntity, (app) => app.auths)
  @JoinColumn()
  application: AppEntity;

  @Column({
    nullable: false,
    name: 'created_on',
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
  })
  created: string;
}
