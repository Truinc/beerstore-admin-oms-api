import { ApiProperty } from '@nestjs/swagger';
import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity()
export class PostFeed {
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
    length: 150,
    nullable: false,
  })
  orderId: string;

  @ApiProperty({ type: String })
  @Column({
    type: 'nvarchar',
    length: 300,
    nullable: false,
  })
  feed: string;

  @Column({ type: 'datetime2' })
  @CreateDateColumn()
  createdDate: Date;

  @Column({ type: 'datetime2' })
  @UpdateDateColumn()
  updatedDate: Date;
}
