import * as bcrypt from 'bcryptjs';
import { AppEntity } from '../app/app.entity';
import { AuthEntity } from '../auth/auth.entity';

import {
  Column,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  ManyToMany,
  JoinTable,
} from 'typeorm';

@Entity({ name: 'user' })
export class UserEntity {
  @PrimaryGeneratedColumn('uuid', {
    name: 'user_id',
  })
  userId: string;

  @Column({
    name: 'username',
    nullable: false,
    unique: true,
    default: '',
  })
  username: string;

  @Column({ name: 'first_name', nullable: true, default: '' })
  firstName: string;

  @Column({ name: 'last_name', nullable: true, default: '' })
  lastName: string;

  @Column({
    name: 'email',
    unique: true,
    nullable: false,
    default: '',
  })
  email: string;

  @Column({
    name: 'password',
    nullable: true,
    default: '',
  })
  password: string;

  @Column({ name: 'password_reset_token', nullable: true, default: '' })
  passwordResetToken: string;

  @CreateDateColumn({
    nullable: false,
    name: 'created_on',
  })
  created: Date;

  @Column({
    nullable: false,
    name: 'has_granted_access',
    default: false,
  })
  hasGrantedAccess: boolean;

  @Column({
    nullable: true,
    name: 'granted_access_on',
    type: 'timestamp',
  })
  grantedAccessOn: Date;

  @Column('simple-array', { name: 'role_ids', default: [] })
  roleIds: string[];

  @OneToMany(() => AuthEntity, (auth) => auth.user)
  @JoinTable()
  auths: AuthEntity[];

  @ManyToMany(() => AppEntity)
  @JoinTable()
  apps: AppEntity[];

  public hashPassword() {
    this.password = bcrypt.hashSync(this.password, 8);
  }

  public checkIfUnencryptedPasswordIsValid(unencryptedPassword: string) {
    return bcrypt.compareSync(unencryptedPassword, this.password);
  }
}
