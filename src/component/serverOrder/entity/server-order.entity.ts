import { ApiProperty } from '@nestjs/swagger';
import { IsOptional } from 'class-validator';
import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  OneToOne,
  OneToMany,
} from 'typeorm';
import { ServerOrderCustomerDetails } from './server-order-customer-details.entity';
import { ServerOrderDeliveryDetails } from './server-order-delivery-details.entity';
import { ServerOrderProductDetails } from './server-order-product-details.entity';

/**
 * @info visit link for bigCom status https://developer.bigcommerce.com/api-reference/b3A6MzU5MDQ3NDE-get-a-single-order-status-by-id
 */

//  export const categories = [
//   { id: 0, name: "Order to Pick", icon: orderToPick, actualId: "11" },
//   { id: 1, name: "Ready for Pickup", icon: pickupStore, actualId: "8" },
//   { id: 2, name: "Delivery in Transit", icon: deliveryTransit, actualId: "9" },
//   { id: 3, name: "Order Complete", icon: orderComplete, actualId: "10" },
//   { id: 4, name: "Cancelled Order", icon: orderCancelled, actualId: "5" },
// ];

// "status_id": 5,
// "status": "Cancelled",

// "status_id": 10,
// "status": "Completed",

// "status_id": 11,
// "status": "Awaiting Fulfillment",

// "status_id": 8,
// "status": "Awaiting Pickup",

// "status_id": 9,
// "status": "Awaiting Shipment",

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
export class ServerOrder {
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
    length: 100,
    nullable: false,
  })
  storeId: string;

  @ApiProperty({ type: String })
  @Column({
    type: 'nvarchar',
    length: 50,
    nullable: false,
  })
  orderType: string;

  @ApiProperty({ enum: OrderEnum })
  @Column({
    type: 'smallint',
    nullable: false,
  })
  orderStatus: OrderEnum;

  @ApiProperty({ type: String })
  @Column({
    type: 'datetime2',
    default: null,
  })
  fulfillmentDate: string;

  // @ApiProperty({ type: String })
  // @Column({
  //   type: 'time',
  //   nullable: false,
  // })
  // fulfillmentTime: string;

  @ApiProperty({ type: String })
  @Column({
    type: 'datetime2',
    nullable: false,
  })
  orderDate: string;

  @ApiProperty({ type: String })
  @Column({
    type: 'datetime2',
    nullable: true,
  })
  cancellationDate: string;

  @ApiProperty({ type: String })
  @Column({
    type: 'nvarchar',
    length: 200,

    nullable: true,
  })
  cancellationBy: string;

  @ApiProperty({ type: String })
  @Column({
    type: 'nvarchar',
    length: 500,
    nullable: true,
  })
  cancellationReason: string;

  @Column({ type: 'datetime2' })
  @CreateDateColumn()
  createdDate: Date;

  @Column({ type: 'datetime2' })
  @UpdateDateColumn()
  updatedDate: Date;

  // @ApiProperty({ type: String })
  // @Column({
  //   type: 'nvarchar',
  //   length: 250,
  //   nullable: true,
  // })
  // employeeNote: string;

  @ApiProperty({ type: String })
  @Column({
    type: 'nvarchar',
    length: 250,
    nullable: true,
    default: '',
  })
  cancellationNote: string;

  @ApiProperty({ type: String })
  @Column({
    type: 'nvarchar',
    length: 200,
    nullable: true,
  })
  transactionId: string;

  // @ApiProperty({ type: String })
  // @IsOptional()
  // @Column({
  //   type: 'nvarchar',
  //   nullable: true,
  // })
  // partial: string;

  @ApiProperty({ type: String })
  @Column({
    type: 'nvarchar',
    length: 100,
    default: '',
  })
  orderVector: string;

  @ApiProperty({ type: Boolean})
  @Column({
    default: false,
  })
  partialOrder: boolean;

  @Column({
    type: "money",
    default: 0,
  })
  productTotal: number;

  @Column({
    type: "money",
    default: 0
  })
  deliveryFee: number;

  @Column({
    type: "money",
    default: 0,
  })
  deliveryFeeHST: number;

  @Column({
    type: "money",
    default: 0
  })
  grandTotal: number;

  @Column({
    type: "money",
    default: 0
  })
  volumeTotalHL: number;

  @Column({
    default : 0
  })
  singleUnits: number;

  @Column({
    default: 0
  })
  packUnits2_6: number;

  @Column({
    default: 0
  })
  packUnits8_18: number;

  @Column({
    default: 0
  })
  packUnits_24Plus: number;

  @Column({ type: 'datetime2', default: null })
  submittedDateTime: Date;

  @Column({ type: 'datetime2', default: null, nullable: true })
  openDateTime: Date;

  @Column({ type: 'datetime2', default: null, nullable: true })
  pickUpReadyDateTime: Date;

  @Column({
    default: null,
    nullable: true
  })
  completedByEmpId: number;

  @Column({ type: 'datetime2', default: null, nullable: true })
  completedDateTime: Date;

  @Column({ default: null })
  idChecked: string;

  @Column({ type: 'datetime2', default: null, nullable: true })
  requestedPickUpTime: Date;

  @Column({ type: 'nvarchar', length: 50, default: null })
  browserVersion: string;

  @Column({
    default: false
  })
  refunded: boolean;

  @Column({
    type: "money",
    default: 0
  })
  refundedAmount: number

  @Column({
    type: 'nvarchar',
    default: null
  })
  refundReason: string;

  @Column({
    type: 'nvarchar',
    default: '',
  })
  pickUpType: string;

  @ApiProperty({ type: Boolean })
  @Column({
    default: false
  })
  underInfluence: boolean;

  @ApiProperty({ type: Boolean })
  @Column({
    default: false
  })
  dobBefore: boolean;


  @OneToOne(() => ServerOrderCustomerDetails, (serverOrderCustomerDetails) => serverOrderCustomerDetails.serverOrder, {
    cascade: ['insert', 'update'],
    onDelete: 'CASCADE',
  })
  serverOrderCustomerDetails: ServerOrderCustomerDetails;

  @OneToOne(() => ServerOrderDeliveryDetails, (serverOrderDeliveryDetails) => serverOrderDeliveryDetails.serverOrder, {
    cascade: ['insert', 'update'],
    onDelete: 'CASCADE',
  })
  serverOrderDeliveryDetails: ServerOrderDeliveryDetails;

  @OneToMany(() => ServerOrderProductDetails, (serverOrderProductDetails) => serverOrderProductDetails.serverOrder, {
    cascade: ['insert', 'update'],
    onDelete: 'CASCADE',
  })
  serverOrderProductDetails: ServerOrderProductDetails[];
}