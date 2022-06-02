import { ApiProperty } from '@nestjs/swagger';
import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity()
export class ServerOrderDeliveryDetails {
  @ApiProperty({ type: Number })
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty({ type: String })
  @Column({
    type: 'nvarchar',
    length: 100,
    unique: true,
    nullable: false,
  })
  orderId: string;

  @ApiProperty({ type: Number })
  @Column({
    type: "int",
    nullable: true
  })
  deliveryId: number;

  @ApiProperty({ type: String })
  @Column({
    type: 'nvarchar',
    length: 100,
    nullable: true
  })
  deliveryGuyName: string;

  @ApiProperty({
    type: Date
  })
  @Column({
    type: 'date',
    nullable: true
  })
  deliveryDate: Date;

  @ApiProperty({
    type: String
  })
  @Column({
    type: 'nvarchar',
    length: 200,
  })
  deliveryAddress: string;

  @ApiProperty({
    type: String
  })
  @Column({
    type: 'nvarchar',
    length: 100
  })
  deliveryCity: string;

  @ApiProperty({
    type: String
  })
  @Column({
    type: 'nvarchar',
    length: 20
  })
  deliveryPostalCode: string;

  @Column({ type: 'nvarchar', length: 50, default: null, nullable: true })
  deliveryType: string;

  @Column({ type: 'time', default: null, nullable: true })
  deliveryETA: Date;

  @Column({ type: 'datetime2', default: null, nullable: true })
  deliveryScheduledDateTime: Date;
}
