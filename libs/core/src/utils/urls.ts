import { ApiVersion, ApiType } from '../interfaces/urls';
import { AxiosError } from 'axios';
import { Observable, of } from 'rxjs';
import * as appInsights from 'applicationinsights';

// export function getBigCommUrl(
//   apiVersion: ApiVersion,
//   apiType: ApiType,
//   queryStr?: string,
// ) {
//   return `${BIG_COMMERCE_BASE_URL}/stores/${
//     process.env.STORE_HASH
//   }/${apiVersion}/${apiType}${queryStr ? queryStr : ''}`;
// }

/**
 * checks if only permitted params in the query
 */
export const validateQueryParams = (
  permittedParams: string[],
  actualParams: string[],
) => {
  return actualParams.every((currentValue) =>
    permittedParams.includes(currentValue),
  );
};

export const createQuery = (params: any) => {
  const query = Object.keys(params)
    .map((k) => encodeURIComponent(k) + '=' + encodeURIComponent(params[k]))
    .join('&');
  return query;
};

/**
 *  header for http service
 */
export const serviceHeader = () => {
  return {
    headers: { 'x-auth-token': process.env.AUTH_TOKEN },
  };
};

export const handleError = <T>(result?: T) => {
  return (error: AxiosError<any>): Observable<T> => {
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      console.log('error1');
      console.log(error.response.data);
      console.log(error.response.status);
      console.log(error.response.headers);
    } else if (error.request) {
      // The request was made but no response was received
      // `error.request` is an instance of XMLHttpRequest in the browser and an instance of
      // http.ClientRequest in node.js
      console.log('error2');
      console.log(error.request);
    } else {
      // Something happened in setting up the request that triggered an Error
      console.log('error3');
      console.log('Error', error.message);
    }
    console.log(error.config);

    return of(result as T);
  };
};

export const orderStatus = () => {
  return {
    '1': 'Pending',
    '2': 'Shipped',
    '3': 'Partially Shipped',
    '4': 'Refunded',
    '5': 'Cancelled',
    '6': 'Declined',
    '7': 'Awaiting Payment',
    '8': 'Awaiting Pickup',
    '9': 'Awaiting Shipment',
    '10': 'Completed',
    '11': 'Awaiting Fulfillment',
    '12': 'Manual Verification Required',
    '13': 'Disputed',
    '14': 'Partially Refunded',
  };
};

export const get24HourTime = (timeString: string) => {
  const [time, modifier] = timeString.split(' ');

  // eslint-disable-next-line prefer-const
  let [hours, minutes] = time.split(':');

  if (hours === '12') {
    hours = '00';
  }

  if (modifier === 'PM') {
    hours = `${parseInt(hours, 10) + 12}`;
  }

  return { hours, minutes };
};

export const getISODateTime = (dateString: string, timeString: string) => {
  try {
    const { hours, minutes } = get24HourTime(timeString);
    const formattedDate = new Date(dateString);
    formattedDate.setHours(formattedDate.getHours() + +hours);
    formattedDate.setMinutes(formattedDate.getMinutes() + +minutes);
    console.log(formattedDate.toISOString());
    return formattedDate;
  } catch (err) {
    console.log('[getISODateTime]', err.message);
    return '';
  }
};

export enum SIGNINLOGS {
  LAST_SUCCESSFUL_LOGIN = 'Last Successful Login',
  LAST_UNSUCCESSFUL_LOGIN = 'Last Unsuccessful Login',
  ACCOUNT_LOCKED = 'Account Locked',
}

export const getDayText = {
  Mo: 'Monday',
  Tu: 'Tuesday',
  We: 'Wednesday',
  Th: 'Thursday',
  Fr: 'Friday',
  Sa: 'Saturday',
  Su: 'Sunday',
};

