import {MigrationInterface, QueryRunner} from "typeorm";

// In your migration, you would import this from '@vendure/migrate-v2'
import {vendureV2Migrations} from "../lib/run-migrations";

export class v2011686649098749 implements MigrationInterface {

    // prettier-ignore
    public async up(queryRunner: QueryRunner): Promise<any> {

        // This part does not need to be copied to your own migration - it is just used when developing the migration
        // scripts themselves.
        if (queryRunner.connection.options.type === "mysql" || queryRunner.connection.options.type === "mariadb") {
            // This is just for postgres - don't attempt to run on mysql
            return;
        }

        await queryRunner.query(`ALTER TABLE "product_option_translation" DROP CONSTRAINT "FK_a79a443c1f7841f3851767faa6d"`, undefined);
        await queryRunner.query(`ALTER TABLE "product_option_group_translation" DROP CONSTRAINT "FK_93751abc1451972c02e033b766c"`, undefined);
        await queryRunner.query(`ALTER TABLE "stock_movement" DROP CONSTRAINT "FK_cbb0990e398bf7713aebdd38482"`, undefined);
        await queryRunner.query(`ALTER TABLE "product_variant_price" DROP CONSTRAINT "FK_e6126cd268aea6e9b31d89af9ab"`, undefined);
        await queryRunner.query(`ALTER TABLE "product_variant_translation" DROP CONSTRAINT "FK_420f4d6fb75d38b9dca79bc43b4"`, undefined);
        await queryRunner.query(`ALTER TABLE "shipping_method_translation" DROP CONSTRAINT "FK_85ec26c71067ebc84adcd98d1a5"`, undefined);
        await queryRunner.query(`ALTER TABLE "shipping_line" DROP CONSTRAINT "FK_c9f34a440d490d1b66f6829b86c"`, undefined);
        await queryRunner.query(`ALTER TABLE "address" DROP CONSTRAINT "FK_d87215343c3a3a67e6a0b7f3ea9"`, undefined);

        // =================== Step 1 ===================
        // TypeORM will generate this RENAME COLUMN statement, but we should be creating a new column and dropping the old one.
        // Comment out the following query:
        //
        // await queryRunner.query(`ALTER TABLE "stock_movement" RENAME COLUMN "orderItemId" TO "stockLocationId"`, undefined);
        //
        // Replace it with the line below if you are using the default value (AutoIncrementIdStrategy) for the entityIdStrategy:
        await queryRunner.query(`ALTER TABLE "stock_movement" ADD "stockLocationId" integer`);
        // Or if you are using UuidIdStrategy as entityIdStrategy, replace it with:
        // await queryRunner.query(`ALTER TABLE "stock_movement" ADD "stockLocationId" uuid NOT NULL`);

        await queryRunner.query(`CREATE TABLE "seller" ("createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP, "name" character varying NOT NULL, "id" SERIAL NOT NULL, CONSTRAINT "PK_36445a9c6e794945a4a4a8d3c9d" PRIMARY KEY ("id"))`, undefined);
        await queryRunner.query(`CREATE TABLE "region_translation" ("createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "languageCode" character varying NOT NULL, "name" character varying NOT NULL, "id" SERIAL NOT NULL, "baseId" integer, CONSTRAINT "PK_3e0c9619cafbe579eeecfd88abc" PRIMARY KEY ("id"))`, undefined);
        await queryRunner.query(`CREATE INDEX "IDX_1afd722b943c81310705fc3e61" ON "region_translation" ("baseId") `, undefined);
        await queryRunner.query(`CREATE TABLE "region" ("createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "code" character varying NOT NULL, "type" character varying NOT NULL, "enabled" boolean NOT NULL, "id" SERIAL NOT NULL, "parentId" integer, "discriminator" character varying NOT NULL, CONSTRAINT "PK_5f48ffc3af96bc486f5f3f3a6da" PRIMARY KEY ("id"))`, undefined);
        await queryRunner.query(`CREATE INDEX "IDX_ed0c8098ce6809925a437f42ae" ON "region" ("parentId") `, undefined);
        await queryRunner.query(`CREATE TABLE "stock_location" ("createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "name" character varying NOT NULL, "description" character varying NOT NULL, "id" SERIAL NOT NULL, CONSTRAINT "PK_adf770067d0df1421f525fa25cc" PRIMARY KEY ("id"))`, undefined);
        await queryRunner.query(`CREATE TABLE "stock_level" ("createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "stockOnHand" integer NOT NULL, "stockAllocated" integer NOT NULL, "id" SERIAL NOT NULL, "productVariantId" integer NOT NULL, "stockLocationId" integer NOT NULL, CONSTRAINT "PK_88ff7d9dfb57dc9d435e365eb69" PRIMARY KEY ("id"))`, undefined);
        await queryRunner.query(`CREATE INDEX "IDX_9950eae3180f39c71978748bd0" ON "stock_level" ("productVariantId") `, undefined);
        await queryRunner.query(`CREATE INDEX "IDX_984c48572468c69661a0b7b049" ON "stock_level" ("stockLocationId") `, undefined);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_7fc20486b8cfd33dc84c96e168" ON "stock_level" ("productVariantId", "stockLocationId") `, undefined);
        await queryRunner.query(`CREATE TABLE "order_line_reference" ("createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "quantity" integer NOT NULL, "id" SERIAL NOT NULL, "fulfillmentId" integer, "modificationId" integer, "orderLineId" integer NOT NULL, "refundId" integer, "discriminator" character varying NOT NULL, CONSTRAINT "PK_21891d07accb8fa87e11165bca2" PRIMARY KEY ("id"))`, undefined);
        await queryRunner.query(`CREATE INDEX "IDX_7d57857922dfc7303604697dbe" ON "order_line_reference" ("orderLineId") `, undefined);
        await queryRunner.query(`CREATE INDEX "IDX_06b02fb482b188823e419d37bd" ON "order_line_reference" ("fulfillmentId") `, undefined);
        await queryRunner.query(`CREATE INDEX "IDX_22b818af8722746fb9f206068c" ON "order_line_reference" ("modificationId") `, undefined);
        await queryRunner.query(`CREATE INDEX "IDX_30019aa65b17fe9ee962893199" ON "order_line_reference" ("refundId") `, undefined);
        await queryRunner.query(`CREATE INDEX "IDX_49a8632be8cef48b076446b8b9" ON "order_line_reference" ("discriminator") `, undefined);
        await queryRunner.query(`CREATE TABLE "promotion_translation" ("createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "languageCode" character varying NOT NULL, "name" character varying NOT NULL, "description" text NOT NULL, "id" SERIAL NOT NULL, "baseId" integer, CONSTRAINT "PK_0b4fd34d2fc7abc06189494a178" PRIMARY KEY ("id"))`, undefined);
        await queryRunner.query(`CREATE INDEX "IDX_1cc009e9ab2263a35544064561" ON "promotion_translation" ("baseId") `, undefined);
        await queryRunner.query(`CREATE TABLE "payment_method_translation" ("createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "languageCode" character varying NOT NULL, "name" character varying NOT NULL, "description" text NOT NULL, "id" SERIAL NOT NULL, "baseId" integer, CONSTRAINT "PK_ae5ae0af71ae8d15da9eb75768b" PRIMARY KEY ("id"))`, undefined);
        await queryRunner.query(`CREATE INDEX "IDX_66187f782a3e71b9e0f5b50b68" ON "payment_method_translation" ("baseId") `, undefined);
        await queryRunner.query(`CREATE TABLE "zone_members_region" ("zoneId" integer NOT NULL, "regionId" integer NOT NULL, CONSTRAINT "PK_fc4eaa2236c4d4f61db0ae3826f" PRIMARY KEY ("zoneId", "regionId"))`, undefined);
        await queryRunner.query(`CREATE INDEX "IDX_433f45158e4e2b2a2f344714b2" ON "zone_members_region" ("zoneId") `, undefined);
        await queryRunner.query(`CREATE INDEX "IDX_b45b65256486a15a104e17d495" ON "zone_members_region" ("regionId") `, undefined);
        await queryRunner.query(`CREATE TABLE "stock_location_channels_channel" ("stockLocationId" integer NOT NULL, "channelId" integer NOT NULL, CONSTRAINT "PK_e6f8b2d61ff58c51505c38da8a0" PRIMARY KEY ("stockLocationId", "channelId"))`, undefined);
        await queryRunner.query(`CREATE INDEX "IDX_39513fd02a573c848d23bee587" ON "stock_location_channels_channel" ("stockLocationId") `, undefined);
        await queryRunner.query(`CREATE INDEX "IDX_ff8150fe54e56a900d5712671a" ON "stock_location_channels_channel" ("channelId") `, undefined);
        await queryRunner.query(`CREATE TABLE "order_fulfillments_fulfillment" ("orderId" integer NOT NULL, "fulfillmentId" integer NOT NULL, CONSTRAINT "PK_414600087d71aee1583bc517590" PRIMARY KEY ("orderId", "fulfillmentId"))`, undefined);
        await queryRunner.query(`CREATE INDEX "IDX_f80d84d525af2ffe974e7e8ca2" ON "order_fulfillments_fulfillment" ("orderId") `, undefined);
        await queryRunner.query(`CREATE INDEX "IDX_4add5a5796e1582dec2877b289" ON "order_fulfillments_fulfillment" ("fulfillmentId") `, undefined);
        await queryRunner.query(`CREATE TABLE "collection_closure" ("id_ancestor" integer NOT NULL, "id_descendant" integer NOT NULL, CONSTRAINT "PK_9dda38e2273a7744b8f655782a5" PRIMARY KEY ("id_ancestor", "id_descendant"))`, undefined);
        await queryRunner.query(`CREATE INDEX "IDX_c309f8cd152bbeaea08491e0c6" ON "collection_closure" ("id_ancestor") `, undefined);
        await queryRunner.query(`CREATE INDEX "IDX_457784c710f8ac9396010441f6" ON "collection_closure" ("id_descendant") `, undefined);

        // ==================== Step 2 ====================
        // Comment out the following "DROP COLUMN" queries. We still require these columns for the migration
        // of existing data, and will drop them in a later step.
        //
        // await queryRunner.query(`ALTER TABLE "channel" DROP COLUMN "currencyCode"`, undefined);
        // await queryRunner.query(`ALTER TABLE "product_variant" DROP COLUMN "stockOnHand"`, undefined);
        // await queryRunner.query(`ALTER TABLE "product_variant" DROP COLUMN "stockAllocated"`, undefined);
        // await queryRunner.query(`ALTER TABLE "promotion" DROP COLUMN "name"`, undefined);
        // await queryRunner.query(`ALTER TABLE "payment_method" DROP COLUMN "name"`, undefined);
        // await queryRunner.query(`ALTER TABLE "payment_method" DROP COLUMN "description"`, undefined);

        // ==================== Step 3 (optional) ====================
        // If you do not have custom fields defined which link to custom entities
        // (i.e. have the type: "relation"), skip to the next step.
        //
        // Due to a TypeORM update, customField relation columns will be prefixed with "customFields..."
        // Your generated migration file may contain commands to drop legacy named
        // custom field columns, and create new ones with the correct convention.
        //
        // However, rather than dropping the columns, we will instead rename them. For example, if we have
        // a custom field named `metadata` which links to the `Metadata` entity, you would see a statement like this:
        //
        // await queryRunner.query(`ALTER TABLE "order_line" DROP COLUMN "metaDataId"`, undefined);
        //
        // We will rename this column to "customFieldsMetadataId" instead:
        //
        // await queryRunner.query(`ALTER TABLE "order_line" RENAME COLUMN "metaDataId" TO "customFieldsMetadataid"`, undefined);
        //
        // The naming convention for the column name is: `customFields` + (custom field name with first letter capitalized, rest lowercase) + 'id'
        //
        // examples:
        //   custom field name: `relatedProduct` -> column name: `customFieldsRelatedproductid`
        //   custom field name: `metadata` -> column name: `customFieldsMetadataid`

        await queryRunner.query(`ALTER TABLE "channel" ADD "description" character varying DEFAULT ''`, undefined);
        await queryRunner.query(`ALTER TABLE "channel" ADD "availableLanguageCodes" text`, undefined);
        await queryRunner.query(`ALTER TABLE "channel" ADD "defaultCurrencyCode" character varying`, undefined);
        await queryRunner.query(`ALTER TABLE "channel" ADD "availableCurrencyCodes" text`, undefined);
        await queryRunner.query(`ALTER TABLE "channel" ADD "trackInventory" boolean NOT NULL DEFAULT true`, undefined);
        await queryRunner.query(`ALTER TABLE "channel" ADD "outOfStockThreshold" integer NOT NULL DEFAULT '0'`, undefined);
        await queryRunner.query(`ALTER TABLE "channel" ADD "sellerId" integer`, undefined);
        await queryRunner.query(`ALTER TABLE "collection" ADD "inheritFilters" boolean NOT NULL DEFAULT true`, undefined);
        await queryRunner.query(`ALTER TABLE "product_variant_price" ADD "currencyCode" character varying`, undefined);
        await queryRunner.query(`ALTER TABLE "order_line" ADD "quantity" integer`, undefined);
        await queryRunner.query(`ALTER TABLE "order_line" ADD "orderPlacedQuantity" integer NOT NULL DEFAULT '0'`, undefined);
        await queryRunner.query(`ALTER TABLE "order_line" ADD "listPriceIncludesTax" boolean`, undefined);
        await queryRunner.query(`ALTER TABLE "order_line" ADD "adjustments" text`, undefined);
        await queryRunner.query(`ALTER TABLE "order_line" ADD "taxLines" text`, undefined);
        await queryRunner.query(`ALTER TABLE "order_line" ADD "sellerChannelId" integer`, undefined);
        await queryRunner.query(`ALTER TABLE "order_line" ADD "shippingLineId" integer`, undefined);
        await queryRunner.query(`ALTER TABLE "order_line" ADD "initialListPrice" integer`, undefined);
        await queryRunner.query(`ALTER TABLE "order_line" ADD "listPrice" integer`, undefined);
        await queryRunner.query(`ALTER TABLE "order" ADD "type" character varying NOT NULL DEFAULT 'Regular'`, undefined);
        await queryRunner.query(`ALTER TABLE "order" ADD "aggregateOrderId" integer`, undefined);
        await queryRunner.query(`ALTER TABLE "product_variant_price" ALTER COLUMN "channelId" DROP NOT NULL`, undefined);
        await queryRunner.query(`ALTER TABLE "order_line" DROP CONSTRAINT "FK_cbcd22193eda94668e84d33f185"`, undefined);
        await queryRunner.query(`ALTER TABLE "order_line" ALTER COLUMN "productVariantId" SET NOT NULL`, undefined);
        await queryRunner.query(`CREATE INDEX "IDX_00cbe87bc0d4e36758d61bd31d" ON "authentication_method" ("userId") `, undefined);
        await queryRunner.query(`CREATE INDEX "IDX_af2116c7e176b6b88dceceeb74" ON "channel" ("sellerId") `, undefined);
        await queryRunner.query(`CREATE INDEX "IDX_afe9f917a1c82b9e9e69f7c612" ON "channel" ("defaultTaxZoneId") `, undefined);
        await queryRunner.query(`CREATE INDEX "IDX_c9ca2f58d4517460435cbd8b4c" ON "channel" ("defaultShippingZoneId") `, undefined);
        await queryRunner.query(`CREATE INDEX "IDX_51da53b26522dc0525762d2de8" ON "collection_asset" ("assetId") `, undefined);
        await queryRunner.query(`CREATE INDEX "IDX_1ed9e48dfbf74b5fcbb35d3d68" ON "collection_asset" ("collectionId") `, undefined);
        await queryRunner.query(`CREATE INDEX "IDX_9f9da7d94b0278ea0f7831e1fc" ON "collection_translation" ("slug") `, undefined);
        await queryRunner.query(`CREATE INDEX "IDX_e329f9036210d75caa1d8f2154" ON "collection_translation" ("baseId") `, undefined);
        await queryRunner.query(`CREATE INDEX "IDX_7256fef1bb42f1b38156b7449f" ON "collection" ("featuredAssetId") `, undefined);
        await queryRunner.query(`CREATE INDEX "IDX_eaea53f44bf9e97790d38a3d68" ON "facet_translation" ("baseId") `, undefined);
        await queryRunner.query(`CREATE INDEX "IDX_3d6e45823b65de808a66cb1423" ON "facet_value_translation" ("baseId") `, undefined);
        await queryRunner.query(`CREATE INDEX "IDX_d101dc2265a7341be3d94968c5" ON "facet_value" ("facetId") `, undefined);
        await queryRunner.query(`CREATE INDEX "IDX_a79a443c1f7841f3851767faa6" ON "product_option_translation" ("baseId") `, undefined);
        await queryRunner.query(`CREATE INDEX "IDX_a6debf9198e2fbfa006aa10d71" ON "product_option" ("groupId") `, undefined);
        await queryRunner.query(`CREATE INDEX "IDX_93751abc1451972c02e033b766" ON "product_option_group_translation" ("baseId") `, undefined);
        await queryRunner.query(`CREATE INDEX "IDX_a6e91739227bf4d442f23c52c7" ON "product_option_group" ("productId") `, undefined);
        await queryRunner.query(`CREATE INDEX "IDX_5888ac17b317b93378494a1062" ON "product_asset" ("assetId") `, undefined);
        await queryRunner.query(`CREATE INDEX "IDX_0d1294f5c22a56da7845ebab72" ON "product_asset" ("productId") `, undefined);
        await queryRunner.query(`CREATE INDEX "IDX_f4a2ec16ba86d277b6faa0b67b" ON "product_translation" ("slug") `, undefined);
        await queryRunner.query(`CREATE INDEX "IDX_7dbc75cb4e8b002620c4dbfdac" ON "product_translation" ("baseId") `, undefined);
        await queryRunner.query(`CREATE INDEX "IDX_91a19e6613534949a4ce6e76ff" ON "product" ("featuredAssetId") `, undefined);
        await queryRunner.query(`CREATE INDEX "IDX_e65ba3882557cab4febb54809b" ON "stock_movement" ("productVariantId") `, undefined);
        await queryRunner.query(`CREATE INDEX "IDX_a2fe7172eeae9f1cca86f8f573" ON "stock_movement" ("stockLocationId") `, undefined);
        await queryRunner.query(`CREATE INDEX "IDX_d2c8d5fca981cc820131f81aa8" ON "stock_movement" ("orderLineId") `, undefined);
        await queryRunner.query(`CREATE INDEX "IDX_10b5a2e3dee0e30b1e26c32f5c" ON "product_variant_asset" ("assetId") `, undefined);
        await queryRunner.query(`CREATE INDEX "IDX_fa21412afac15a2304f3eb35fe" ON "product_variant_asset" ("productVariantId") `, undefined);
        await queryRunner.query(`CREATE INDEX "IDX_e6126cd268aea6e9b31d89af9a" ON "product_variant_price" ("variantId") `, undefined);
        await queryRunner.query(`CREATE INDEX "IDX_420f4d6fb75d38b9dca79bc43b" ON "product_variant_translation" ("baseId") `, undefined);
        await queryRunner.query(`CREATE INDEX "IDX_0e6f516053cf982b537836e21c" ON "product_variant" ("featuredAssetId") `, undefined);
        await queryRunner.query(`CREATE INDEX "IDX_e38dca0d82fd64c7cf8aac8b8e" ON "product_variant" ("taxCategoryId") `, undefined);
        await queryRunner.query(`CREATE INDEX "IDX_6e420052844edf3a5506d863ce" ON "product_variant" ("productId") `, undefined);
        await queryRunner.query(`CREATE INDEX "IDX_85ec26c71067ebc84adcd98d1a" ON "shipping_method_translation" ("baseId") `, undefined);
        await queryRunner.query(`CREATE INDEX "IDX_e2e7642e1e88167c1dfc827fdf" ON "shipping_line" ("shippingMethodId") `, undefined);
        await queryRunner.query(`CREATE INDEX "IDX_c9f34a440d490d1b66f6829b86" ON "shipping_line" ("orderId") `, undefined);
        await queryRunner.query(`CREATE INDEX "IDX_6901d8715f5ebadd764466f7bd" ON "order_line" ("sellerChannelId") `, undefined);
        await queryRunner.query(`CREATE INDEX "IDX_dc9ac68b47da7b62249886affb" ON "order_line" ("shippingLineId") `, undefined);
        await queryRunner.query(`CREATE INDEX "IDX_cbcd22193eda94668e84d33f18" ON "order_line" ("productVariantId") `, undefined);
        await queryRunner.query(`CREATE INDEX "IDX_77be94ce9ec650446617946227" ON "order_line" ("taxCategoryId") `, undefined);
        await queryRunner.query(`CREATE INDEX "IDX_9f065453910ea77d4be8e92618" ON "order_line" ("featuredAssetId") `, undefined);
        await queryRunner.query(`CREATE INDEX "IDX_239cfca2a55b98b90b6bef2e44" ON "order_line" ("orderId") `, undefined);
        await queryRunner.query(`CREATE INDEX "IDX_1c6932a756108788a361e7d440" ON "refund" ("paymentId") `, undefined);
        await queryRunner.query(`CREATE INDEX "IDX_d09d285fe1645cd2f0db811e29" ON "payment" ("orderId") `, undefined);
        await queryRunner.query(`CREATE INDEX "IDX_154eb685f9b629033bd266df7f" ON "surcharge" ("orderId") `, undefined);
        await queryRunner.query(`CREATE INDEX "IDX_a49c5271c39cc8174a0535c808" ON "surcharge" ("orderModificationId") `, undefined);
        await queryRunner.query(`CREATE INDEX "IDX_1df5bc14a47ef24d2e681f4559" ON "order_modification" ("orderId") `, undefined);
        await queryRunner.query(`CREATE INDEX "IDX_73a78d7df09541ac5eba620d18" ON "order" ("aggregateOrderId") `, undefined);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_729b3eea7ce540930dbb706949" ON "order" ("code") `, undefined);
        await queryRunner.query(`CREATE INDEX "IDX_124456e637cca7a415897dce65" ON "order" ("customerId") `, undefined);
        await queryRunner.query(`CREATE INDEX "IDX_dc34d382b493ade1f70e834c4d" ON "address" ("customerId") `, undefined);
        await queryRunner.query(`CREATE INDEX "IDX_d87215343c3a3a67e6a0b7f3ea" ON "address" ("countryId") `, undefined);
        await queryRunner.query(`CREATE INDEX "IDX_7a75399a4f4ffa48ee02e98c05" ON "session" ("activeOrderId") `, undefined);
        await queryRunner.query(`CREATE INDEX "IDX_eb87ef1e234444728138302263" ON "session" ("activeChannelId") `, undefined);
        await queryRunner.query(`CREATE INDEX "IDX_3d2f174ef04fb312fdebd0ddc5" ON "session" ("userId") `, undefined);
        await queryRunner.query(`CREATE INDEX "IDX_7ee3306d7638aa85ca90d67219" ON "tax_rate" ("categoryId") `, undefined);
        await queryRunner.query(`CREATE INDEX "IDX_9872fc7de2f4e532fd3230d191" ON "tax_rate" ("zoneId") `, undefined);
        await queryRunner.query(`CREATE INDEX "IDX_8b5ab52fc8887c1a769b9276ca" ON "tax_rate" ("customerGroupId") `, undefined);
        await queryRunner.query(`CREATE INDEX "IDX_92f8c334ef06275f9586fd0183" ON "history_entry" ("administratorId") `, undefined);
        await queryRunner.query(`CREATE INDEX "IDX_43ac602f839847fdb91101f30e" ON "history_entry" ("customerId") `, undefined);
        await queryRunner.query(`CREATE INDEX "IDX_3a05127e67435b4d2332ded7c9" ON "history_entry" ("orderId") `, undefined);
        await queryRunner.query(`ALTER TABLE "region_translation" ADD CONSTRAINT "FK_1afd722b943c81310705fc3e612" FOREIGN KEY ("baseId") REFERENCES "region"("id") ON DELETE CASCADE ON UPDATE NO ACTION`, undefined);
        await queryRunner.query(`ALTER TABLE "region" ADD CONSTRAINT "FK_ed0c8098ce6809925a437f42aec" FOREIGN KEY ("parentId") REFERENCES "region"("id") ON DELETE SET NULL ON UPDATE NO ACTION`, undefined);
        await queryRunner.query(`ALTER TABLE "channel" ADD CONSTRAINT "FK_af2116c7e176b6b88dceceeb74b" FOREIGN KEY ("sellerId") REFERENCES "seller"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`, undefined);
        await queryRunner.query(`ALTER TABLE "product_option_translation" ADD CONSTRAINT "FK_a79a443c1f7841f3851767faa6d" FOREIGN KEY ("baseId") REFERENCES "product_option"("id") ON DELETE CASCADE ON UPDATE NO ACTION`, undefined);
        await queryRunner.query(`ALTER TABLE "product_option_group_translation" ADD CONSTRAINT "FK_93751abc1451972c02e033b766c" FOREIGN KEY ("baseId") REFERENCES "product_option_group"("id") ON DELETE CASCADE ON UPDATE NO ACTION`, undefined);
        await queryRunner.query(`ALTER TABLE "stock_level" ADD CONSTRAINT "FK_9950eae3180f39c71978748bd08" FOREIGN KEY ("productVariantId") REFERENCES "product_variant"("id") ON DELETE CASCADE ON UPDATE NO ACTION`, undefined);
        await queryRunner.query(`ALTER TABLE "stock_level" ADD CONSTRAINT "FK_984c48572468c69661a0b7b0494" FOREIGN KEY ("stockLocationId") REFERENCES "stock_location"("id") ON DELETE CASCADE ON UPDATE NO ACTION`, undefined);
        await queryRunner.query(`ALTER TABLE "stock_movement" ADD CONSTRAINT "FK_a2fe7172eeae9f1cca86f8f573a" FOREIGN KEY ("stockLocationId") REFERENCES "stock_location"("id") ON DELETE CASCADE ON UPDATE NO ACTION`, undefined);
        await queryRunner.query(`ALTER TABLE "product_variant_price" ADD CONSTRAINT "FK_e6126cd268aea6e9b31d89af9ab" FOREIGN KEY ("variantId") REFERENCES "product_variant"("id") ON DELETE CASCADE ON UPDATE NO ACTION`, undefined);
        await queryRunner.query(`ALTER TABLE "product_variant_translation" ADD CONSTRAINT "FK_420f4d6fb75d38b9dca79bc43b4" FOREIGN KEY ("baseId") REFERENCES "product_variant"("id") ON DELETE CASCADE ON UPDATE NO ACTION`, undefined);
        await queryRunner.query(`ALTER TABLE "shipping_method_translation" ADD CONSTRAINT "FK_85ec26c71067ebc84adcd98d1a5" FOREIGN KEY ("baseId") REFERENCES "shipping_method"("id") ON DELETE CASCADE ON UPDATE NO ACTION`, undefined);
        await queryRunner.query(`ALTER TABLE "shipping_line" ADD CONSTRAINT "FK_c9f34a440d490d1b66f6829b86c" FOREIGN KEY ("orderId") REFERENCES "order"("id") ON DELETE CASCADE ON UPDATE NO ACTION`, undefined);
        await queryRunner.query(`ALTER TABLE "order_line" ADD CONSTRAINT "FK_6901d8715f5ebadd764466f7bde" FOREIGN KEY ("sellerChannelId") REFERENCES "channel"("id") ON DELETE SET NULL ON UPDATE NO ACTION`, undefined);
        await queryRunner.query(`ALTER TABLE "order_line" ADD CONSTRAINT "FK_dc9ac68b47da7b62249886affba" FOREIGN KEY ("shippingLineId") REFERENCES "shipping_line"("id") ON DELETE SET NULL ON UPDATE NO ACTION`, undefined);
        await queryRunner.query(`ALTER TABLE "order_line" ADD CONSTRAINT "FK_cbcd22193eda94668e84d33f185" FOREIGN KEY ("productVariantId") REFERENCES "product_variant"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`, undefined);
        await queryRunner.query(`ALTER TABLE "order_line_reference" ADD CONSTRAINT "FK_7d57857922dfc7303604697dbe9" FOREIGN KEY ("orderLineId") REFERENCES "order_line"("id") ON DELETE CASCADE ON UPDATE NO ACTION`, undefined);
        await queryRunner.query(`ALTER TABLE "order_line_reference" ADD CONSTRAINT "FK_06b02fb482b188823e419d37bd4" FOREIGN KEY ("fulfillmentId") REFERENCES "fulfillment"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`, undefined);
        await queryRunner.query(`ALTER TABLE "order_line_reference" ADD CONSTRAINT "FK_22b818af8722746fb9f206068c2" FOREIGN KEY ("modificationId") REFERENCES "order_modification"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`, undefined);
        await queryRunner.query(`ALTER TABLE "order_line_reference" ADD CONSTRAINT "FK_30019aa65b17fe9ee9628931991" FOREIGN KEY ("refundId") REFERENCES "refund"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`, undefined);
        await queryRunner.query(`ALTER TABLE "promotion_translation" ADD CONSTRAINT "FK_1cc009e9ab2263a35544064561b" FOREIGN KEY ("baseId") REFERENCES "promotion"("id") ON DELETE CASCADE ON UPDATE NO ACTION`, undefined);
        await queryRunner.query(`ALTER TABLE "order" ADD CONSTRAINT "FK_73a78d7df09541ac5eba620d181" FOREIGN KEY ("aggregateOrderId") REFERENCES "order"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`, undefined);

        // ======================== Step 4 ========================
        // This line needs to be commented out, and moved to after step 5, otherwise
        // the migration fails with a foreign key constraint error.
        // await queryRunner.query(`ALTER TABLE "address" ADD CONSTRAINT "FK_d87215343c3a3a67e6a0b7f3ea9" FOREIGN KEY ("countryId") REFERENCES "region"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`, undefined);

        await queryRunner.query(`ALTER TABLE "payment_method_translation" ADD CONSTRAINT "FK_66187f782a3e71b9e0f5b50b68b" FOREIGN KEY ("baseId") REFERENCES "payment_method"("id") ON DELETE CASCADE ON UPDATE NO ACTION`, undefined);
        await queryRunner.query(`ALTER TABLE "zone_members_region" ADD CONSTRAINT "FK_433f45158e4e2b2a2f344714b22" FOREIGN KEY ("zoneId") REFERENCES "zone"("id") ON DELETE CASCADE ON UPDATE CASCADE`, undefined);
        await queryRunner.query(`ALTER TABLE "zone_members_region" ADD CONSTRAINT "FK_b45b65256486a15a104e17d495c" FOREIGN KEY ("regionId") REFERENCES "region"("id") ON DELETE CASCADE ON UPDATE CASCADE`, undefined);
        await queryRunner.query(`ALTER TABLE "stock_location_channels_channel" ADD CONSTRAINT "FK_39513fd02a573c848d23bee587d" FOREIGN KEY ("stockLocationId") REFERENCES "stock_location"("id") ON DELETE CASCADE ON UPDATE CASCADE`, undefined);
        await queryRunner.query(`ALTER TABLE "stock_location_channels_channel" ADD CONSTRAINT "FK_ff8150fe54e56a900d5712671a0" FOREIGN KEY ("channelId") REFERENCES "channel"("id") ON DELETE CASCADE ON UPDATE CASCADE`, undefined);
        await queryRunner.query(`ALTER TABLE "order_fulfillments_fulfillment" ADD CONSTRAINT "FK_f80d84d525af2ffe974e7e8ca29" FOREIGN KEY ("orderId") REFERENCES "order"("id") ON DELETE CASCADE ON UPDATE CASCADE`, undefined);
        await queryRunner.query(`ALTER TABLE "order_fulfillments_fulfillment" ADD CONSTRAINT "FK_4add5a5796e1582dec2877b2898" FOREIGN KEY ("fulfillmentId") REFERENCES "fulfillment"("id") ON DELETE CASCADE ON UPDATE CASCADE`, undefined);
        await queryRunner.query(`ALTER TABLE "collection_closure" ADD CONSTRAINT "FK_c309f8cd152bbeaea08491e0c66" FOREIGN KEY ("id_ancestor") REFERENCES "collection"("id") ON DELETE CASCADE ON UPDATE NO ACTION`, undefined);
        await queryRunner.query(`ALTER TABLE "collection_closure" ADD CONSTRAINT "FK_457784c710f8ac9396010441f6c" FOREIGN KEY ("id_descendant") REFERENCES "collection"("id") ON DELETE CASCADE ON UPDATE NO ACTION`, undefined);


        // ======================== Step 5 ========================
        // Run the data migrations function
        // Note: if you are using a custom schema (not "public") with postgres,
        // you'll need to pass the schema name as the second argument to the function.
        // e.g.
        //   await vendureV2Migrations(queryRunner, 'my_schema');
        await vendureV2Migrations(queryRunner);

        // ======================== Step 6 ========================
        // Add the line that we commented out in step 4
        await queryRunner.query(`ALTER TABLE "address" ADD CONSTRAINT "FK_d87215343c3a3a67e6a0b7f3ea9" FOREIGN KEY ("countryId") REFERENCES "region"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`, undefined);

        // ======================== Step 7 (optional) ========================
        // If you have any custom fields defined on the Country entity, you'll need to transfer the data over to the
        // new Region entity.
        //
        // await queryRunner.query(`UPDATE "region" SET "customFieldsMycustomfield" = "country"."customFieldsMycustomfield" FROM "country" WHERE "region"."id" = "country"."id"`, undefined);
        //
        // And if any of the custom fields are of type "localeString", you'll need to also transfer that from the
        // country_translation table to the region_translation table:

        // await queryRunner.query(`UPDATE "region_translation" SET "customFieldsMycustomfield" = "country_translation"."customFieldsMycustomfield" FROM "country_translation" WHERE "region_translation"."id" = "country_translation"."id"`, undefined);
    }

