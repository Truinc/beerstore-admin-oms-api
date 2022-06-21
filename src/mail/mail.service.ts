import { MailerService } from '@nestjs-modules/mailer';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class MailService {
    templateNames = {
        ORDER_CREATED: "order_created",
        ORDER_CANCELLED: "order_cancelled",
        ORDER_CONFIRMED: "order_confirmed",
        ORDER_COMPLETED: "order_completed",
        ORDER_INTRANSIT: "order_intransit",
    };

    mailSubjects = {
        ORDER_CREATED: "We have received your order!",
        ORDER_CANCELLED: "Your order has been cancelled!",
        ORDER_CONFIRMED: "Your order has been confirmed!",
        ORDER_COMPLETED: "Your order has been completed!",
        ORDER_INTRANSIT: "Your beer is on the way!",
    };

    constructor(
        private mailerService: MailerService,
        private configService: ConfigService
    ) { }

    async orderCreated(data) {
        return this.mailerService.sendMail({
            to: data.to,
            subject: this.mailSubjects.ORDER_CREATED,
            template: this.templateNames.ORDER_CREATED,
            context: {
                orderDetails: data.orderDetails,
                orderProductDetails: data.orderProductDetails,
                siteBaseUrl: this.configService.get('mail').site_base_url
            }
        });
    }

    async orderConfirmed(data) {
        return this.mailerService.sendMail({
            to: data.to,
            subject: this.mailSubjects.ORDER_CONFIRMED,
            template: this.templateNames.ORDER_CONFIRMED,
            context: {
                orderDetails: data.orderDetails,
                orderProductDetails: data.orderProductDetails,
                siteBaseUrl: this.configService.get('mail').site_base_url
            }
        });
    }

    async orderCancelled(data) {
        return this.mailerService.sendMail({
            to: data.to,
            subject: this.mailSubjects.ORDER_CANCELLED,
            template: this.templateNames.ORDER_CANCELLED,
            context: {
                orderDetails: data.orderDetails,
                orderProductDetails: data.orderProductDetails,
                siteBaseUrl: this.configService.get('mail').site_base_url
            }
        });
    }

    async orderCompleted(data) {
        return this.mailerService.sendMail({
            to: data.to,
            subject: this.mailSubjects.ORDER_COMPLETED,
            template: this.templateNames.ORDER_COMPLETED,
            context: {
                orderDetails: data.orderDetails,
                orderProductDetails: data.orderProductDetails,
                siteBaseUrl: this.configService.get('mail').site_base_url
            }
        });
    }

    async orderInTransit(data) {
        return this.mailerService.sendMail({
            to: data.to,
            subject: this.mailSubjects.ORDER_INTRANSIT,
            template: this.templateNames.ORDER_INTRANSIT,
            context: {
                orderDetails: data.orderDetails,
                orderProductDetails: data.orderProductDetails,
                siteBaseUrl: this.configService.get('mail').site_base_url
            }
        });
    }
}
