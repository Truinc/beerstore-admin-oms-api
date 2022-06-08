import { ApiProperty } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsIn, IsNumber, IsOptional } from "class-validator";

export class GetOrderDto {
    @ApiProperty({ type: Number, description: '1 => Transaction Report, 2 => Order Report' })
    @IsNumber()
    @IsIn([1, 2])
    @Type(() => Number)
    reportType: number;

    @ApiProperty({ type: Number, required: false, description: '1 => "Pending", 2 => "In Transit (shipped)", 3 => "In Transit (Partially Shipped)", 4 => "Refunded", 5 => "Cancelled", 6 => "Returned (Declined)", 7 => "Awaiting Payment", 8 => "Awaiting Pickup", 9 => "Awaiting Delivery (Awaiting Shipment)", 10 => "Completed", 11 => "Awaiting Fulfillment", 12 => "Manual Verification Required", 13 => "Disputed", 14 => "Partially Refunded"' })
    @IsNumber()
    @IsIn([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14])
    @Type(() => Number)
    @IsOptional()
    status_id: number;

    @ApiProperty({ type: Number, required: false, description: 'store id of store i.e. 12321' })
    @IsNumber()
    @Type(() => Number)
    @IsOptional()
    store_id: number;

    @ApiProperty({ type: Date, description: 'Minimum date the order was created i.e. 2021-04-20' })
    min_date_created: Date;

    @ApiProperty({ type: Date, description: 'Maximum date the order was created i.e. 2022-04-20' })
    max_date_created: Date;

    @ApiProperty({ type: String, required: false, description: 'eg website, app, kiosk etc' })
    @IsOptional()
    @IsIn(['app', 'website', 'kiosk'])
    vector: string;

    @ApiProperty({ type: String, required: false, description: 'manufacturer of beer' })
    @IsOptional()
    brewer: string;
}