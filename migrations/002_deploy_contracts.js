let CGTokenBaseTester = artifacts.require("./mocks/CGTokenBaseTester.sol");
let CGMintableTester = artifacts.require("./mocks/CGMintableTester.sol");
let CGMintableTokenBaseTester = artifacts.require("./mocks/CGMintableTokenBaseTester.sol");
let CGRewarderBaseTester = artifacts.require("./mocks/CGRewarderBaseTester.sol");

module.exports = function(deployer, network, accounts) {
    // We deploy only with test networks

    if ((network == 'development') || (network == 'ganache') || (network == 'localgeth'))
    {
	deployer
	    .then(function() {
			  return deployer.deploy(CGTokenBaseTester, 1000, 4, '0x0', 0);
		  })
	    .then(function(instance) {
		      deployer.logger.log("Deployed CGTokenBaseTester at " + instance.address);
		      return deployer.deploy(CGRewarderBaseTester, instance.address);
		  })
	    .then(function(instance) {
		      deployer.logger.log("Deployed CGRewarderBaseTester at " + instance.address);
		      return deployer.deploy(CGMintableTester);
		  })
	    .then(function(instance) {
		      deployer.logger.log("Deployed CGMintableTester at " + instance.address);
		      return deployer.deploy(CGMintableTokenBaseTester, '100', '1');
		  })
	    .then(function(instance) {
		      deployer.logger.log("Deployed CGMintableTokenBaseTester at " + instance.address);
		  })
	    .catch(function(e) {
		       deployer.logger.log("error: " + e);
		   });
    }
};
