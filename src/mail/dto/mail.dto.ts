

interface OrderDetails {
    customerName: string;
    orderNumber: number,
    orderDate: string;
    paymentMethod: string;
    totalCost: number;
    deliverydate: string;
    deliveryLocation: string;
    deliveryEstimatedTime: string;
    subTotal: number;
    deliveryCharge: number;
    deliveryFeeHST: number;
    grandTotal: number;
    totalSavings: number;
    saleSavings: number;
    cancellationReason?: string;
    refundedAmt?: number;
    refunded?: boolean;
}

interface OrderProductDetails {
    imageUrl: string;
    name: string;
    displayValue: string;
    quantity: number;
    productSubTotal: number;
    price: number;
    salePrice: number;
    onSale: boolean;
    isRefunded?: boolean;
    refundedQty?: number;
    refundedAmt?: number;
}

export class MailDto {
    to: string;
    orderDetails: OrderDetails;
    orderProductDetails: OrderProductDetails[]
}