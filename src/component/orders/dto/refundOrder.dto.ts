import { ApiProperty } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsOptional, IsNumber, MinLength, MaxLength, ValidateNested } from "class-validator";

export class Products {

    @ApiProperty({ type: Number })
    @IsOptional()
    @IsNumber()
    id: number;

    @ApiProperty({ type: String })
    @IsOptional()
    @MinLength(1)
    @MaxLength(99)
    name: string;

    @ApiProperty({ type: Number })
    @IsOptional()
    @IsNumber()
    refundQty: number;

    @ApiProperty({ type: Number })
    @IsOptional()
    @IsNumber()
    originalQty: number;

    @ApiProperty({ type: String })
    @IsOptional()
    @MinLength(1)
    @MaxLength(99)
    sku: string;

    @ApiProperty({ type: Number })
    @IsOptional()
    @IsNumber()
    productId: number;

}
export class RefundOrderDto {
    @Type(() => Products)
    @IsOptional()
    @ValidateNested()
    readonly products?: Products[];
}