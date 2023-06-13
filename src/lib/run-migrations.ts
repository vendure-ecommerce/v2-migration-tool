import {QueryRunner} from "typeorm";
import {queryRunnerFactory} from "./utils";

export async function vendureV2Migrations(queryRunner: QueryRunner, schemaName?: string) {
    const isMysql =
        queryRunner.connection.options.type === "mysql" ||
        queryRunner.connection.options.type === "mariadb";
    const q = queryRunnerFactory(queryRunner);

    console.log(`Starting the database migration to Vendure v2!`);

    if (!isMysql && schemaName) {
        await q(`SET search_path TO "${schemaName}"`);
    }

    // Set a default language code for the now-translatable entities, Promotion and PaymentMethod
    const languageCode = "en";

    // Transfer Promotion name to new translation table
    await q(`INSERT INTO "promotion_translation" ("createdAt", "updatedAt", "languageCode", "name", "description", "baseId") 
                     SELECT "createdAt", "updatedAt", '${languageCode}', "name", '', "id" FROM "promotion"`);
    // Transfer PaymentMethod name and description to new translation table
    await q(`INSERT INTO "payment_method_translation" ("createdAt", "updatedAt", "languageCode", "name", "description", "baseId")
                     SELECT "createdAt", "updatedAt", '${languageCode}', "name", "description", "id" FROM "payment_method"`);
    console.log(`Updated Promotion and PaymentMethod schema`);

    // Transfer the Channel.currencyCode to the new Channel.defaultCurrencyCode
    await q(`UPDATE "channel" SET "defaultCurrencyCode" = "currencyCode"`);
    // Populate the Channel.availableLanguageCodes and Channel.availableCurrencyCodes
    await q(`UPDATE "channel" SET "availableLanguageCodes" = COALESCE("defaultLanguageCode", '')`);
    await q(`UPDATE "channel" SET "availableCurrencyCodes" = COALESCE("defaultCurrencyCode", '')`);

    // Create a default StockLocation
    const defaultStockLocationName = "Default Stock Location";
    let defaultStockLocationId: string | number;
    if (queryRunner.connection.options.type === "mysql") {
        // MySQL does not support the RETURNING statement (MariaDB does)
        // See https://github.com/vendure-ecommerce/v2-migration-tool/issues/4
        const result = await queryRunner.query(
            `INSERT INTO stock_location (createdAt, updatedAt, name, description) 
            VALUES (CURRENT_TIMESTAMP(), CURRENT_TIMESTAMP(), ?, '')`,
            [defaultStockLocationName]
        );
        defaultStockLocationId = result.insertId;
    } else {
        const [{id}] = await q(
            `INSERT INTO "stock_location" ("createdAt", "updatedAt", "name", "description") 
                 VALUES (DEFAULT, DEFAULT, :defaultStockLocationName, '') RETURNING id`,
            {defaultStockLocationName}
        );
        defaultStockLocationId = id;
    }
    console.log(
        `Created default StockLocation with id ${defaultStockLocationId}`
    );

    // Assign the default StockLocation to all Channels
    await q(
        `INSERT INTO "stock_location_channels_channel" ("stockLocationId", "channelId") SELECT :defaultStockLocationId, "id" FROM "channel"`,
        {defaultStockLocationId}
    );
    console.log(`Assigned default StockLocation to all Channels`);

    // Set the default StockLocation to all StockMovements
    await q(
        `UPDATE "stock_movement" SET "stockLocationId" = :defaultStockLocationId`,
        {defaultStockLocationId}
    );
    console.log(`Set default StockLocation on all StockMovements`);

    // Set the currencyCode on all ProductVariantPrice entities based on the associated Channel
    await q(
        `UPDATE "product_variant_price" SET "currencyCode" = (SELECT "defaultCurrencyCode" FROM "channel" WHERE "id" = "channelId")`
    );
    console.log(`Set currencyCode on all ProductVariantPrice entities`);

    // Create a StockLevel for every ProductVariant
    await q(
        `INSERT INTO "stock_level" ("createdAt", "updatedAt", "productVariantId", "stockLocationId", "stockOnHand", "stockAllocated")
                 SELECT "createdAt", "updatedAt", "id", :defaultStockLocationId, "stockOnHand", "stockAllocated" FROM "product_variant"`,
        {defaultStockLocationId}
    );
    console.log(`Created StockLevels for all ProductVariants`);

    // For each OrderLine, we need to count the number of OrderItems, and set that number as the `quantity` and `orderPlacedQuantity` on the OrderLine,
    // and transfer other data from the first OrderItem to the OrderLine.
    const orderLineCount = await q(
        `SELECT COUNT(*) as count FROM "order_line"`
    );
    console.log(
        `Transferring OrderItem data for ${orderLineCount[0].count} OrderLines (this may take a while)...`
    );
    if (isMysql) {
        await q(
            `
        UPDATE \`order_line\`
            SET
                \`quantity\` = (
                    SELECT COUNT(*) FROM \`order_item\` WHERE \`order_line\`.\`id\` = \`order_item\`.\`lineId\` AND NOT \`cancelled\`
                ),
                \`orderPlacedQuantity\` = (
                    SELECT COUNT(*) FROM \`order_item\` WHERE \`order_line\`.\`id\` = \`order_item\`.\`lineId\`
                ),
                \`listPriceIncludesTax\` = (
                    SELECT \`listPriceIncludesTax\`
                    FROM \`order_item\`
                    WHERE \`lineId\` = \`order_line\`.\`id\`
                    LIMIT 1
                ),
                \`adjustments\` = COALESCE(
                    (
                        SELECT JSON_ARRAYAGG(
                           JSON_OBJECT(
                                    'type', \`type\`,
                                    'adjustmentSource', \`adjustmentSource\`,
                                    'description',\`description\`,
                                    'amount', CAST(\`amount\` AS DECIMAL(10,2)) * (
                                        SELECT COUNT(*)
                                        FROM \`order_item\`
                                        WHERE \`lineId\` = \`order_line\`.\`id\`
                                    )
                           )
                        )
                        FROM \`order_item\`
                        CROSS JOIN JSON_TABLE(\`adjustments\`, '$[*]' COLUMNS (
                            \`type\` VARCHAR(50) PATH '$.type',
                            \`adjustmentSource\` VARCHAR(255) PATH '$.adjustmentSource',
                            \`description\` VARCHAR(255) PATH '$.description',
                            \`amount\` int PATH '$.amount'
                        )) AS adj
                        WHERE \`order_item\`.\`id\` = (
                            SELECT \`id\`
                            FROM \`order_item\`
                            WHERE \`lineId\` = \`order_line\`.\`id\`
                            AND NOT \`cancelled\`
                            ORDER BY \`createdAt\`
                            LIMIT 1
                        )
                    ), '[]'
                ),
                \`taxLines\` = COALESCE(
                    (
                        SELECT \`taxLines\`
                        FROM \`order_item\`
                        WHERE \`lineId\` = \`order_line\`.\`id\`
                        LIMIT 1
                    ), '[]'
                ),
                \`initialListPrice\` = COALESCE(
                    (
                        SELECT \`initialListPrice\`
                        FROM \`order_item\`
                        WHERE \`lineId\` = \`order_line\`.\`id\`
                        LIMIT 1
                    ), 0
                ),
                \`listPrice\` = COALESCE(
                    (
                        SELECT \`listPrice\`
                        FROM \`order_item\`
                        WHERE \`lineId\` = \`order_line\`.\`id\`
                        LIMIT 1
                    ), 0
                )`,
            {},
            false
        );
    } else {
        await q(
            `UPDATE "order_line"
            SET
                "quantity" = (SELECT COUNT(*) FROM "order_item" WHERE "order_line"."id" = "order_item"."lineId" AND NOT "cancelled"),
                "orderPlacedQuantity" = (SELECT COUNT(*) FROM "order_item" WHERE "order_line"."id" = "order_item"."lineId"),
                "listPriceIncludesTax" = (
                    SELECT "listPriceIncludesTax"
                    FROM "order_item"
                    WHERE "lineId" = "order_line"."id"
                    LIMIT 1
                ),
                "adjustments" = COALESCE((
                    SELECT json_agg(
                        json_build_object(
                            'type', adj->>'type',
                            'adjustmentSource', adj->>'adjustmentSource',
                            'description', adj->>'description',
                            'amount', (adj->>'amount')::numeric * (
                                SELECT COUNT(*)
                                FROM "order_item"
                                WHERE "lineId" = "order_line"."id"
                            )
                        )
                    )::TEXT
                    FROM "order_item"
                    CROSS JOIN jsonb_array_elements("adjustments"::jsonb) AS adj
                    WHERE "order_item"."id" = (
                        SELECT "id"
                        FROM "order_item"
                        WHERE "lineId" = "order_line"."id"
                        AND NOT "cancelled"
                        ORDER BY "createdAt"
                        LIMIT 1
                    )
                ), '[]'),
                "taxLines" = COALESCE(
                    (
                        SELECT "taxLines"
                        FROM "order_item"
                        WHERE "lineId" = "order_line"."id"
                        LIMIT 1
                    ), '[]'
                ),
                "initialListPrice" = COALESCE(
                    (
                        SELECT "initialListPrice"
                        FROM "order_item"
                        WHERE "lineId" = "order_line"."id"
                        LIMIT 1
                    ), 0
                ),
                "listPrice" = COALESCE(
                    (
                        SELECT "listPrice"
                        FROM "order_item"
                        WHERE "lineId" = "order_line"."id"
                        LIMIT 1
                    ), 0
                )`,
            {},
            false
        );
    }
    console.log(`Completed transferring OrderItem data`);

    // For each Cancellation, we need to associate it with the OrderItem that it is cancelling
    const cancellations =
        await q(`SELECT "sm"."id", "sm"."quantity", "sm"."orderItemId", "oi"."lineId" AS "orderLineId" FROM "stock_movement" AS "sm"
                                            INNER JOIN "order_item" AS "oi" ON "sm"."orderItemId" = "oi"."id" 
                                            WHERE "type" = 'CANCELLATION' GROUP BY "sm"."orderItemId", "sm"."id", "oi"."lineId"`);
    const seenCancellationLineIds = new Set<number | string>();
    console.log(
        `Transferring Cancellation data for ${cancellations.length} Cancellations`
    );
    for (const cancellation of cancellations) {
        if (seenCancellationLineIds.has(cancellation.orderLineId)) {
            // We have already created a Cancellation for this OrderLine, so we can delete this row
            await q(
                `DELETE FROM "stock_movement" WHERE "id" = :cancellationId`,
                {cancellationId: cancellation.id}
            );
        } else {
            // Update the Cancellation to set the quantity to the number of OrderItems in the OrderLine
            await q(
                // We have this extra nested SELECT because MySQL doesn't allow a subquery in an UPDATE statement to reference the table being updated,
                // resulting in the error: "You can't specify target table 'stock_movement' for update in FROM clause"
                // See https://stackoverflow.com/a/9843719/772859
                `UPDATE "stock_movement" 
                             SET "orderLineId" = :orderLineId, 
                                 "quantity" = (SELECT "cnt" FROM (SELECT COUNT(*) as "cnt" FROM "order_item" AS "oi" INNER JOIN "stock_movement" AS "sm" 
                                               ON "oi"."lineId" = :orderLineId WHERE "sm"."type" = 'CANCELLATION') as "c")
                                  WHERE "stock_movement"."id" = :cancellationId`,
                {
                    orderLineId: cancellation.orderLineId,
                    cancellationId: cancellation.id,
                }
            );
            seenCancellationLineIds.add(cancellation.orderLineId);
        }
    }

    // For each Release, we need to associate it with the OrderItem that it is releasing
    const releases =
        await q(`SELECT "sm"."id", "sm"."quantity", "sm"."orderItemId", "oi"."lineId" AS "orderLineId" FROM "stock_movement" AS "sm"
                                      INNER JOIN "order_item" AS "oi" ON "sm"."orderItemId" = "oi"."id" 
                                      WHERE "type" = 'RELEASE' GROUP BY "sm"."orderItemId", "sm"."id", "oi"."lineId"`);
    const seenReleaseLineIds = new Set<number | string>();
    console.log(`Transferring Release data for ${releases.length} Releases`);
    for (const release of releases) {
        if (seenReleaseLineIds.has(release.orderLineId)) {
            // We have already created a Release for this OrderLine, so we can delete this row
            await q(`DELETE FROM "stock_movement" WHERE "id" = :releaseId`, {
                releaseId: release.id,
            });
        } else {
            // Update the Release to set the quantity to the number of OrderItems in the OrderLine
            await q(
                // We have this extra nested SELECT because MySQL doesn't allow a subquery in an UPDATE statement to reference the table being updated,
                // resulting in the error: "You can't specify target table 'stock_movement' for update in FROM clause"
                // See https://stackoverflow.com/a/9843719/772859
                `UPDATE "stock_movement" 
                             SET "orderLineId" = :orderLineId, 
                                 "quantity" = (SELECT "cnt" FROM (SELECT COUNT(*) as "cnt" FROM "order_item" AS "oi" INNER JOIN "stock_movement" AS "sm" 
                                               ON "oi"."lineId" = :orderLineId WHERE "sm"."type" = 'RELEASE') as "c")
                             WHERE "stock_movement"."id" = :releaseId`,
                {orderLineId: release.orderLineId, releaseId: release.id}
            );
            seenReleaseLineIds.add(release.orderLineId);
        }
    }

    // For each OrderItem that has a refundId, create an OrderLineReference related to the same Refund, but
    // with the quantity equal to the number of OrderItems sharing that refundId
    await q(`INSERT INTO order_line_reference ("createdAt", "updatedAt", "orderLineId", "discriminator", "quantity", "refundId")
                     SELECT oi."createdAt" AS "createdAt",
                            oi."updatedAt" AS "updatedAt",
                            ol."id" AS "orderLineId",
                            'RefundLine' AS "discriminator",
                            COUNT(oi."lineId") AS "quantity",
                            oi."refundId" AS "refundId"
                     FROM "order_line" ol
                     JOIN "order_item" oi ON oi."lineId" = ol."id"
                     WHERE oi."refundId" IS NOT NULL
                     GROUP BY oi."refundId", ol."id", oi."lineId", oi."createdAt", oi."updatedAt";`);
    console.log(`Transferred data for Refunds`);

    // Fulfillment associated with new FulfillmentLine, add reference to Fulfillment on Order entity
    await q(`INSERT INTO order_line_reference ("createdAt", "updatedAt", "orderLineId", "discriminator", "quantity", "fulfillmentId")
                     SELECT fulfillment."createdAt" AS "createdAt",
                            fulfillment."updatedAt" AS "updatedAt",
                            ol."id" AS "orderLineId",
                            'FulfillmentLine' AS "discriminator",
                            COUNT(oif_fulfillment."fulfillmentId") AS "quantity",
                            oif_fulfillment."fulfillmentId" AS "fulfillmentId"
                     FROM "order_line" ol
                     JOIN "order_item" oi ON oi."lineId" = ol."id"
                     JOIN "order_item_fulfillments_fulfillment" oif_fulfillment ON oif_fulfillment."orderItemId" = oi."id"
                     JOIN "fulfillment" fulfillment ON oif_fulfillment."fulfillmentId" = fulfillment."id"
                     GROUP BY ol."id", oif_fulfillment."fulfillmentId", fulfillment.id;`);
    console.log(`Transferred data for Fulfillments`);

    // Also add a corresponding row to the order_fulfillments_fulfillment table
    await q(`INSERT INTO order_fulfillments_fulfillment ("orderId", "fulfillmentId")
                        SELECT DISTINCT ol."orderId" AS "orderId",
                               olr."fulfillmentId" AS "fulfillmentId"
                        FROM "order_line" ol
                        JOIN "order_line_reference" olr ON olr."orderLineId" = ol."id"
                        WHERE olr."discriminator" = 'FulfillmentLine'`);
    console.log(`Linked fulfillments to Orders`);

    // OrderModification associated with new OrderModificationLine
    await q(`INSERT INTO order_line_reference ("createdAt", "updatedAt", "orderLineId", "discriminator", "quantity", "modificationId")
                     SELECT order_modification."createdAt" AS "createdAt",
                            order_modification."updatedAt" AS "updatedAt",
                            ol."id" AS "orderLineId",
                            'OrderModificationLine' AS "discriminator",
                            COUNT(omoi_order_item."orderModificationId") AS "quantity",
                            omoi_order_item."orderModificationId" AS "modificationId"
                     FROM "order_line" ol
                     JOIN "order_item" oi ON oi."lineId" = ol."id"
                     JOIN "order_modification_order_items_order_item" omoi_order_item ON omoi_order_item."orderItemId" = oi."id"
                     JOIN "order_modification" order_modification ON omoi_order_item."orderModificationId" = order_modification."id"
                     GROUP BY ol."id", omoi_order_item."orderModificationId", order_modification.id;`);
    console.log(`Transferred data for OrderModifications`);

    // Transfer data from the deprecated `country` tables to the new `region` tables
    await q(`INSERT INTO "region" ("createdAt", "updatedAt", "code", "type", "enabled", "id", "discriminator") 
                            SELECT "createdAt", "updatedAt", "code", 'country', "enabled", "id", 'Country' FROM "country"`);
    await q(`INSERT INTO "region_translation" ("createdAt", "updatedAt", "languageCode", "id", "name", "baseId") 
                                        SELECT "createdAt", "updatedAt", "languageCode", "id", "name", "baseId" FROM "country_translation"`);
    await q(`INSERT INTO "zone_members_region" ("zoneId", "regionId") SELECT "zoneId", "countryId" FROM "zone_members_country"`);
    console.log(`Transferred data for Countries`);

    // Moved from earlier in the sequence. Now we have migrated all the data, we can drop the old columns
    await q(`ALTER TABLE "channel" DROP COLUMN "currencyCode"`);
    await q(`ALTER TABLE "product_variant" DROP COLUMN "stockOnHand"`);
    await q(`ALTER TABLE "product_variant" DROP COLUMN "stockAllocated"`);
    await q(`ALTER TABLE "promotion" DROP COLUMN "name"`);
    await q(`ALTER TABLE "payment_method" DROP COLUMN "name"`);
    await q(`ALTER TABLE "payment_method" DROP COLUMN "description"`);
    await q(`ALTER TABLE "stock_movement" DROP COLUMN "orderItemId"`);

    // Manually drop the OrderItem tables, as it is not managed by TypeORM
    // See https://github.com/typeorm/typeorm/issues/7814#issuecomment-1249613977
    await q(`DROP TABLE "order_item_fulfillments_fulfillment"`);
    await q(`DROP TABLE "order_modification_order_items_order_item"`);
    await q(`DROP TABLE "order_item"`);
}
