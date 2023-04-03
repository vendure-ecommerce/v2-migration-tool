import {
    Channel,
    EntityMetadataModifier,
    OrderLine,
    PluginCommonModule,
    ProductVariantPrice,
    StockMovement,
    Type,
    VendureEntity,
    VendurePlugin,
} from "@vendure/core";

@VendurePlugin({
    imports: [PluginCommonModule],
    configuration: (config) => {
        config.entityOptions.metadataModifiers.push(removeNotNullConstraints);
        return config;
    },
})
export class MigrationV2Plugin {}

/**
 * @description
 * A number of columns are defined as `NOT NULL` and do not provide default values.
 * This means that when attempting a migration, the migration will fail due to the
 * lack of default value. So this modifier will remove those `NOT NULL` constraints.
 *
 * After the migration has run, and the MigrationV2Plugin has been removed from the
 * plugins array, a new migration should be generated to add the `NOT NULL` constraints
 * again.
 */
const removeNotNullConstraints: EntityMetadataModifier = (metadata) => {
    const columnsToModify = new Map<Type<VendureEntity>, string[]>([
        [Channel, ["defaultCurrencyCode"]],
        [ProductVariantPrice, ["currencyCode"]],
        [StockMovement as any, ["stockLocationId"]],
        [
            OrderLine,
            [
                "quantity",
                "adjustments",
                "taxLines",
                "listPrice",
                "listPriceIncludesTax",
            ],
        ],
    ]);
    for (const [entity, columns] of columnsToModify) {
        for (const column of columns) {
            const descriptionColumnIndex = metadata.columns.findIndex(
                (col) => col.propertyName === column && col.target === entity
            );
            if (-1 < descriptionColumnIndex) {
                metadata.columns[descriptionColumnIndex].options.nullable =
                    true;
            }
        }
    }
};

