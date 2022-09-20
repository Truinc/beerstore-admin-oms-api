import { ApiProperty } from '@nestjs/swagger';
import { Entity, Column, PrimaryGeneratedColumn, ManyToOne } from 'typeorm';
import { ServerOrder } from './server-order.entity';

export enum OrderEnum {
  awaiting_fulfillment = 11,
  in_transit = 3, // Partially Shipped
  returned = 6, // Declined	=> Seller has marked the order as declined for lack of manual payment, or other reason
  pickup = 8, // Order confirmed status for pickup
  awaiting_shipment = 9, // Order confirmed status for online delivery
  completed = 10,
  cancelled = 5,
}

@Entity()
export class ServerOrderProductDetails {
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
    type: 'int',
    nullable: false,
    default: 0,
  })
  productId: number;

  @ApiProperty({ type: Number })
  @Column({
    type: 'int',
    nullable: false,
    default: 0,
  })
  variantId: number;

  @ApiProperty({ type: Number })
  @Column({
    type: 'int',
    nullable: false,
  })
  lineItem: number;

  @ApiProperty({ type: String })
  @Column({
    type: 'nvarchar',
    length: 200,
    nullable: true,
  })
  itemSKU: string;

  @ApiProperty({ type: String })
  @Column({
    type: 'nvarchar',
    nullable: false,
  })
  itemDescription: string;

  @ApiProperty({ type: String })
  @Column({
    type: 'nvarchar',
    nullable: false,
  })
  brewer: string;

  @ApiProperty({ type: String })
  @Column({
    type: 'nvarchar',
    nullable: false,
  })
  category: string;

  @ApiProperty({ type: Number })
  @Column({
    type: 'int',
  })
  quantity: number;

  @ApiProperty({ type: Number })
  @Column({
    type: 'int',
  })
  packSize: number;

  @ApiProperty({ type: Number })
  @Column({
    type: 'int',
  })
  volume: number;

  @ApiProperty({ type: 'string' })
  @Column({
    type: 'nvarchar',
  })
  containerType: string;

  @ApiProperty({ type: Number })
  @Column({
    type: 'money',
  })
  itemTotal: number;

  @ApiProperty({ type: Number })
  @Column({
    type: 'decimal',
    precision: 10,
    scale: 8,
  })
  itemHLTotal: number;

  @ApiProperty({ type: Boolean })
  @Column({
    default: false,
  })
  available: boolean;

  @ApiProperty({ type: String })
  @Column({
    type: 'nvarchar',
    nullable: true,
  })
  utmSource: string;

  @ApiProperty({ type: String })
  @Column({
    type: 'nvarchar',
    nullable: true,
  })
  utmMedium: string;

  @ApiProperty({ type: String })
  @Column({
    type: 'nvarchar',
    nullable: true,
  })
  utmCampaign: string;

  @ApiProperty({ type: String })
  @Column({
    type: 'nvarchar',
    nullable: true,
  })
  utmTerm: string;

  @ApiProperty({ type: String })
  @Column({
    type: 'nvarchar',
    nullable: true,
  })
  utmContent: string;

  @ManyToOne(
    () => ServerOrder,
    (serverOrder) => serverOrder.serverOrderProductDetails,
    {
      onDelete: 'CASCADE',
    },
  )
  serverOrder: ServerOrder;
}
