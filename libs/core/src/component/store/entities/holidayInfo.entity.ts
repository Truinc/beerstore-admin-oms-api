import { ApiProperty } from '@nestjs/swagger';
import { Column, Entity, PrimaryGeneratedColumn, ManyToOne } from 'typeorm';
import { HolidayHours } from './holidayHrs.entity';

@Entity()
export class HolidayInfo {
  constructor(
    storeId: number,
    group: number,
    startDate: Date,
    holidayName: string,
    openHours: number,
    closeHours: number,
    message: string,
  ) {
    this.group = group;
    this.storeId = storeId;
    this.startDate = startDate;
    this.holidayName = holidayName;
    this.openHours = openHours;
    this.closeHours = closeHours;
    this.message = message;
  }
  @ApiProperty({ type: Number })
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty({ type: Number })
  @Column({ type: 'smallint', default: 1 })
  group: number;

  @ApiProperty({ type: Boolean })
  @Column({ type: 'smallint', nullable: false })
  storeId: number;

  @ApiProperty({ type: Date })
  @Column({ type: 'date', nullable: false })
  startDate: Date;

  @ApiProperty({ type: String })
  @Column({
    type: 'nvarchar',
    length: 250,
    nullable: false,
  })
  holidayName: string;

  @ApiProperty({ type: Number })
  @Column({ type: 'int', nullable: false })
  openHours: number;

  @ApiProperty({ type: Number })
  @Column({ type: 'int', nullable: false })
  closeHours: number;

  @ApiProperty({ type: String })
  @Column({
    type: 'nvarchar',
    length: 350,
    nullable: false,
  })
  message: string;

  @ManyToOne(() => HolidayHours, (holidayHours) => holidayHours.holidayInfo, {
    cascade: ['insert', 'update'],
    onDelete: 'CASCADE',
  })
  holidayHour: HolidayHours;
}
