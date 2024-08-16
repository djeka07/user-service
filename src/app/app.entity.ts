import { AuthEntity } from '../auth/auth.entity';
import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'application' })
export class AppEntity {
  @PrimaryGeneratedColumn('uuid', {
    name: 'application_id',
  })
  appId: string;

  @Column({ name: 'application_name' })
  appName: string;

  @OneToMany(() => AuthEntity, (auth) => auth.application)
  auths: AuthEntity[];
}
