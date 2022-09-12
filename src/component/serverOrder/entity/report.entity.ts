import { ApiProperty } from '@nestjs/swagger';
import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity()
export class ReportStatusEntity {
  @ApiProperty({ type: Number })
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty({ type: String })
  @Column({
    type: 'nvarchar',
    length: 150,
    nullable: false,
    unique: true,
  })
  reportId: string;

  @ApiProperty({ type: Number })
  @Column({
    type: 'int',
    default: 0,
    nullable: false,
  })
  reportStatus: number; //0-> in process, 1-> ready, 2-> failed

  @ApiProperty({ type: String })
  @Column({
    type: 'nvarchar',
    length: 350,
    nullable: true,
  })
  reportUrl: string;

  @Column({ type: 'datetime2' })
  @CreateDateColumn()
  createdDate: Date;

  @Column({ type: 'datetime2' })
  @UpdateDateColumn()
  updatedDate: Date;
}
