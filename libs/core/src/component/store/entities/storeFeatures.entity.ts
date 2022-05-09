import { ApiProperty } from '@nestjs/swagger';
import {
  Column,
  Entity,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Store } from './store.entity';

@Entity()
export class StoreFeatures {
  @ApiProperty({ type: Number })
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty({ type: String })
  @Column({
    type: 'nvarchar',
    length: 250,
    nullable: false,
  })
  feature: string;

  @ManyToOne(() => Store, (store) => store.storeFeatures, {
    onDelete: 'CASCADE',
  })
  store: Store;
}
