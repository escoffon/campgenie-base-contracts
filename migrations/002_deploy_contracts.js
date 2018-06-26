let CGTokenBase = artifacts.require("./contracts/CGTokenBase.sol");
let CGTokenBaseTester = artifacts.require("./contracts/mocks/CGTokenBaseTester.sol");
let CGMintableTester = artifacts.require("./contracts/mocks/CGMintableTester.sol");
let CGMintableTokenBaseTester = artifacts.require("./contracts/mocks/CGMintableTokenBaseTester.sol");
let CGRewarderBaseTester = artifacts.require("./contracts/mocks/CGRewarderBaseTester.sol");

const mu = require('./utils');

module.exports = function(deployer, network, accounts) {
    // We deploy only with test networks

    if ((network == 'development') || (network == 'ganache') || (network == 'localgeth'))
    {
	deployer.deploy(CGTokenBaseTester, 1000, 4, '0x0', 0)
	    .then(function() {
		      mu.saveAddress(CGTokenBaseTester, CGTokenBaseTester.address);
		      deployer.logger.log("Deployed CGTokenBaseTester at " + CGTokenBaseTester.address);
		      return deployer.deploy(CGRewarderBaseTester, CGTokenBaseTester.address);
		  })
	    .then(function() {
		      mu.saveAddress(CGRewarderBaseTester, CGRewarderBaseTester.address);
		      deployer.logger.log("Deployed CGRewarderBaseTester at " + CGRewarderBaseTester.address);
		      return deployer.deploy(CGMintableTester);
		  })
	    .then(function() {
		      mu.saveAddress(CGMintableTester, CGMintableTester.address);
		      deployer.logger.log("Deployed CGMintableTester at " + CGMintableTester.address);
		      return deployer.deploy(CGMintableTokenBaseTester, '100', '1');
		  })
	    .then(function() {
		      mu.saveAddress(CGMintableTokenBaseTester, CGMintableTokenBaseTester.address);
		      deployer.logger.log("Deployed CGMintableTokenBaseTester at " + CGMintableTokenBaseTester.address);
		  })
	    .catch(function(e) {
		       deployer.logger.log("error: " + e);
		   });
    }
};
