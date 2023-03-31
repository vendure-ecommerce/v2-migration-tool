import { INestApplication } from "@nestjs/common";
import { populate } from "@vendure/core/cli";
import {
    Administrator,
    bootstrap,
    Customer,
    CustomerService,
    EntityHydrator,
    FulfillmentService,
    isGraphQlErrorResult,
    orderPercentageDiscount,
    OrderService,
    PromotionService,
    RequestContextService,
    ShippingMethod,
    ShippingMethodService,
    TransactionalConnection,
    VendureConfig,
} from "@vendure/core";
import { createConnection } from "typeorm";
import path from "path";
import { config } from "./vendure-config";
import {
    discountOnItemWithFacets
} from "@vendure/core/dist/config/promotion/actions/facet-values-percentage-discount-action";

if (require.main === module) {
    populateTestData(config)
        .then(() => {
            console.log(`Done.`);
            process.exit(0);
        })
        .catch((err) => {
            console.error(err);
            process.exit(1);
        });
}

/**
 * @description
 * This function is responsible for populating the DB with test data on the first run. It
 * first checks to see if the configured DB has any tables, and if not, runs the `populate()`
 * function using data from the @vendure/create package.
 */
export async function populateTestData(config: VendureConfig) {
    console.log(`Dropping all tables...`);
    await dropAllTables(config);
    console.log(`Populating initial data and products...`);
    const app = await populate(
        () =>
            bootstrap({
                ...config,
                importExportOptions: {
                    importAssetsDir: path.join(
                        require.resolve("@vendure/create/assets/products.csv"),
                        "../images"
                    ),
                },
                dbConnectionOptions: {
                    ...config.dbConnectionOptions,
                    synchronize: true,
                },
            }),
        require("@vendure/create/assets/initial-data.json"),
        require.resolve("@vendure/create/assets/products.csv")
    );
    console.log(`Creating a Promotion...`);
    await createPromotions(app);
    console.log(`Creating a Customer...`);
    await createCustomer(app);
    console.log(`Creating an Order...`);
    await createOrder(app);
}

async function createPromotions(app: INestApplication) {
    const ctx = await getAdminRequestContext(app);
    const promotionService = app.get(PromotionService);
    await promotionService.createPromotion(ctx, {
        name: "Test Promotion",
        enabled: true,
        conditions: [],
        actions: [
            {
                code: orderPercentageDiscount.code,
                arguments: [{ name: "discount", value: "10" }],
            },
        ],
        couponCode: "TEST",
    });
    await promotionService.createPromotion(ctx, {
        name: "Test Promotion 2",
        enabled: true,
        conditions: [],
        actions: [
            {
                code: discountOnItemWithFacets.code,
                arguments: [
                    { name: "discount", value: "5" },
                    { name: "facets", value: "[5]" }],
            },
        ],
        couponCode: "TEST2",
    });
}

async function createCustomer(app: INestApplication) {
    const ctx = await getAdminRequestContext(app);
    const customerService = app.get(CustomerService);
    await customerService.create(
        ctx,
        {
            firstName: "Test",
            lastName: "User",
            emailAddress: "test@user.com",
        },
        "test"
    );
}

