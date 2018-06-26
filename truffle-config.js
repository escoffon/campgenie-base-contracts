module.exports = {
    // apparently works for compile but not for migrate
    // contracts_build_directory: "../public/truffle/build/contracts",

    networks: {
	development: {
	    host: "localhost",
	    port: 8545,
	    network_id: "*", // Match any network id
	    // The sandbox contract used by truffle Solidity testing takes 5741753 gas, so we need to
	    // set up a large default gas value (I couldn't figure out if and where to set the transaction
	    // gas for the "before all" hook)
	    // Note that ganache also needs to bump its gas limit, for example:
	    // ganache -l 6000000
	    gas: 5900000
	},

	// Another name for the development network; but this requires migrating the contracts before testing
	ganache: {
	    host: "localhost",
	    port: 8545,
	    network_id: "*",
	    gas: 5900000
	},

	// geth running locally at chain id 616
	localgeth: {
	    host: "localhost",
	    port: 8888,
	    network_id: "616",
	    gas: 5900000,
	    from: '0x226f0d3bd4f6efc7bbf30daaaac4ec7e83d773cd' // This is eth.accounts[1] on geth
	}
    },
    mocha: {
	reporter: 'spec'
	// reporter: 'list'
	// reporter: 'doc'
	// reporter: 'html'
    }
};
