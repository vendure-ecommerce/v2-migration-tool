import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { SimpleGraphQLClient, testConfig } from "@vendure/testing";
import { INestApplication } from "@nestjs/common";
import { bootstrap, mergeConfig } from "@vendure/core";
import { config } from "../src/vendure-config";
import gql from "graphql-tag";

describe("migration tests", () => {
    const isVendureV2 =
        require("../package.json").devDependencies["@vendure/core"].startsWith(
            "2"
        );
    const adminApiUrl = `http://localhost:${config.apiOptions.port}/${config.apiOptions.adminApiPath}`;
    let server: INestApplication;
    const adminClient = new SimpleGraphQLClient(
        mergeConfig(testConfig, config),
        adminApiUrl
    );
    beforeAll(async () => {
        server = await bootstrap({
            ...config,
            dbConnectionOptions: {
                ...config.dbConnectionOptions,
                migrations: [],
            },
        });
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
            {
                id: "2",
                name: "Test Promotion 2",
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
                        items {
                            id
                            currencyCode
                        }
                    }
                }
            `);
            expect(channels.items).toEqual([
                {
                    id: "1",
                    currencyCode: "USD",
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

    it("ProductVariant prices & currencyCode", async () => {
        const { productVariants } = await adminClient.query(gql`
            query {
                productVariants(options: { take: 10, sort: { id: ASC } }) {
                    items {
                        id
                        price
                        priceWithTax
                        currencyCode
                    }
                }
            }
        `);

        expect(productVariants.items).toEqual([
            {
                id: "1",
                price: 129900,
                priceWithTax: 155880,
                currencyCode: "USD",
            },
            {
                id: "2",
                price: 139900,
                priceWithTax: 167880,
                currencyCode: "USD",
            },
            {
                id: "3",
                price: 219900,
                priceWithTax: 263880,
                currencyCode: "USD",
            },
            {
                id: "4",
                price: 229900,
                priceWithTax: 275880,
                currencyCode: "USD",
            },
            { id: "5", price: 32900, priceWithTax: 39480, currencyCode: "USD" },
            { id: "6", price: 44500, priceWithTax: 53400, currencyCode: "USD" },
            { id: "7", price: 1899, priceWithTax: 2279, currencyCode: "USD" },
            { id: "8", price: 31000, priceWithTax: 37200, currencyCode: "USD" },
            { id: "9", price: 14374, priceWithTax: 17249, currencyCode: "USD" },
            {
                id: "10",
                price: 16994,
                priceWithTax: 20393,
                currencyCode: "USD",
            },
        ]);
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
            subTotal: 95285,
            subTotalWithTax: 114342,
            shipping: 500,
            shippingWithTax: 500,
            total: 95785,
            totalWithTax: 114842,
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
                            adjustmentSource: "PROMOTION:2",
                            amount: -3100,
                            description: "Test Promotion 2",
                            type: "PROMOTION",
                        },
                        {
                            adjustmentSource: "PROMOTION:1",
                            amount: -5890,
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
                        fulfillments {
                            id
                            method
                            state
                            trackingCode
                            lines {
                                orderLineId
                                quantity
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
                    lines: [
                        {
                            orderLineId: "3",
                            quantity: 2,
                        },
                    ],
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
            expect(order.payments[0].refunds.sort((a: any, b: any) => a.id < b.id ? -1 : 1)).toEqual([
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
            expect(order.payments[0].refunds.sort((a: any, b: any) => a.id < b.id ? -1 : 1)).toEqual([
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
                    quantity: 0,
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

    it("countries", async () => {
        const { countries } = await adminClient.query(gql`
            query {
                countries(options: { take: 10, sort: { name: ASC } }) {
                    items {
                        id
                        code
                        name
                    }
                    totalItems
                }
            }
        `);

        expect(countries.items).toEqual([
            { id: "1", code: "AF", name: "Afghanistan" },
            { id: "2", code: "AX", name: "Åland Islands" },
            { id: "3", code: "AL", name: "Albania" },
            { id: "4", code: "DZ", name: "Algeria" },
            { id: "5", code: "AS", name: "American Samoa" },
            { id: "6", code: "AD", name: "Andorra" },
            { id: "7", code: "AO", name: "Angola" },
            { id: "8", code: "AI", name: "Anguilla" },
            { id: "9", code: "AG", name: "Antigua and Barbuda" },
            { id: "10", code: "AR", name: "Argentina" },
        ]);
        expect(countries.totalItems).toBe(248);
    });

    it("zone", async () => {
        const { zone } = await adminClient.query(gql`
            query {
                zone(id: "1") {
                    id
                    name
                    members {
                        id
                        code
                        name
                    }
                }
            }
        `);

        expect(zone.members.length).toBe(51);
        // prettier-ignore
        expect(zone.members.map((m: any) => m.id)).toEqual([
          '1',   '11',  '15',  '17',  '18',  '25',
          '33',  '38',  '45',  '58',  '82',  '100',
          '103', '104', '105', '106', '109', '112',
          '114', '115', '118', '119', '120', '121',
          '122', '124', '131', '135', '136', '148',
          '153', '156', '167', '168', '170', '175',
          '180', '195', '200', '210', '216', '217',
          '218', '220', '221', '227', '228', '233',
          '238', '241', '246']);
    });
});
