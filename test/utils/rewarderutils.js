var CampGenieToken = artifacts.require("./contracts/CampGenieToken.sol");
var CGRewarderSample = artifacts.require("./contracts/CGRewarderSample.sol");

const tu = require('./tokenutils');

function _loadState(accounts) {
    return new Promise(function(resolve, reject) {
			   let state = { };

			   tu.loadState(accounts)
			       .then(function(s) {
					 state.cgt = s;
					 return CGRewarderSample.deployed();
				     })
			       .then(function(i) {
					 state.rew = { contract: i };
					 return state.rew.contract.owner.call();
				     })
			       .then(function(o) {
					 state.rew.owner = o;
					 state.rew.not_owner = _.find(accounts, function(v, idx) {
								      return v != state.rew.owner;
								  });
					 resolve(state);
				     })
			       .catch(function(e) {
					  reject(e);
				      });
		       });
};

module.exports = {
    loadState: _loadState
};
