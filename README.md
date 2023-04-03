# Vendure v2 Migration Testbed

This repo is being used to test migration of a Vendure v1 project to v2.

## Setup

You'll need a local postgres instance running, with a database named `v2-migration-testbed`. Adjust the
credentials in the `.env` file as needed.

## Test Sequence

1. With v1.x installed, run `yarn populate`.
2. Run `yarn test` to run the tests against v1.x.
3. Now update all Vendure packages to v2.x.
    - (Windows) Add `"resolutions": { "typeorm": "0.3.11"  }` to package.json due to this TypeORM bug preventing migrations from
      being detected on Windows: https://github.com/typeorm/typeorm/issues/9766
    - If you run into ` Cannot find module '@ardatan/aggregate-error'` errors, try `rm -rf node_modules && rm yarn.lock && yarn --registry=http://localhost:4873`
4. Run `yarn migrate` to run the migrations.
5. Run `yarn test` to run the tests against v2.x.

## Testing MySQL

By default, the tests will run against a Postgres database. To run against MySQL, you'll need to set up a local MySQL or MariaDB
instance, and then set the `DB` environment variable to `mysql`.

## Status

This is currently a work-in-progress. Steps 1 and 2 are complete, and step 3 can be done only by building a local
version of v2 from the `major` branch of the Vendure repo, and e.g. publishing it to a local Verdaccio instance.

The migration is still under development, but you can see the current state of the migration script in
[src/migrations/1679494011869-v2.ts](src/migrations/1679494011869-v2.ts).
