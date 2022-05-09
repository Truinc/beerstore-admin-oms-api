import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

export enum RolesEnum {
  admin = 'admin',
  staff = 'staff',
  guest = 'guest',
  manager = 'manager',
}

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

  @ApiProperty({ type: 'enum', enum: RolesEnum })
  @Column({
    type: 'nvarchar',
    length: 50,
    default: RolesEnum.staff,
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
}
