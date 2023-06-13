# Vendure v2 Migration Tool

This is a tool used to migrate your data from the Vendure v1.x DB schema to v2.0.0. 

## Migrating your DB from Vendure v1 to v2

**Important** It is _critical_ that you back up your data prior to attempting this migration.

Note for **MySQL/MariaDB users**: transactions for migrations are [not supported by these databases](https://dev.mysql.com/doc/refman/5.7/en/cannot-roll-back.html).
This means that if the
migration fails for some reason, the statements that have executed will not get rolled back, and your DB schema can be left
in an inconsistent state from which is it can be hard to recover. Therefore, it is doubly critical that you have a good
backup that you can easily restore prior to attempting this migration.

---

1. Install this package: `npm install @vendure/migrate-v2`
2. Update all your Vendure packages to the latest v2 versions.
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
4. Generate a new migration file, `npm run migration:generate v2` (where `v2` is the name of the migration, which you can choose).
5. Edit the newly-created migration file by following the comments in these examples: 
    - [postgres](./src/migrations/1686649098749-v201-postgres.ts)
    - [mysql](./src/migrations/1686655918823-v201-mysql.ts)

   In your migrations files, you'll import the `vendureV2Migrations` from `@vendure/migrate-v2`.
6. Run the migration with `npm run migration:run`.
7. Upon successful migration, remove the `MigrationV2Plugin` from your plugins array, and generate _another_ migration. This one will add back the missing "NOT NULL" constraints now that all your data has been successfully migrated.

### Reporting issues

If you run into issues when attempting to migrate per the instructions above, please [create an issue](https://github.com/vendure-ecommerce/v2-migration-tool/issues/new) describing what you ran into. 

The same goes for if you discover that some data has not migrated correctly, of if you have any suggestions on how to improve the migration experience.

---

## Development

The following instructions relate to building and running this repo for development purposes.

### Setup

You'll need a local postgres instance running, with a database named `v2-migration-testbed`. Adjust the
credentials in the `.env` file as needed.

### Test Sequence

1. With v1.x installed, run `yarn populate`.
2. Run `yarn test` to run the tests against v1.x.
3. Now update all Vendure packages to v2.x
    - If you run into ` Cannot find module '@ardatan/aggregate-error'` errors, try `rm -rf node_modules && rm yarn.lock && yarn`
4. Run `yarn migrate` to run the migrations.
5. Run `yarn test` to run the tests against v2.x.

### Testing MySQL

By default, the tests will run against a Postgres database. To run against MySQL, you'll need to set up a local MySQL or MariaDB
instance, and then set the `DB` environment variable to `mysql`.
