import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

@Entity()
export class SignInLogs {
  @ApiProperty({ type: Number })
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty({ type: Number })
  @Column({
    type: 'int',
    nullable: false,
  })
  userId: number;

  @ApiProperty({ type: String })
  @Column({
    type: 'nvarchar',
    length: 300,
    nullable: false,
  })
  log: string;

  @Column({ type: 'datetime2' })
  @CreateDateColumn()
  createdDate: Date;
}
