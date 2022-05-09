interface IStores {
  store?: StoreEntity[] | null;
}
export interface StoreEntity {
  store_id: number;
  location_name: string;
  street_no: number;
  street: string;
  city: string;
  province: string;
  postal_code: string;
  country: string;
  geocode: Geocode;
  hours: Hours;
  phone_no: string;
  features: Features;
}
export interface Geocode {
  latitude: number;
  longitude: number;
}
export interface Hours {
  hour: Hour;
}
export interface Hour {
  hour_type: string;
  day?: DayEntity[] | null;
}
export interface DayEntity {
  week_day: string;
  from_hour: number;
  to_hour: number;
}
export interface Features {
  characteristic?: string[] | string | null;
}

export default IStores;

/**
 * 
 * @example
 * {
  "store": [
    {
      "store_id": 2002,
      "location_name": "QUEEN ST.",
      "street_no": 198,
      "street": "Queen St. E.",
      "city": "Brampton",
      "province": "ON",
      "postal_code": "L6V 1B7",
      "country": "CA",
      "geocode": {
        "latitude": 43.694022,
        "longitude": -79.751625
      },
      "hours": {
        "hour": {
          "hour_type": "Regular",
          "day": [
            {
              "week_day": "Mo",
              "from_hour": 1000,
              "to_hour": 2100
            },
            {
              "week_day": "Tu",
              "from_hour": 1000,
              "to_hour": 2100
            },
            {
              "week_day": "We",
              "from_hour": 1000,
              "to_hour": 2100
            },
            {
              "week_day": "Th",
              "from_hour": 1000,
              "to_hour": 2100
            },
            {
              "week_day": "Fr",
              "from_hour": 1000,
              "to_hour": 2100
            },
            {
              "week_day": "Sa",
              "from_hour": 1000,
              "to_hour": 2100
            },
            {
              "week_day": "Su",
              "from_hour": 1100,
              "to_hour": 1800
            }
          ]
        }
      },
      "phone_no": 9054514685,
      "features": {
        "characteristic": ["Ice cold express", "Retail"]
      }
    },
    {
      "store_id": 2004,
      "location_name": "AIRPORT ROAD",
      "street_no": 2890,
      "street": "Queen St. E.",
      "city": "Brampton",
      "province": "ON",
      "postal_code": "L6S 6E8",
      "country": "CA",
      "geocode": {
        "latitude": 43.742892,
        "longitude": -79.697299
      },
      "hours": {
        "hour": {
          "hour_type": "Regular",
          "day": [
            {
              "week_day": "Mo",
              "from_hour": 1000,
              "to_hour": 2100
            },
            {
              "week_day": "Tu",
              "from_hour": 1000,
              "to_hour": 2100
            },
            {
              "week_day": "We",
              "from_hour": 1000,
              "to_hour": 2100
            },
            {
              "week_day": "Th",
              "from_hour": 1000,
              "to_hour": 2100
            },
            {
              "week_day": "Fr",
              "from_hour": 1000,
              "to_hour": 2100
            },
            {
              "week_day": "Sa",
              "from_hour": 1000,
              "to_hour": 2100
            },
            {
              "week_day": "Su",
              "from_hour": 1100,
              "to_hour": 1800
            }
          ]
        }
      },
      "phone_no": 9057990007,
      "features": {
        "characteristic": ["Ice cold express", "Retail"]
      }
    },
    {
      "store_id": 2005,
      "location_name": "HEART LAKE",
      "street_no": 180,
      "street": "Sandalwood Pkwy.",
      "city": "Brampton",
      "province": "ON",
      "postal_code": "L6Z 1Y4",
      "country": "CA",
      "geocode": {
        "latitude": 43.728596,
        "longitude": -79.79461
      },
      "hours": {
        "hour": {
          "hour_type": "Regular",
          "day": [
            {
              "week_day": "Mo",
              "from_hour": 1000,
              "to_hour": 2100
            },
            {
              "week_day": "Tu",
              "from_hour": 1000,
              "to_hour": 2100
            },
            {
              "week_day": "We",
              "from_hour": 1000,
              "to_hour": 2100
            },
            {
              "week_day": "Th",
              "from_hour": 1000,
              "to_hour": 2100
            },
            {
              "week_day": "Fr",
              "from_hour": 1000,
              "to_hour": 2100
            },
            {
              "week_day": "Sa",
              "from_hour": 1000,
              "to_hour": 2100
            },
            {
              "week_day": "Su",
              "from_hour": 1200,
              "to_hour": 1700
            }
          ]
        }
      },
      "phone_no": 9058464450,
      "features": {
        "characteristic": ["Ice cold express", "Retail"]
      }
    }
  ]
}


 */
