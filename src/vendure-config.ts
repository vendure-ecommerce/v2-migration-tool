import "dotenv/config";
import {
    dummyPaymentHandler,
    DefaultJobQueuePlugin,
    DefaultSearchPlugin,
    VendureConfig,
} from "@vendure/core";
import { defaultEmailHandlers, EmailPlugin } from "@vendure/email-plugin";
import { AssetServerPlugin } from "@vendure/asset-server-plugin";
import { AdminUiPlugin } from "@vendure/admin-ui-plugin";
import path from "path";

const IS_DEV = process.env.APP_ENV === "dev";
const isVendureV2 =
    require("../package.json").devDependencies["@vendure/core"].startsWith("2");
const DB = process.env.DB === "mysql" ? "mysql" : "postgres";

export const config: VendureConfig = {
    apiOptions: {
        port: 3000,
        adminApiPath: "admin-api",
        shopApiPath: "shop-api",
        // The following options are useful in development mode,
        // but are best turned off for production for security
        // reasons.
        ...(IS_DEV
            ? {
                  adminApiPlayground: {
                      settings: { "request.credentials": "include" } as any,
                  },
                  adminApiDebug: true,
                  shopApiPlayground: {
                      settings: { "request.credentials": "include" } as any,
                  },
                  shopApiDebug: true,
              }
            : {}),
    },
    authOptions: {
        tokenMethod: ["bearer", "cookie"],
        superadminCredentials: {
            identifier: process.env.SUPERADMIN_USERNAME,
            password: process.env.SUPERADMIN_PASSWORD,
        },
        cookieOptions: {
            secret: process.env.COOKIE_SECRET,
        },
    },
    dbConnectionOptions: {
        // See the README.md "Migrations" section for an explanation of
        // the `synchronize` and `migrations` options.
        synchronize: false,
        migrations: [
            path.join(__dirname, "./migrations/*.+(js|ts)").replace(/\\/g, "/"),
        ],
        logging: ["error", "schema"],
        ...getDbConnectionOption(DB),
    },
    paymentOptions: {
        paymentMethodHandlers: [dummyPaymentHandler],
    },
    // When adding or altering custom field definitions, the database will
    // need to be updated. See the "Migrations" section in README.md.
    customFields: {},
    plugins: [
        ...(isVendureV2 && !process.env.VITEST
            ? [require("./lib/migration-v2.plugin").MigrationV2Plugin]
            : []),
        AssetServerPlugin.init({
            route: "assets",
            assetUploadDir: path.join(__dirname, "../static/assets"),
            // For local dev, the correct value for assetUrlPrefix should
            // be guessed correctly, but for production it will usually need
            // to be set manually to match your production url.
            assetUrlPrefix: IS_DEV
                ? undefined
                : "https://www.my-shop.com/assets",
        }),
        DefaultJobQueuePlugin.init({ useDatabaseForBuffer: true }),
        DefaultSearchPlugin.init({
            bufferUpdates: false,
            indexStockStatus: true,
        }),
        AdminUiPlugin.init({
            route: "admin",
            port: 3002,
        }),
    ],
};

function getDbConnectionOption(db: "postgres" | "mysql") {
    if (db === "postgres") {
        return {
            type: "postgres" as const,
            database: process.env.POSTGRES_DB_NAME,
            schema: process.env.POSTGRES_DB_SCHEMA,
            host: process.env.POSTGRES_DB_HOST,
            port: +process.env.POSTGRES_DB_PORT,
            username: process.env.POSTGRES_DB_USERNAME,
            password: process.env.POSTGRES_DB_PASSWORD,
        };
    } else {
        return {
            type: "mariadb" as const,
            database: process.env.MYSQL_DB_NAME,
            host: process.env.MYSQL_DB_HOST,
            port: +process.env.MYSQL_DB_PORT,
            username: process.env.MYSQL_DB_USERNAME,
            password: process.env.MYSQL_DB_PASSWORD,
        };
    }
}
