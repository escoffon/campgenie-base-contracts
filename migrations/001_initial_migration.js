const mu = require('./utils');

let Migrations = artifacts.require("./contracts/Migrations.sol");

module.exports = function(deployer, network, accounts) {
    deployer.deploy(Migrations)
	.then(function() {
		  mu.saveAddress(Migrations, Migrations.address);
	      });
};
