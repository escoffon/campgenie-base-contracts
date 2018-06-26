# CampGenie base token and reward contracts

This package contains the base classes for the CampGenie token and reward
Ethereum [smart contracts](https://en.wikipedia.org/wiki/Smart_contract).

## Setup

This package uses [Truffle](https://github.com/ConsenSys/truffle) for development and contract management.
Install it with [npm](https://www.npmjs.com):

    npm i [--save-dev] git+https://github.com/escoffon/campgenie-base-contracts.git

## Development

You can access the base classes in your Solidity code like this:

    import 'campgenie-base-contracts/contracts/CGRewarderBase.sol';

    contract CGRewarderBaseTester is CGRewarderBase {
        ...
    }

The artifact files (compiled contracts) need to reside in a location accessible to your application
(*i.e.* in the `public` directory), for use by the Web3 glue code. The `contracts_build_directory`
configuration option in `truffle.js` works fine for `compile`, but does not seem to work for `migrate`,
so we have provided wrappers for the commands in `scripts/compile.sh` and `scripts/migrate.sh`.
You should use those wrappers instead of naked calls to `truffle compile` or `truffle migrate`.

The Truffle sandboxing feature works fine, but it has its quirks, and that causes some tests to fail if
run in the same session, so we also provide a test wrapper that executes each test file separately:
instead of running `truffle test`, use the wrapper `scripts/test.sh`.

Finally, there is a script (`scripts/ganache.sh`) that you can use to start a ganache client configured
for testing. You can start it so that it keeps its database across runs, which is nice for testing the
application UI. Run `scripts/ganache.sh -h` for information about the available options.
