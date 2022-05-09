import { ApiProperty } from '@nestjs/swagger';
import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity()
export class OrderHistory {
  @ApiProperty({ type: Number })
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty({ type: String })
  @Column({
    type: 'nvarchar',
    length: 100,
    nullable: false,
  })
  orderId: string;

  @ApiProperty({ type: Number })
  @Column({
    type: 'smallint',
    nullable: false,
  })
  orderStatus: number;

  @ApiProperty({ type: String })
  @Column({
    type: 'nvarchar',
    length: 200,
    nullable: true,
  })
  name: string;

  @ApiProperty({ type: String })
  @Column({
    type: 'nvarchar',
    length: 200,

    nullable: true,
  })
  identifier: string;

  @Column({ type: 'datetime2' })
  @CreateDateColumn()
  createdDate: Date;

  @Column({ type: 'datetime2' })
  @UpdateDateColumn()
  updatedDate: Date;
}
