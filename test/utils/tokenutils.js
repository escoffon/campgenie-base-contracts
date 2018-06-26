var CampGenieToken = artifacts.require("./contracts/CampGenieToken.sol");

function _loadState(accounts) {
    return new Promise(function(resolve, reject) {
			   let state = { };

			   CampGenieToken.deployed()
			       .then(function(i) {
					 state.contract = i;
					 return state.contract.owner.call();
				     })
			       .then(function(o) {
					 state.owner = o;
					 state.not_owner = _.find(accounts, function(v, idx) {
								      return v != state.owner;
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
