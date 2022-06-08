import { ApiProperty } from '@nestjs/swagger';
import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from '../../user/entity/user.entity';

export enum TokenEnum {
  refresh = 'refresh',
  access = 'access',
  reset = 'reset',
  beerguy = 'beerguy',
  orderqueue = 'orderqueue',
}

@Entity()
export class Token {
  @ApiProperty({ type: String })
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty({ type: String })
  @Column({
    type: 'nvarchar',
    length: 1000,
    nullable: false,
  })
  token: string;

  @ApiProperty({ type: Date })
  @Column({ type: 'datetime2', nullable: false })
  expires: Date;

  @ApiProperty({ type: Boolean })
  @Column({ type: 'smallint', default: 0 })
  blacklisted?: number = 0;

  @ApiProperty({ type: 'enum', enum: TokenEnum })
  @Column({
    type: 'nvarchar',
    length: 50,
    default: TokenEnum.refresh,
  })
  type: string;

  @ApiProperty({ type: User })
  @ManyToOne(() => User, {
    onDelete: "CASCADE"
  })
  user: User;

  @Column({ type: 'datetime2' })
  @CreateDateColumn()
  createdDate: Date;

  @Column({ type: 'datetime2' })
  @UpdateDateColumn()
  updatedDate: Date;
}
