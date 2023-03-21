import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { SimpleGraphQLClient, testConfig } from "@vendure/testing";
import { INestApplication } from "@nestjs/common";
import { bootstrap, mergeConfig } from "@vendure/core";
import { config } from "../src/vendure-config";
import gql from "graphql-tag";

describe("migration tests", () => {
    const isVendureV2 =
        require("../package.json").dependencies["@vendure/core"].startsWith(
            "2"
        );
    const adminApiUrl = `http://localhost:${config.apiOptions.port}/${config.apiOptions.adminApiPath}`;
    let server: INestApplication;
    const adminClient = new SimpleGraphQLClient(
        mergeConfig(testConfig, config),
        adminApiUrl
    );
    beforeAll(async () => {
        server = await bootstrap(config);
        await adminClient.asSuperAdmin();
    }, 60000);

    afterAll(async () => {
        await server?.close();
    });

    // https://github.com/vendure-ecommerce/vendure/commit/dada24398dad8e739de590afaea7a4eb49ed3de4
    it("Promotion name", async () => {
        const { promotions } = await adminClient.query(gql`
            query {
                promotions {
                    items {
                        id
                        name
                    }
                }
            }
        `);
        expect(promotions.items).toEqual([
            {
                id: "1",
                name: "Test Promotion",
            },
        ]);
    });

    // https://github.com/vendure-ecommerce/vendure/commit/2a4b3bc478f364bf055a0db75955efbe9720109f
    it("PaymentMethod name & description", async () => {
        const { paymentMethods } = await adminClient.query(gql`
            query {
                paymentMethods {
                    items {
                        id
                        name
                        description
                    }
                }
            }
        `);
        expect(paymentMethods.items).toEqual([
            {
                id: "1",
                name: "Standard Payment",
                description: "",
            },
        ]);
    });

    // https://github.com/vendure-ecommerce/vendure/commit/24e558b04ec6c54b7a8ff0d2b384806aeb6b4fb6
    it("Channel currencyCode", async () => {
        if (isVendureV2) {
            const { channels } = await adminClient.query(gql`
                query {
                    channels {
                        id
                        defaultCurrencyCode
                    }
                }
            `);
            expect(channels).toEqual([
                {
                    id: "1",
                    defaultCurrencyCode: "USD",
                },
            ]);
        } else {
            const { channels } = await adminClient.query(gql`
                query {
                    channels {
                        id
                        currencyCode
                    }
                }
            `);
            expect(channels).toEqual([
                {
                    id: "1",
                    currencyCode: "USD",
                },
            ]);
        }
    });

    // https://github.com/vendure-ecommerce/vendure/commit/905c1dfb4fbe16086e6d69c08ed145ead3a53f8c
    it("ProductVariant stock levels", async () => {
        const { productVariants } = await adminClient.query(gql`
            query {
                productVariants(options: { take: 10, sort: { id: ASC } }) {
                    items {
                        id
                        stockOnHand
                        stockAllocated
                    }
                }
            }
        `);
        expect(productVariants.items).toEqual([
            { id: "1", stockOnHand: 100, stockAllocated: 0 },
            { id: "2", stockOnHand: 100, stockAllocated: 0 },
            { id: "3", stockOnHand: 100, stockAllocated: 0 },
            { id: "4", stockOnHand: 100, stockAllocated: 0 },
            { id: "5", stockOnHand: 100, stockAllocated: 0 },
            { id: "6", stockOnHand: 100, stockAllocated: 1 },
            { id: "7", stockOnHand: 100, stockAllocated: 0 },
            { id: "8", stockOnHand: 98, stockAllocated: 0 },
            { id: "9", stockOnHand: 100, stockAllocated: 0 },
            { id: "10", stockOnHand: 100, stockAllocated: 0 },
        ]);

        if (isVendureV2) {
            const { productVariants } = await adminClient.query(gql`
                query {
                    productVariants(
                        options: {
                            filter: { id: { in: ["6", "8"] } }
                            sort: { id: ASC }
                        }
                    ) {
                        items {
                            id
                            stockOnHand
                            stockAllocated
                            stockLevels {
                                stockLocationId
                                stockAllocated
                                stockOnHand
                            }
                        }
                    }
                }
            `);
            expect(productVariants.items).toEqual([
                {
                    id: "6",
                    stockOnHand: 100,
                    stockAllocated: 1,
                    stockLevels: [
                        {
                            stockLocationId: "1",
                            stockAllocated: 1,
                            stockOnHand: 100,
                        },
                    ],
                },
                {
                    id: "8",
                    stockOnHand: 98,
                    stockAllocated: 0,
                    stockLevels: [
                        {
                            stockLocationId: "1",
                            stockAllocated: 0,
                            stockOnHand: 98,
                        },
                    ],
                },
            ]);
        }
    });

    // https://github.com/vendure-ecommerce/vendure/commit/8e5fb2aad43d79712ee8c57c51581cc0f49c7843
    it("order totals", async () => {
        const { order } = await adminClient.query(gql`
            query {
                order(id: "1") {
                    id
                    subTotal
                    subTotalWithTax
                    shipping
                    shippingWithTax
                    total
                    totalWithTax
                    lines {
                        id
                        unitPrice
                        unitPriceWithTax
                        linePrice
                        linePriceWithTax
                        quantity
                        taxLines {
                            description
                            taxRate
                        }
                        discounts {
                            adjustmentSource
                            amount
                            description
                            type
                        }
                    }
                }
            }
        `);
        expect(order).toEqual({
            id: "1",
            subTotal: 98075,
            subTotalWithTax: 117690,
            shipping: 500,
            shippingWithTax: 500,
            total: 98575,
            totalWithTax: 118190,
            lines: [
                {
                    id: "1",
                    unitPrice: 129900,
                    unitPriceWithTax: 155880,
                    linePrice: 0,
                    linePriceWithTax: 0,
                    quantity: 0,
                    taxLines: [
                        {
                            description: "Standard Tax Europe",
                            taxRate: 20,
                        },
                    ],
                    discounts: [],
                },
                {
                    id: "2",
                    unitPrice: 44500,
                    unitPriceWithTax: 53400,
                    linePrice: 44500,
                    linePriceWithTax: 53400,
                    quantity: 1,
                    taxLines: [
                        {
                            description: "Standard Tax Europe",
                            taxRate: 20,
                        },
                    ],
                    discounts: [
                        {
                            adjustmentSource: "PROMOTION:1",
                            amount: -2225,
                            description: "Test Promotion",
                            type: "DISTRIBUTED_ORDER_PROMOTION",
                        },
                    ],
                },
                {
                    id: "3",
                    unitPrice: 31000,
                    unitPriceWithTax: 37200,
                    linePrice: 62000,
                    linePriceWithTax: 74400,
                    quantity: 2,
                    taxLines: [
                        {
                            description: "Standard Tax Europe",
                            taxRate: 20,
                        },
                    ],
                    discounts: [
                        {
                            adjustmentSource: "PROMOTION:1",
                            amount: -6200,
                            description: "Test Promotion",
                            type: "DISTRIBUTED_ORDER_PROMOTION",
                        },
                    ],
                },
            ],
        });
    });

    // https://github.com/vendure-ecommerce/vendure/commit/8e5fb2aad43d79712ee8c57c51581cc0f49c7843
    it("order fulfillments", async () => {
        if (isVendureV2) {
            const { order } = await adminClient.query(gql`
                query {
                    order(id: "1") {
                        fulfillmentLines {
                            fulfillment {
                                id
                                method
                                state
                                trackingCode
                            }
                            orderLineId
                            quantity
                        }
                    }
                }
            `);
            expect(order.fulfillmentLines).toEqual([
                {
                    fulfillment: {
                        id: "1",
                        method: "UPS",
                        state: "Pending",
                        trackingCode: "123456789",
                    },
                    orderLineId: "3",
                    quantity: 2,
                },
            ]);
        } else {
            const { order } = await adminClient.query(gql`
                query {
                    order(id: "1") {
                        fulfillments {
                            id
                            method
                            state
                            trackingCode
                            orderItems {
                                id
                            }
                        }
                    }
                }
            `);
            expect(order.fulfillments).toEqual([
                {
                    id: "1",
                    method: "UPS",
                    state: "Pending",
                    trackingCode: "123456789",
                    orderItems: [
                        {
                            id: "4",
                        },
                        {
                            id: "5",
                        },
                    ],
                },
            ]);
        }
    });

    // https://github.com/vendure-ecommerce/vendure/commit/8e5fb2aad43d79712ee8c57c51581cc0f49c7843
    it("order refunds", async () => {
        if (isVendureV2) {
            const { order } = await adminClient.query(gql`
                query {
                    order(id: "1") {
                        payments {
                            id
                            amount
                            refunds {
                                id
                                total
                                lines {
                                    orderLineId
                                    quantity
                                }
                            }
                        }
                    }
                }
            `);
            expect(order.payments[0].refunds).toEqual([
                {
                    id: "1",
                    total: 140292,
                    lines: [
                        {
                            orderLineId: "1",
                            quantity: 1,
                        },
                    ],
                },
                {
                    id: "2",
                    total: 45390,
                    lines: [],
                },
            ]);
        } else {
            const { order } = await adminClient.query(gql`
                query {
                    order(id: "1") {
                        payments {
                            id
                            amount
                            refunds {
                                id
                                total
                                orderItems {
                                    id
                                }
                            }
                        }
                    }
                }
            `);
            expect(order.payments[0].refunds).toEqual([
                {
                    id: "1",
                    total: 140292,
                    orderItems: [
                        {
                            id: "1",
                        },
                    ],
                },
                {
                    id: "2",
                    total: 45390,
                    orderItems: [],
                },
            ]);
        }
    });

    // https://github.com/vendure-ecommerce/vendure/commit/8e5fb2aad43d79712ee8c57c51581cc0f49c7843
    it("order modifications", async () => {
        if (isVendureV2) {
            const { order } = await adminClient.query(gql`
                query {
                    order(id: "1") {
                        modifications {
                            id
                            priceChange
                            lines {
                                orderLineId
                                quantity
                            }
                            refund {
                                id
                                total
                            }
                        }
                        lines {
                            id
                            quantity
                            orderPlacedQuantity
                        }
                    }
                }
            `);
            expect(order.modifications).toEqual([
                {
                    id: "1",
                    priceChange: -45390,
                    lines: [
                        {
                            orderLineId: "2",
                            quantity: 1,
                        },
                    ],
                    refund: {
                        id: "2",
                        total: 45390,
                    },
                },
            ]);
            expect(order.lines).toEqual([
                {
                    id: "1",
                    quantity: 1,
                    orderPlacedQuantity: 1,
                },
                {
                    id: "2",
                    quantity: 1,
                    orderPlacedQuantity: 2,
                },
                {
                    id: "3",
                    quantity: 2,
                    orderPlacedQuantity: 2,
                },
            ]);
        } else {
            const { order } = await adminClient.query(gql`
                query {
                    order(id: "1") {
                        modifications {
                            id
                            priceChange
                            orderItems {
                                id
                            }
                            refund {
                                id
                                total
                            }
                        }
                    }
                }
            `);
            expect(order.modifications).toEqual([
                {
                    id: "1",
                    priceChange: -45390,
                    orderItems: [
                        {
                            id: "3",
                        },
                    ],
                    refund: {
                        id: "2",
                        total: 45390,
                    },
                },
            ]);
        }
    });

    // https://github.com/vendure-ecommerce/vendure/commit/3d9f7e8934e55f65cfa97f6b5eb378c32df84655
    if (isVendureV2) {
        it("order type", async () => {
            const { order } = await adminClient.query(gql`
                query {
                    order(id: "1") {
                        type
                    }
                }
            `);

            expect(order.type).toEqual("Regular");
        });
    }
});
