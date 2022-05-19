import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { UserStores } from './userStores.entity';

// export enum RolesEnum {
//   admin = 'admin',
//   staff = 'staff',
//   guest = 'guest',
//   manager = 'manager',
// }

// same list on the admin side
export enum RolesEnum {
  superadmin = 'superadmin',
  storemanager = 'storemanager',
  storerepresentative = 'storerepresentative',
  ithelpdesk = 'ithelpdesk',
  reportingadmin = 'reportingadmin',
  customerservicerep = 'customerservicerep',
}

export const userPermissions = {
  superadmin: [
    RolesEnum.superadmin,
    RolesEnum.storemanager,
    RolesEnum.storerepresentative,
    RolesEnum.reportingadmin,
    RolesEnum.ithelpdesk,
    RolesEnum.customerservicerep,
  ],
  storemanager: [
    // RolesEnum.storemanager,
    RolesEnum.storerepresentative,
    // RolesEnum.reportingadmin,
    // RolesEnum.ithelpdesk,
    // RolesEnum.customerservicerep,
  ],
  storerepresentative: [
    // RolesEnum.storerepresentative,
    // RolesEnum.reportingadmin,
    // RolesEnum.ithelpdesk,
    // RolesEnum.customerservicerep,
  ],
  reportingadmin: [
    // RolesEnum.reportingadmin,
    // RolesEnum.ithelpdesk,
    // RolesEnum.customerservicerep,
  ],
  ithelpdesk: [
    RolesEnum.storemanager,
    RolesEnum.storerepresentative,
    RolesEnum.reportingadmin,
    RolesEnum.ithelpdesk,
    RolesEnum.customerservicerep,
  ],
  customerservicerep: [RolesEnum.customerservicerep],
};

@Entity()
export class User {
  @ApiProperty({ type: Number })
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty({ type: String })
  @Column({
    type: 'nvarchar',
    length: 50,
    nullable: false,
  })
  firstName: string;

  @ApiProperty({ type: String })
  @Column({
    type: 'nvarchar',
    length: 50,
  })
  lastName: string;

  @ApiProperty({ type: String })
  @Column({
    type: 'nvarchar',
    length: 150,
    unique: true,
    nullable: false,
  })
  email: string;

  @ApiProperty({ type: String })
  @Column({
    type: 'nvarchar',
    length: 150,
    unique: true,
    nullable: false,
  })
  username: string;

  @ApiProperty({ type: String })
  @Column({
    type: 'nvarchar',
    length: 150,
    select: false,
  })
  password?: string;

  @ApiProperty({ type: String })
  @Column({
    type: 'nvarchar',
    length: 150,
    select: false,
    default: null,
  })
  employeeId: string;

  @ApiProperty({ type: 'enum', enum: RolesEnum })
  @Column({
    type: 'nvarchar',
    length: 50,
    default: RolesEnum.storerepresentative,
  })
  role: string;

  @ApiProperty({ type: Number })
  @Column({ type: 'smallint', default: 1 })
  isActive: number;

  @Column({ type: 'datetime2' })
  @CreateDateColumn()
  createdDate: Date;

  @Column({ type: 'datetime2' })
  @UpdateDateColumn()
  updatedDate: Date;

  @OneToMany(() => UserStores, (store) => store.userId)
  usersStores: UserStores[];

  @ApiProperty({ type: String })
  @Column({
    type: 'nvarchar',
    length: 150,
    default: null,
  })
  manager: string;

  @ApiProperty({ type: Number })
  @Column({ type: 'smallint', default: 0 })
  loginAttempts: number;
}