    public async down(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query(`ALTER TABLE "collection_closure" DROP CONSTRAINT "FK_457784c710f8ac9396010441f6c"`, undefined);
        await queryRunner.query(`ALTER TABLE "collection_closure" DROP CONSTRAINT "FK_c309f8cd152bbeaea08491e0c66"`, undefined);
        await queryRunner.query(`ALTER TABLE "order_fulfillments_fulfillment" DROP CONSTRAINT "FK_4add5a5796e1582dec2877b2898"`, undefined);
        await queryRunner.query(`ALTER TABLE "order_fulfillments_fulfillment" DROP CONSTRAINT "FK_f80d84d525af2ffe974e7e8ca29"`, undefined);
        await queryRunner.query(`ALTER TABLE "stock_location_channels_channel" DROP CONSTRAINT "FK_ff8150fe54e56a900d5712671a0"`, undefined);
        await queryRunner.query(`ALTER TABLE "stock_location_channels_channel" DROP CONSTRAINT "FK_39513fd02a573c848d23bee587d"`, undefined);
        await queryRunner.query(`ALTER TABLE "zone_members_region" DROP CONSTRAINT "FK_b45b65256486a15a104e17d495c"`, undefined);
        await queryRunner.query(`ALTER TABLE "zone_members_region" DROP CONSTRAINT "FK_433f45158e4e2b2a2f344714b22"`, undefined);
        await queryRunner.query(`ALTER TABLE "payment_method_translation" DROP CONSTRAINT "FK_66187f782a3e71b9e0f5b50b68b"`, undefined);
        await queryRunner.query(`ALTER TABLE "address" DROP CONSTRAINT "FK_d87215343c3a3a67e6a0b7f3ea9"`, undefined);
        await queryRunner.query(`ALTER TABLE "order" DROP CONSTRAINT "FK_73a78d7df09541ac5eba620d181"`, undefined);
        await queryRunner.query(`ALTER TABLE "promotion_translation" DROP CONSTRAINT "FK_1cc009e9ab2263a35544064561b"`, undefined);
        await queryRunner.query(`ALTER TABLE "order_line_reference" DROP CONSTRAINT "FK_30019aa65b17fe9ee9628931991"`, undefined);
        await queryRunner.query(`ALTER TABLE "order_line_reference" DROP CONSTRAINT "FK_22b818af8722746fb9f206068c2"`, undefined);
        await queryRunner.query(`ALTER TABLE "order_line_reference" DROP CONSTRAINT "FK_06b02fb482b188823e419d37bd4"`, undefined);
        await queryRunner.query(`ALTER TABLE "order_line_reference" DROP CONSTRAINT "FK_7d57857922dfc7303604697dbe9"`, undefined);
        await queryRunner.query(`ALTER TABLE "order_line" DROP CONSTRAINT "FK_cbcd22193eda94668e84d33f185"`, undefined);
        await queryRunner.query(`ALTER TABLE "order_line" DROP CONSTRAINT "FK_dc9ac68b47da7b62249886affba"`, undefined);
        await queryRunner.query(`ALTER TABLE "order_line" DROP CONSTRAINT "FK_6901d8715f5ebadd764466f7bde"`, undefined);
        await queryRunner.query(`ALTER TABLE "shipping_line" DROP CONSTRAINT "FK_c9f34a440d490d1b66f6829b86c"`, undefined);
        await queryRunner.query(`ALTER TABLE "shipping_method_translation" DROP CONSTRAINT "FK_85ec26c71067ebc84adcd98d1a5"`, undefined);
        await queryRunner.query(`ALTER TABLE "product_variant_translation" DROP CONSTRAINT "FK_420f4d6fb75d38b9dca79bc43b4"`, undefined);
        await queryRunner.query(`ALTER TABLE "product_variant_price" DROP CONSTRAINT "FK_e6126cd268aea6e9b31d89af9ab"`, undefined);
        await queryRunner.query(`ALTER TABLE "stock_movement" DROP CONSTRAINT "FK_a2fe7172eeae9f1cca86f8f573a"`, undefined);
        await queryRunner.query(`ALTER TABLE "stock_level" DROP CONSTRAINT "FK_984c48572468c69661a0b7b0494"`, undefined);
        await queryRunner.query(`ALTER TABLE "stock_level" DROP CONSTRAINT "FK_9950eae3180f39c71978748bd08"`, undefined);
        await queryRunner.query(`ALTER TABLE "product_option_group_translation" DROP CONSTRAINT "FK_93751abc1451972c02e033b766c"`, undefined);
        await queryRunner.query(`ALTER TABLE "product_option_translation" DROP CONSTRAINT "FK_a79a443c1f7841f3851767faa6d"`, undefined);
        await queryRunner.query(`ALTER TABLE "channel" DROP CONSTRAINT "FK_af2116c7e176b6b88dceceeb74b"`, undefined);
        await queryRunner.query(`ALTER TABLE "region" DROP CONSTRAINT "FK_ed0c8098ce6809925a437f42aec"`, undefined);
        await queryRunner.query(`ALTER TABLE "region_translation" DROP CONSTRAINT "FK_1afd722b943c81310705fc3e612"`, undefined);
        await queryRunner.query(`DROP INDEX "public"."IDX_3a05127e67435b4d2332ded7c9"`, undefined);
        await queryRunner.query(`DROP INDEX "public"."IDX_43ac602f839847fdb91101f30e"`, undefined);
        await queryRunner.query(`DROP INDEX "public"."IDX_92f8c334ef06275f9586fd0183"`, undefined);
        await queryRunner.query(`DROP INDEX "public"."IDX_8b5ab52fc8887c1a769b9276ca"`, undefined);
        await queryRunner.query(`DROP INDEX "public"."IDX_9872fc7de2f4e532fd3230d191"`, undefined);
        await queryRunner.query(`DROP INDEX "public"."IDX_7ee3306d7638aa85ca90d67219"`, undefined);
        await queryRunner.query(`DROP INDEX "public"."IDX_3d2f174ef04fb312fdebd0ddc5"`, undefined);
        await queryRunner.query(`DROP INDEX "public"."IDX_eb87ef1e234444728138302263"`, undefined);
        await queryRunner.query(`DROP INDEX "public"."IDX_7a75399a4f4ffa48ee02e98c05"`, undefined);
        await queryRunner.query(`DROP INDEX "public"."IDX_d87215343c3a3a67e6a0b7f3ea"`, undefined);
        await queryRunner.query(`DROP INDEX "public"."IDX_dc34d382b493ade1f70e834c4d"`, undefined);
        await queryRunner.query(`DROP INDEX "public"."IDX_124456e637cca7a415897dce65"`, undefined);
        await queryRunner.query(`DROP INDEX "public"."IDX_729b3eea7ce540930dbb706949"`, undefined);
        await queryRunner.query(`DROP INDEX "public"."IDX_73a78d7df09541ac5eba620d18"`, undefined);
        await queryRunner.query(`DROP INDEX "public"."IDX_1df5bc14a47ef24d2e681f4559"`, undefined);
        await queryRunner.query(`DROP INDEX "public"."IDX_a49c5271c39cc8174a0535c808"`, undefined);
        await queryRunner.query(`DROP INDEX "public"."IDX_154eb685f9b629033bd266df7f"`, undefined);
        await queryRunner.query(`DROP INDEX "public"."IDX_d09d285fe1645cd2f0db811e29"`, undefined);
        await queryRunner.query(`DROP INDEX "public"."IDX_1c6932a756108788a361e7d440"`, undefined);
        await queryRunner.query(`DROP INDEX "public"."IDX_239cfca2a55b98b90b6bef2e44"`, undefined);
        await queryRunner.query(`DROP INDEX "public"."IDX_9f065453910ea77d4be8e92618"`, undefined);
        await queryRunner.query(`DROP INDEX "public"."IDX_77be94ce9ec650446617946227"`, undefined);
        await queryRunner.query(`DROP INDEX "public"."IDX_cbcd22193eda94668e84d33f18"`, undefined);
        await queryRunner.query(`DROP INDEX "public"."IDX_dc9ac68b47da7b62249886affb"`, undefined);
        await queryRunner.query(`DROP INDEX "public"."IDX_6901d8715f5ebadd764466f7bd"`, undefined);
        await queryRunner.query(`DROP INDEX "public"."IDX_c9f34a440d490d1b66f6829b86"`, undefined);
        await queryRunner.query(`DROP INDEX "public"."IDX_e2e7642e1e88167c1dfc827fdf"`, undefined);
        await queryRunner.query(`DROP INDEX "public"."IDX_85ec26c71067ebc84adcd98d1a"`, undefined);
        await queryRunner.query(`DROP INDEX "public"."IDX_6e420052844edf3a5506d863ce"`, undefined);
        await queryRunner.query(`DROP INDEX "public"."IDX_e38dca0d82fd64c7cf8aac8b8e"`, undefined);
        await queryRunner.query(`DROP INDEX "public"."IDX_0e6f516053cf982b537836e21c"`, undefined);
        await queryRunner.query(`DROP INDEX "public"."IDX_420f4d6fb75d38b9dca79bc43b"`, undefined);
        await queryRunner.query(`DROP INDEX "public"."IDX_e6126cd268aea6e9b31d89af9a"`, undefined);
        await queryRunner.query(`DROP INDEX "public"."IDX_fa21412afac15a2304f3eb35fe"`, undefined);
        await queryRunner.query(`DROP INDEX "public"."IDX_10b5a2e3dee0e30b1e26c32f5c"`, undefined);
        await queryRunner.query(`DROP INDEX "public"."IDX_d2c8d5fca981cc820131f81aa8"`, undefined);
        await queryRunner.query(`DROP INDEX "public"."IDX_a2fe7172eeae9f1cca86f8f573"`, undefined);
        await queryRunner.query(`DROP INDEX "public"."IDX_e65ba3882557cab4febb54809b"`, undefined);
        await queryRunner.query(`DROP INDEX "public"."IDX_91a19e6613534949a4ce6e76ff"`, undefined);
        await queryRunner.query(`DROP INDEX "public"."IDX_7dbc75cb4e8b002620c4dbfdac"`, undefined);
        await queryRunner.query(`DROP INDEX "public"."IDX_f4a2ec16ba86d277b6faa0b67b"`, undefined);
        await queryRunner.query(`DROP INDEX "public"."IDX_0d1294f5c22a56da7845ebab72"`, undefined);
        await queryRunner.query(`DROP INDEX "public"."IDX_5888ac17b317b93378494a1062"`, undefined);
        await queryRunner.query(`DROP INDEX "public"."IDX_a6e91739227bf4d442f23c52c7"`, undefined);
        await queryRunner.query(`DROP INDEX "public"."IDX_93751abc1451972c02e033b766"`, undefined);
        await queryRunner.query(`DROP INDEX "public"."IDX_a6debf9198e2fbfa006aa10d71"`, undefined);
        await queryRunner.query(`DROP INDEX "public"."IDX_a79a443c1f7841f3851767faa6"`, undefined);
        await queryRunner.query(`DROP INDEX "public"."IDX_d101dc2265a7341be3d94968c5"`, undefined);
        await queryRunner.query(`DROP INDEX "public"."IDX_3d6e45823b65de808a66cb1423"`, undefined);
        await queryRunner.query(`DROP INDEX "public"."IDX_eaea53f44bf9e97790d38a3d68"`, undefined);
        await queryRunner.query(`DROP INDEX "public"."IDX_7256fef1bb42f1b38156b7449f"`, undefined);
        await queryRunner.query(`DROP INDEX "public"."IDX_e329f9036210d75caa1d8f2154"`, undefined);
        await queryRunner.query(`DROP INDEX "public"."IDX_9f9da7d94b0278ea0f7831e1fc"`, undefined);
        await queryRunner.query(`DROP INDEX "public"."IDX_1ed9e48dfbf74b5fcbb35d3d68"`, undefined);
        await queryRunner.query(`DROP INDEX "public"."IDX_51da53b26522dc0525762d2de8"`, undefined);
        await queryRunner.query(`DROP INDEX "public"."IDX_c9ca2f58d4517460435cbd8b4c"`, undefined);
        await queryRunner.query(`DROP INDEX "public"."IDX_afe9f917a1c82b9e9e69f7c612"`, undefined);
        await queryRunner.query(`DROP INDEX "public"."IDX_af2116c7e176b6b88dceceeb74"`, undefined);
        await queryRunner.query(`DROP INDEX "public"."IDX_00cbe87bc0d4e36758d61bd31d"`, undefined);
        await queryRunner.query(`ALTER TABLE "order_line" ALTER COLUMN "productVariantId" DROP NOT NULL`, undefined);
        await queryRunner.query(`ALTER TABLE "order_line" ADD CONSTRAINT "FK_cbcd22193eda94668e84d33f185" FOREIGN KEY ("productVariantId") REFERENCES "product_variant"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`, undefined);
        await queryRunner.query(`ALTER TABLE "product_variant_price" ALTER COLUMN "channelId" SET NOT NULL`, undefined);
        await queryRunner.query(`ALTER TABLE "order" DROP COLUMN "aggregateOrderId"`, undefined);
        await queryRunner.query(`ALTER TABLE "order" DROP COLUMN "type"`, undefined);
        await queryRunner.query(`ALTER TABLE "order_line" DROP COLUMN "listPrice"`, undefined);
        await queryRunner.query(`ALTER TABLE "order_line" DROP COLUMN "initialListPrice"`, undefined);
        await queryRunner.query(`ALTER TABLE "order_line" DROP COLUMN "shippingLineId"`, undefined);
        await queryRunner.query(`ALTER TABLE "order_line" DROP COLUMN "sellerChannelId"`, undefined);
        await queryRunner.query(`ALTER TABLE "order_line" DROP COLUMN "taxLines"`, undefined);
        await queryRunner.query(`ALTER TABLE "order_line" DROP COLUMN "adjustments"`, undefined);
        await queryRunner.query(`ALTER TABLE "order_line" DROP COLUMN "listPriceIncludesTax"`, undefined);
        await queryRunner.query(`ALTER TABLE "order_line" DROP COLUMN "orderPlacedQuantity"`, undefined);
        await queryRunner.query(`ALTER TABLE "order_line" DROP COLUMN "quantity"`, undefined);
        await queryRunner.query(`ALTER TABLE "product_variant_price" DROP COLUMN "currencyCode"`, undefined);
        await queryRunner.query(`ALTER TABLE "collection" DROP COLUMN "inheritFilters"`, undefined);
        await queryRunner.query(`ALTER TABLE "channel" DROP COLUMN "sellerId"`, undefined);
        await queryRunner.query(`ALTER TABLE "channel" DROP COLUMN "outOfStockThreshold"`, undefined);
        await queryRunner.query(`ALTER TABLE "channel" DROP COLUMN "trackInventory"`, undefined);
        await queryRunner.query(`ALTER TABLE "channel" DROP COLUMN "availableCurrencyCodes"`, undefined);
        await queryRunner.query(`ALTER TABLE "channel" DROP COLUMN "defaultCurrencyCode"`, undefined);
        await queryRunner.query(`ALTER TABLE "channel" DROP COLUMN "availableLanguageCodes"`, undefined);
        await queryRunner.query(`ALTER TABLE "channel" DROP COLUMN "description"`, undefined);
        await queryRunner.query(`ALTER TABLE "payment_method" ADD "description" character varying NOT NULL DEFAULT ''`, undefined);
        await queryRunner.query(`ALTER TABLE "payment_method" ADD "name" character varying NOT NULL DEFAULT ''`, undefined);
        await queryRunner.query(`ALTER TABLE "promotion" ADD "name" character varying NOT NULL`, undefined);
        await queryRunner.query(`ALTER TABLE "product_variant" ADD "stockAllocated" integer NOT NULL DEFAULT '0'`, undefined);
        await queryRunner.query(`ALTER TABLE "product_variant" ADD "stockOnHand" integer NOT NULL DEFAULT '0'`, undefined);
        await queryRunner.query(`ALTER TABLE "channel" ADD "currencyCode" character varying NOT NULL`, undefined);
        await queryRunner.query(`DROP INDEX "public"."IDX_457784c710f8ac9396010441f6"`, undefined);
        await queryRunner.query(`DROP INDEX "public"."IDX_c309f8cd152bbeaea08491e0c6"`, undefined);
        await queryRunner.query(`DROP TABLE "collection_closure"`, undefined);
        await queryRunner.query(`DROP INDEX "public"."IDX_4add5a5796e1582dec2877b289"`, undefined);
        await queryRunner.query(`DROP INDEX "public"."IDX_f80d84d525af2ffe974e7e8ca2"`, undefined);
        await queryRunner.query(`DROP TABLE "order_fulfillments_fulfillment"`, undefined);
        await queryRunner.query(`DROP INDEX "public"."IDX_ff8150fe54e56a900d5712671a"`, undefined);
        await queryRunner.query(`DROP INDEX "public"."IDX_39513fd02a573c848d23bee587"`, undefined);
        await queryRunner.query(`DROP TABLE "stock_location_channels_channel"`, undefined);
        await queryRunner.query(`DROP INDEX "public"."IDX_b45b65256486a15a104e17d495"`, undefined);
        await queryRunner.query(`DROP INDEX "public"."IDX_433f45158e4e2b2a2f344714b2"`, undefined);
        await queryRunner.query(`DROP TABLE "zone_members_region"`, undefined);
        await queryRunner.query(`DROP INDEX "public"."IDX_66187f782a3e71b9e0f5b50b68"`, undefined);
        await queryRunner.query(`DROP TABLE "payment_method_translation"`, undefined);
        await queryRunner.query(`DROP INDEX "public"."IDX_1cc009e9ab2263a35544064561"`, undefined);
        await queryRunner.query(`DROP TABLE "promotion_translation"`, undefined);
        await queryRunner.query(`DROP INDEX "public"."IDX_49a8632be8cef48b076446b8b9"`, undefined);
        await queryRunner.query(`DROP INDEX "public"."IDX_30019aa65b17fe9ee962893199"`, undefined);
        await queryRunner.query(`DROP INDEX "public"."IDX_22b818af8722746fb9f206068c"`, undefined);
        await queryRunner.query(`DROP INDEX "public"."IDX_06b02fb482b188823e419d37bd"`, undefined);
        await queryRunner.query(`DROP INDEX "public"."IDX_7d57857922dfc7303604697dbe"`, undefined);
        await queryRunner.query(`DROP TABLE "order_line_reference"`, undefined);
        await queryRunner.query(`DROP INDEX "public"."IDX_7fc20486b8cfd33dc84c96e168"`, undefined);
        await queryRunner.query(`DROP INDEX "public"."IDX_984c48572468c69661a0b7b049"`, undefined);
        await queryRunner.query(`DROP INDEX "public"."IDX_9950eae3180f39c71978748bd0"`, undefined);
        await queryRunner.query(`DROP TABLE "stock_level"`, undefined);
        await queryRunner.query(`DROP TABLE "stock_location"`, undefined);
        await queryRunner.query(`DROP INDEX "public"."IDX_ed0c8098ce6809925a437f42ae"`, undefined);
        await queryRunner.query(`DROP TABLE "region"`, undefined);
        await queryRunner.query(`DROP INDEX "public"."IDX_1afd722b943c81310705fc3e61"`, undefined);
        await queryRunner.query(`DROP TABLE "region_translation"`, undefined);
        await queryRunner.query(`DROP TABLE "seller"`, undefined);
        await queryRunner.query(`ALTER TABLE "stock_movement" RENAME COLUMN "stockLocationId" TO "orderItemId"`, undefined);
        await queryRunner.query(`ALTER TABLE "address" ADD CONSTRAINT "FK_d87215343c3a3a67e6a0b7f3ea9" FOREIGN KEY ("countryId") REFERENCES "country"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`, undefined);
        await queryRunner.query(`ALTER TABLE "shipping_line" ADD CONSTRAINT "FK_c9f34a440d490d1b66f6829b86c" FOREIGN KEY ("orderId") REFERENCES "order"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`, undefined);
        await queryRunner.query(`ALTER TABLE "shipping_method_translation" ADD CONSTRAINT "FK_85ec26c71067ebc84adcd98d1a5" FOREIGN KEY ("baseId") REFERENCES "shipping_method"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`, undefined);
        await queryRunner.query(`ALTER TABLE "product_variant_translation" ADD CONSTRAINT "FK_420f4d6fb75d38b9dca79bc43b4" FOREIGN KEY ("baseId") REFERENCES "product_variant"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`, undefined);
        await queryRunner.query(`ALTER TABLE "product_variant_price" ADD CONSTRAINT "FK_e6126cd268aea6e9b31d89af9ab" FOREIGN KEY ("variantId") REFERENCES "product_variant"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`, undefined);
        await queryRunner.query(`ALTER TABLE "stock_movement" ADD CONSTRAINT "FK_cbb0990e398bf7713aebdd38482" FOREIGN KEY ("orderItemId") REFERENCES "order_item"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`, undefined);
        await queryRunner.query(`ALTER TABLE "product_option_group_translation" ADD CONSTRAINT "FK_93751abc1451972c02e033b766c" FOREIGN KEY ("baseId") REFERENCES "product_option_group"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`, undefined);
        await queryRunner.query(`ALTER TABLE "product_option_translation" ADD CONSTRAINT "FK_a79a443c1f7841f3851767faa6d" FOREIGN KEY ("baseId") REFERENCES "product_option"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`, undefined);
    }

}
