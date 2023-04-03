export {};

// Here we declare the members of the process.env object, so that we
// can use them in our application code in a type-safe manner.
declare global {
    namespace NodeJS {
        interface ProcessEnv {
            APP_ENV: string;
            COOKIE_SECRET: string;
            SUPERADMIN_USERNAME: string;
            SUPERADMIN_PASSWORD: string;
            POSTGRES_DB_HOST: string;
            POSTGRES_DB_PORT: number;
            POSTGRES_DB_NAME: string;
            POSTGRES_DB_USERNAME: string;
            POSTGRES_DB_PASSWORD: string;
            POSTGRES_DB_SCHEMA: string;
            MYSQL_DB_HOST: string;
            MYSQL_DB_PORT: number;
            MYSQL_DB_NAME: string;
            MYSQL_DB_USERNAME: string;
            MYSQL_DB_PASSWORD: string;
        }
    }
}