export const orderHeaders = [
  {
    heading: 'Unique Order ID',
    keyName: 'id',
  },
  {
    heading: 'Store Number',
    keyName: 'storeNumber',
  },
  {
    heading: 'Order Status Description',
    keyName: '',
  },
  {
    heading: 'Order Submitted Time',
    keyName: 'submittedDateTime',
  },
  // {
  //   heading: 'Order Submitted Date',
  //   keyName: 'submittedDate'
  // },
  {
    heading: 'Order Vector',
    keyName: 'order_vector',
  },
  {
    heading: 'Order Type',
    keyName: 'orderType',
  },
  {
    heading: 'Line Item',
    keyName: '',
  },
  {
    heading: 'Item SKU',
    keyName: 'sku',
  },
  {
    heading: 'Item Description',
    keyName: '',
  },
  {
    heading: 'Brewer',
    keyName: '',
  },
  {
    heading: 'Category',
    keyName: '',
  },
  {
    heading: 'Quantity',
    keyName: 'quantity',
  },
  {
    heading: 'Pack Size',
    keyName: 'packSize',
  },
  {
    heading: 'Volume',
    keyName: 'volume',
  },
  {
    heading: 'Container Type',
    keyName: 'container',
  },
  {
    heading: 'Item $ Total',
    keyName: 'items_total',
  },
  {
    heading: 'Item hL Total',
    keyName: '',
  },
  {
    heading: 'Available',
    keyName: '',
  },
  {
    heading: 'Customer ID',
    keyName: 'customer_id',
  },
  {
    heading: 'Email',
    keyName: 'customerEmail',
  },
  {
    heading: 'Postal Code',
    keyName: 'postalCode',
  },
  {
    heading: 'Delivery Fee',
    keyName: 'deliveryFee',
  },
  {
    heading: 'Delivery Fee HST',
    keyName: 'deliveryFeeHst',
  },
  {
    heading: 'Refunded',
    keyName: 'is_refunded',
  },
  {
    heading: 'Refund Amount',
    keyName: 'refund_amount',
  },
  {
    heading: 'Refund Reason',
    keyName: 'refundReason',
  },
  {
    heading: 'Utm Source',
    keyName: '',
  },
  {
    heading: 'Utm Medium',
    keyName: '',
  },
  {
    heading: 'Utm Campaign',
    keyName: '',
  },
  {
    heading: 'Utm Term',
    keyName: '',
  },
  {
    heading: 'Utm Content',
    keyName: '',
  },
  {
    heading: 'Pick Up Type',
    keyName: 'pickUpType',
  },
];

export const transactionReportHeader = [
  {
    heading: 'Unique ID',
    keyName: '',
  },
  {
    heading: 'Store Number',
    keyName: '',
  },
  {
    heading: 'Order Status Description',
    keyName: '',
  },
  {
    heading: 'Submitted Date Time',
    keyName: '',
  },
  // {
  //     heading: 'Submitted Date',
  //     keyName: ''
  // },
  {
    heading: 'Order Vector',
    keyName: '',
  },
  {
    heading: 'Order Type',
    keyName: '',
  },
  {
    heading: 'Transaction Amount',
    keyName: '',
  },
  {
    heading: 'Product Total',
    keyName: '',
  },
  {
    heading: 'Delivery Fee',
    keyName: '',
  },
  {
    heading: 'Delivery Fee HST',
    keyName: '',
  },
  {
    heading: 'Grand Total',
    keyName: '',
  },
  {
    heading: 'Volume Total hL',
    keyName: '',
  },
  {
    heading: 'Single Units',
    keyName: '',
  },
  {
    heading: '2-6 Pack Units',
    keyName: '',
  },
  {
    heading: '8-18 Pack Units',
    keyName: '',
  },
  {
    heading: '24+ Pack Units',
    keyName: '',
  },
  {
    heading: 'Open Date Time',
    keyName: '',
  },
  {
    heading: 'Pick Up Ready Date Time',
    keyName: '',
  },
  {
    heading: 'Partial Order',
    keyName: '',
  },
  {
    heading: 'Completed By Emp ID',
    keyName: '',
  },
  {
    heading: 'Completed Date Time',
    keyName: '',
  },
  {
    heading: 'ID Checked',
    keyName: '',
  },
  {
    heading: 'Cancelled By Emp ID',
    keyName: '',
  },
  {
    heading: 'Cancelled Date Time',
    keyName: '',
  },
  {
    heading: 'Cancel Reason',
    keyName: '',
  },
  {
    heading: 'Cancelled By Customer',
    keyName: '',
  },
  {
    heading: 'Cancelled By Driver',
    keyName: '',
  },
  {
    heading: 'Requested Pick Up Time',
    keyName: '',
  },
  {
    heading: 'CC Type',
    keyName: '',
  },
  {
    heading: 'CCLast Four Number',
    keyName: '',
  },
  {
    heading: 'Customer Name',
    keyName: '',
  },
  {
    heading: 'Customer Type',
    keyName: '',
  },
  {
    heading: 'Customer Email',
    keyName: '',
  },
  {
    heading: 'Postal Code',
    keyName: '',
  },
  {
    heading: 'Browser Version',
    keyName: '',
  },
  {
    heading: 'Delivery Type',
    keyName: '',
  },
  {
    heading: 'Delivery ETA',
    keyName: '',
  },
  {
    heading: 'Delivery Scheduled date/time',
    keyName: '',
  },
  {
    heading: 'Refunded',
    keyName: '',
  },
  {
    heading: 'Refund Amount',
    keyName: '',
  },
  {
    heading: 'Refund Reason',
    keyName: '',
  },
  {
    heading: 'Deliver ID',
    keyName: '',
  },
  {
    heading: 'Deliver Name',
    keyName: '',
  },
  {
    heading: 'Delivered Date',
    keyName: '',
  },
  {
    heading: 'Delivery Address',
    keyName: '',
  },
  {
    heading: 'Delivery City',
    keyName: '',
  },
  {
    heading: 'Delivery Postal Code',
    keyName: '',
  },
  {
    heading: 'Pick Up Type',
    keyName: '',
  },
  {
    heading: 'Customer Date Of Birth',
    keyName: '',
  },
  {
    heading: 'Customer Salutation',
    keyName: '',
  },
];

