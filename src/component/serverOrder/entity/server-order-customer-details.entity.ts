import { ApiProperty } from '@nestjs/swagger';
import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  OneToOne,
  JoinColumn,
} from 'typeorm';
import { ServerOrder } from './server-order.entity';

export enum CustomerTypeEnum {
  Email = 'email',
  Guest = 'guest',
  Google = 'google',
  Facebook = 'facebook',
}

@Entity()
export class ServerOrderCustomerDetails {
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

  @ApiProperty({ type: String })
  @Column({
    type: 'nvarchar',
    length: 200,
    nullable: false,
  })
  name: string;

  @ApiProperty({
    type: String,
  })
  @Column({
    type: 'nvarchar',
    length: 200,
    default: null,
    nullable: true,
  })
  customerId: string;

  @ApiProperty({ type: String })
  @Column({
    type: 'nvarchar',
    length: 200,
    nullable: false,
  })
  email: string;

  @ApiProperty({ type: String })
  @Column({
    type: 'nvarchar',
    length: 20,
  })
  postalCode: string;

  @ApiProperty({ type: Date })
  @Column({
    type: 'date',
    nullable: true,
  })
  dob: Date;

  @ApiProperty({ type: String })
  @Column({
    type: 'nvarchar',
    length: 20,
  })
  salutation: string;

  @ApiProperty({ enum: CustomerTypeEnum })
  @Column({
    type: 'nvarchar',
    length: 30,
    nullable: true,
  })
  customerType: CustomerTypeEnum;

  @ApiProperty({
    type: String,
  })
  @Column({
    type: 'nvarchar',
    length: 20,
    default: null,
    nullable: true,
  })
  ccType: string;

  @ApiProperty({
    type: Number,
  })
  @Column({
    type: 'int',
    default: null,
    nullable: true,
  })
  cardNumber: number;

  @Column({
    type: 'money',
    default: 0,
  })
  cardAmount: number;

  @Column({
    type: 'int',
    nullable: true,
    default: null,
  })
  authCode: number;

  @OneToOne(
    () => ServerOrder,
    (serverOrder) => serverOrder.serverOrderCustomerDetails,
    {
      onDelete: 'CASCADE',
    },
  )
  @JoinColumn()
  serverOrder: ServerOrder;
}
