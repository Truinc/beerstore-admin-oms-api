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
