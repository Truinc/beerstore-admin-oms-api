import { ApiProperty, PickType } from '@nestjs/swagger';

export class BeerCategory {
  @ApiProperty({ type: Number })
  id: number;
  @ApiProperty({ type: Number })
  parent_id: number;
  @ApiProperty({ type: String })
  name: string;
  @ApiProperty({ type: String })
  description: string;
  @ApiProperty({ type: Number })
  views: number;
  @ApiProperty({ type: Number })
  sort_order: number;
  @ApiProperty({ type: String })
  page_title: string;
  @ApiProperty({ type: Array })
  meta_keywords?: string[] | null;
  @ApiProperty({ type: String })
  meta_description: string;
  @ApiProperty({ type: String })
  layout_file: string;
  @ApiProperty({ type: String })
  image_url: string;
  @ApiProperty({ type: Boolean })
  is_visible: boolean;
  @ApiProperty({ type: Number })
  search_keywords: string;
  @ApiProperty({ type: String })
  default_product_sort: string;
  @ApiProperty({ type: Object })
  custom_url: CustomUrl;
  @ApiProperty({ type: String })
  display: string;
  @ApiProperty({ type: Boolean })
  popular?: boolean;
}

export class LightBeerCategory extends PickType(BeerCategory, [
  'id',
  'name',
  'display',
  'meta_description',
] as const) {}
{
}
export interface CustomUrl {
  url: string;
  is_customized: boolean;
}

/**
 * @info beer category object
 * 
 * {
        "id": 329,
        "parent_id": 0,
        "name": "CA~country",
        "description": "",
        "views": 0,
        "sort_order": 45,
        "page_title": "",
        "meta_keywords": [
          ""
        ],
        "meta_description": "country",
        "layout_file": "",
        "image_url": "",
        "is_visible": true,
        "search_keywords": "",
        "default_product_sort": "use_store_settings",
        "custom_url": {
          "url": "/ca-country/",
          "is_customized": false
        },
        "display": "CA"
      },
 * 
 */
