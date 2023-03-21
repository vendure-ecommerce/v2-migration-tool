# Vendure v2 Migration Testbed

This repo is being used to test migration of a Vendure v1 project to v2.

## Setup

You'll need a local postgres instance running, with a database named `v2-migration-testbed`. Adjust the
credentials in the `.env` file as needed.

## Test Sequence

1. With v1.x installed, run `yarn populate`.
2. Run `yarn test` to run the tests against v1.x.
3. Now update all Vendure packages to v2.x.
4. Run `yarn migrate` to run the migrations.
5. Run `yarn test` to run the tests against v2.x.
