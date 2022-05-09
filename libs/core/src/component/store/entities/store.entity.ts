import { ApiProperty } from '@nestjs/swagger';
import {
  Column,
  CreateDateColumn,
  Entity,
  UpdateDateColumn,
  OneToMany,
  PrimaryColumn,
} from 'typeorm';
import { StoreHours } from './storeHours.entity';
import { StoreFeatures } from './storeFeatures.entity';

@Entity()
export class Store {
  // @ApiProperty({ type: Number })
  // @PrimaryGeneratedColumn()
  // id: number;
  @ApiProperty({ type: Number })
  @PrimaryColumn({
    type: 'int',
    nullable: false,
    unique: true,
  })
  id: number;

  @ApiProperty({ type: String })
  @Column({
    type: 'nvarchar',
    length: 100,
    nullable: false,
  })
  locationName: string;

  @ApiProperty({ type: String })
  @Column({
    type: 'nvarchar',
    length: 70,
    nullable: false,
  })
  streetNo: string;

  @ApiProperty({ type: String })
  @Column({
    type: 'nvarchar',
    length: 100,
    nullable: false,
  })
  street: string;

  @ApiProperty({ type: String })
  @Column({
    type: 'nvarchar',
    length: 50,
    nullable: false,
  })
  city: string;

  @ApiProperty({ type: String })
  @Column({
    type: 'nvarchar',
    length: 50,
    nullable: false,
  })
  province: string;

  @ApiProperty({ type: String })
  @Column({
    type: 'nvarchar',
    length: 50,
    nullable: false,
  })
  postalCode: string;

  @ApiProperty({ type: String })
  @Column({
    type: 'nvarchar',
    length: 100,
    nullable: false,
  })
  country: string;

  @ApiProperty({ type: Number })
  @Column({
    type: 'decimal',
    precision: 10,
    scale: 7,
    default: 0,
    nullable: false,
  })
  latitude: number;

  @ApiProperty({ type: Number })
  @Column({
    type: 'decimal',
    precision: 10,
    scale: 7,
    default: 0,
    nullable: false,
  })
  longitude: number;

  @ApiProperty({ type: String })
  @Column({
    type: 'nvarchar',
    length: 250,
    nullable: false,
  })
  phone: string;

  @Column({ type: 'datetime2' })
  @CreateDateColumn()
  createdDate: Date;

  @Column({ type: 'datetime2' })
  @UpdateDateColumn()
  updatedDate: Date;

  @OneToMany(() => StoreHours, (storeHours) => storeHours.store, {
    eager: true,
    cascade: ['insert', 'update'],
    onDelete: 'CASCADE',
  })
  storeHours: StoreHours[];

  @OneToMany(() => StoreFeatures, (storeFeatures) => storeFeatures.store, {
    eager: true,
    cascade: ['insert', 'update'],
    onDelete: 'CASCADE',
  })
  storeFeatures: StoreFeatures[];
}
