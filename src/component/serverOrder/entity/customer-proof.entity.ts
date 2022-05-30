import { ApiProperty } from '@nestjs/swagger';
import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity()
export class CustomerProof {
  @ApiProperty({ type: Number })
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty({ type: String })
  @Column({
    type: 'nvarchar',
    length: 150,
    nullable: false,
  })
  orderId: string;

  @ApiProperty({ type: Number })
  @Column({
    type: 'int',
    nullable: false,
    default: 1,
  })
  underInfluence: number;

  @ApiProperty({ type: Number })
  @Column({
    type: 'int',
    nullable: false,
    default: 1,
  })
  dobBefore: number;

  @ApiProperty({ type: String })
  @Column({
    type: 'nvarchar',
    length: 50,
    nullable: true,
  })
  photoId: string;

  @ApiProperty({ type: String })
  @Column({
    type: 'nvarchar',
    length: 50,
    nullable: true,
  })
  driverName: string;

  @Column({ type: 'datetime2' })
  @CreateDateColumn()
  createdDate: Date;

  @Column({ type: 'datetime2' })
  @UpdateDateColumn()
  updatedDate: Date;
}