async function createOrder(app: INestApplication) {
    const ctx = await getShopRequestContext(app);
    const orderService = app.get(OrderService);
    const order = await orderService.create(ctx, ctx.activeUserId);
    await orderService.addItemToOrder(ctx, order.id, 1, 1);
    await orderService.addItemToOrder(ctx, order.id, 6, 2);
    await orderService.addItemToOrder(ctx, order.id, 8, 2);
    await orderService.applyCouponCode(ctx, order.id, "TEST");
    await orderService.applyCouponCode(ctx, order.id, "TEST2");
    await orderService.setShippingAddress(ctx, order.id, {
        fullName: "Test User",
        company: "Test Company",
        streetLine1: "Test Street 1",
        streetLine2: "Test Street 2",
        city: "Test City",
        province: "Test Province",
        postalCode: "12345",
        countryCode: "DE",
        phoneNumber: "123456789",
    });
    const shippingMethods = await orderService.getEligibleShippingMethods(
        ctx,
        order.id
    );
    await orderService.setShippingMethod(ctx, order.id, shippingMethods[0].id);
    await orderService.transitionToState(ctx, order.id, "ArrangingPayment");
    const paymentMethods = await orderService.getEligiblePaymentMethods(
        ctx,
        order.id
    );
    const payment = await orderService.addPaymentToOrder(ctx, order.id, {
        method: paymentMethods[0].code,
        metadata: {},
    });

    if (isGraphQlErrorResult(payment)) {
        throw new Error(payment.message);
    }

    const adminCtx = await getAdminRequestContext(app);
    if (!isGraphQlErrorResult(payment)) {
        await orderService.settlePayment(adminCtx, payment.id);
    }
    const order2 = await orderService.findOne(ctx, order.id);
    // create a cancellation & refund
    const cancelResult = await orderService.cancelOrder(ctx, {
        orderId: order2!.id,
        lines: [
            {
                orderLineId: order2!.lines[0].id,
                quantity: 1,
            },
        ],
    });
    if (isGraphQlErrorResult(cancelResult)) {
        throw new Error(cancelResult.message);
    }
    const refundResult = await orderService.refundOrder(adminCtx, {
        lines: [
            {
                orderLineId: order2!.lines[0].id,
                quantity: 1,
            },
        ],
        paymentId: payment.id,
        shipping: 0,
        adjustment: 0,
        reason: "test",
    });
    if (isGraphQlErrorResult(refundResult)) {
        throw new Error(refundResult.message);
    }
    await orderService.settleRefund(adminCtx, {
        id: refundResult.id,
        transactionId: "REF-123",
    });

    // create a modification
    await orderService.transitionToState(adminCtx, order2!.id, "Modifying");
    const modifyResult = await orderService.modifyOrder(adminCtx, {
        orderId: order2!.id,
        adjustOrderLines: [
            {
                orderLineId: order2!.lines[1].id,
                quantity: 1,
            },
        ],
        note: "test",
        refund: {
            paymentId: payment.id,
            reason: "test",
        },
        dryRun: false,
    });
    if (isGraphQlErrorResult(modifyResult)) {
        throw new Error(modifyResult.message);
    }
    await app
        .get(EntityHydrator)
        .hydrate(adminCtx, modifyResult, { relations: ["payments.refunds"] });
    const refund = await orderService.settleRefund(adminCtx, {
        id: modifyResult.payments[0].refunds.find((r) => r.state === "Pending")!
            .id,
        transactionId: "REF-123",
    });
    if (refund.state !== "Settled") {
        console.log(refund);
    }
    const transitionToPaymentSettledResult =
        await orderService.transitionToState(
            adminCtx,
            order2!.id,
            "PaymentSettled"
        );
    if (isGraphQlErrorResult(transitionToPaymentSettledResult)) {
        console.log(JSON.stringify(transitionToPaymentSettledResult, null, 2));
        throw new Error(transitionToPaymentSettledResult.message);
    }

    // create a fulfillment
    const fulfillmentHandlers = app
        .get(ShippingMethodService)
        .getFulfillmentHandlers(adminCtx);
    const fulfillResult = await orderService.createFulfillment(adminCtx, {
        lines: [
            {
                orderLineId: order2!.lines[2].id,
                quantity: order2!.lines[2].quantity,
            },
        ],
        handler: {
            code: fulfillmentHandlers[0].code,
            arguments: [
                {
                    name: "trackingCode",
                    value: "123456789",
                },
                {
                    name: "method",
                    value: "UPS",
                },
            ],
        },
    });
    if (isGraphQlErrorResult(fulfillResult)) {
        console.log(JSON.stringify(fulfillResult, null, 2));
        throw new Error(fulfillResult.message);
    }
}

async function getAdminRequestContext(app: INestApplication) {
    const superAdmin = await app
        .get(TransactionalConnection)
        .rawConnection.getRepository(Administrator)
        .findOne({
            where: {
                emailAddress: process.env.SUPERADMIN_USERNAME,
            },
            relations: ["user"],
        });
    return app.get(RequestContextService).create({
        apiType: "admin",
        user: superAdmin?.user,
    });
}

async function getShopRequestContext(app: INestApplication) {
    const customers = await app
        .get(TransactionalConnection)
        .rawConnection.getRepository(Customer)
        .find({
            relations: ["user"],
            order: {
                id: "ASC",
            },
        });
    return app.get(RequestContextService).create({
        apiType: "shop",
        user: customers[0]?.user,
    });
}

// https://stackoverflow.com/a/21247009/772859
async function dropAllTables(config: VendureConfig) {
    const connection = await createConnection(config.dbConnectionOptions);
    const schema = process.env.DB_SCHEMA || "public";
    await connection.query(`
        DROP SCHEMA ${schema} CASCADE;
        CREATE SCHEMA ${schema};
        GRANT ALL ON SCHEMA ${schema} TO ${process.env.DB_USERNAME};
        COMMENT ON SCHEMA ${schema} IS 'standard public schema';`);
    await connection.close();
}
