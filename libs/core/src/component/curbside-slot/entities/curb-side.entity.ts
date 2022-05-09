import { ApiProperty } from '@nestjs/swagger';
import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum CurbSideSlot {
  vacant = 0,
  filled = 1,
}

@Entity()
export class CurbSide {
  @ApiProperty({ type: Number })
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty({ type: Number })
  @Column({
    type: 'int',
    nullable: false,
  })
  storeId: number;

  @ApiProperty({ type: String })
  @Column({
    type: 'nvarchar',
    length: 1000,
    nullable: false,
  })
  checkoutId: string;

  @ApiProperty({ type: Number })
  @Column({
    type: 'int',
    nullable: false,
  })
  customerId: number;

  @ApiProperty({ type: Date })
  @Column({
    type: 'date',
    nullable: false,
  })
  deliveryDate: Date;

  @ApiProperty({ type: 'enum', enum: CurbSideSlot })
  @Column({
    enum: CurbSideSlot,
    nullable: false,
  })
  status: CurbSideSlot;

  @ApiProperty({ type: Number })
  @Column({
    type: 'smallint',
    nullable: false,
  })
  slotStartTime: number;

  @ApiProperty({ type: Number })
  @Column({
    type: 'smallint',
    nullable: false,
  })
  slotEndTime: number;

  @Column({ type: 'datetime2' })
  @CreateDateColumn()
  createdDate: Date;

  @Column({ type: 'datetime2' })
  @UpdateDateColumn()
  updatedDate: Date;
}
