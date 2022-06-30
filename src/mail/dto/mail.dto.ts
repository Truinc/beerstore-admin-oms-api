

interface OrderDetails {
    customerName: string;
    orderNumber: number,
    orderDate: string;
    paymentMethod: string;
    totalCost: string;
    deliverydate: string;
    deliveryLocation: string;
    deliveryEstimatedTime: string;
    subTotal: string;
    deliveryCharge: string;
    deliveryFeeHST: string;
    grandTotal: string;
    totalSavings: string;
    saleSavings: string;
    cancellationReason?: string;
    refundedAmt?: string;
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