// export const appInsightslog = (
//   name: string,
//   properties: any,
//   appInsightsKey: string,
// ) => {
//   // this.configService.get('appInsights').instrumentationKey
//   appInsights
//     .setup(appInsightsKey)
//     .setAutoDependencyCorrelation(true)
//     .setAutoCollectRequests(true)
//     .setAutoCollectPerformance(true, true)
//     .setAutoCollectExceptions(true)
//     .setAutoCollectDependencies(true)
//     .setAutoCollectConsole(true)
//     .setUseDiskRetryCaching(true)
//     .setSendLiveMetrics(true)
//     .setDistributedTracingMode(appInsights.DistributedTracingModes.AI)
//     .start();
//   const client = appInsights.defaultClient;
//   client.trackEvent({
//     name: name,
//     properties: properties,
//   });
// };

export const orderStatusWithId: {
  id: string;
  name: string;
  actualId: number;
}[] = [
  { id: '0', name: 'All', actualId: 0 },
  { id: '3', name: 'Completed', actualId: 10 },
  { id: '5', name: 'Customer Cancel', actualId: 5 },
  { id: '8', name: 'In Progress', actualId: 11 },
  { id: '9', name: 'On the way', actualId: 3 },
  // { id: "1", name: "Open", actualId: 11 },
  { id: '2', name: 'Pickup Ready', actualId: 8 },
  { id: '4', name: 'Store Cancel', actualId: 5 },
  // { id: "6", name: "Auto Cancel",  actualId: 5 },
  // { id: "7", name: "POS Entered",  actualId: 5 },
];

export const mapOrderById = (id, cancelledByCustomer, cancelledByStore) => {
  try {
    if (+id === 9) {
      return 'Pickup Ready';
    }
    // if (+id === 6) {
    //   return "Cancelled";
    // }
    if (+id === 5) {
      if (cancelledByCustomer) {
        return 'Cancelled by Customer';
      } else if (cancelledByStore) {
        return 'Cancelled by Store';
      }
      return 'Cancelled by Store';
      // return isNaN(cancellationBy) ? cancellationBy : "Cancelled by Store";
    }
    const { name } = orderStatusWithId.find((order) => +order.actualId === id);
    return name;
  } catch (err) {
    return '';
  }
};

export const generateCharacterFromNumber = (number) => {
  const baseChar = 'A'.charCodeAt(0);
  let letters = '';
  do {
    number -= 1;
    letters = String.fromCharCode(baseChar + (number % 26)) + letters;
    number = (number / 26) >> 0;
  } while (number > 0);

  return letters;
};

export const addHeadersToSheet = (sheetArg, type) => {
  const sheetHeader = type === 'order' ? orderHeaders : transactionReportHeader;
  sheetHeader.forEach((header, index) => {
    const string = generateCharacterFromNumber(index + 1) + '1';
    sheetArg.cell(string).value(header.heading);
  });
  return sheetArg;
};

export const titleCase = (str) => {
  try {
    const splitStr = str?.toLowerCase()?.split(' ');
    for (let i = 0; i < splitStr.length; i++) {
      splitStr[i] =
        splitStr[i].charAt(0).toUpperCase() + splitStr[i].substring(1);
    }
    return splitStr.join(' ');
  } catch (err) {
    return str;
  }
};

export const reportName = (reportNameStr: string) => {
  try {
    const today = new Date();
    const mm = today.getMonth() + 1; // Months start at 0!
    const dd = today.getDate();
    const formatDateTime = `${today.getFullYear()}_${`${mm}`.padStart(
      2,
      '0',
    )}_${`${dd}`.padStart(
      2,
      '0',
    )}-${today.getHours()}_${today.getMinutes()}_${today.getSeconds()}-${reportNameStr}`;
    return formatDateTime;
  } catch (err) {
    return reportNameStr;
  }
};

export const option: { id: string; name: string; value: string }[] = [
  { id: '1', name: 'Transaction Report', value: 'transaction' },
  { id: '2', name: 'Order Report', value: 'order' },
];
