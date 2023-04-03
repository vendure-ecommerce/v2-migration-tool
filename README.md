# Vendure v2 Migration Tool

This is a tool used to migrate your data from the Vendure v1.x DB schema to v2.0.0. 

## Migrating from Vendure v1 to v2

1. Install this package: `npm install @vendure/migrate-v2`
2. Update all your Vendure packages to the latest v2 versions. 
    - If you are on Windows, the current version of TypeORM (0.3.12) has [a bug](https://github.com/typeorm/typeorm/issues/9766) which will prevent migrations from running. Use the [npm "overrides"](https://docs.npmjs.com/cli/v8/configuring-npm/package-json#overrides) or [yarn "resolutions"](https://classic.yarnpkg.com/lang/en/docs/selective-version-resolutions/) feature to force v0.3.11 to be installed. e.g.
      ```
      {
        "resolutions": { "typeorm": "0.3.11" } // for yarn 
        "overrides": { "typeorm": "0.3.11" } // for npm 
      }
      ```
    - Note, if you run into the error `"Cannot find module '@ardatan/aggregate-error'"`, delete node_modules and the lockfile and reinstall.
3. Add the `MigrationV2Plugin` to your plugins array:
   ```ts
   import { MigrationV2Plugin } from '@vendure/migrate-v2';
   
   //...
   const config: VendureConfig = {
     //..
     plugins: [
       MigrationV2Plugin,
     ]
   }
   ```
   The sole function of this plugin is to temporarily remove some "NOT NULL" constraints from certain columns, which allows us to run the next part of the migration.
4. Generate a new migration file, `npm run migration:generate v2`
5. Edit the newly-created migration file by following the comments in these examples: 
    - [postgres](./src/migrations/1679907976277-v2-postgres.ts)
    - [mysql](./src/migrations/1680512443002-v2-mysql.ts)

   In your migrations files, you'll import the `vendureV2Migrations` from `@vendure/migrate-v2`.
6. Run the migration with `npm run migration:run`.
7. Upon successful migration, remove the `MigrationV2Plugin` from your plugins array, and generate _another_ migration. This one will add back the missing "NOT NULL" constraints now that all your data has been successfully migrated.

## Development

This repo is used to develop and test migration of a Vendure v1 project to v2.

### Setup

You'll need a local postgres instance running, with a database named `v2-migration-testbed`. Adjust the
credentials in the `.env` file as needed.

### Test Sequence

1. With v1.x installed, run `yarn populate`.
2. Run `yarn test` to run the tests against v1.x.
3. Now update all Vendure packages to v2.0.0-beta.x
    - (Windows) Add `"resolutions": { "typeorm": "0.3.11"  }` to package.json due to this TypeORM bug preventing migrations from
      being detected on Windows: https://github.com/typeorm/typeorm/issues/9766
    - If you run into ` Cannot find module '@ardatan/aggregate-error'` errors, try `rm -rf node_modules && rm yarn.lock && yarn --registry=http://localhost:4873`
4. Run `yarn migrate` to run the migrations.
5. Run `yarn test` to run the tests against v2.x.

### Testing MySQL

By default, the tests will run against a Postgres database. To run against MySQL, you'll need to set up a local MySQL or MariaDB
instance, and then set the `DB` environment variable to `mysql`.
