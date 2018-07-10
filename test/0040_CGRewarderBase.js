const CGTokenBaseTester = artifacts.require("./contracts/mocks/CGTokenBaseTester.sol");
const CGRewarderBaseTester = artifacts.require("./contracts/mocks/CGRewarderBaseTester.sol");

const _ = require('lodash');
const testutils = require('./utils/testutils.js');

let _versionNumber = 10010002;
let _base = 100;

testutils.injectAsserts(assert);

contract('CGRewarderBase', function(accounts) {
  var tok;
  var rew;
  var owner;
  var not_owner;
  var other_account;
  var other_initial_balance;

  beforeEach(function createRewarder() {
		 // we need to make sure that the address that gets an initial allocation of 20000
		 // is NOT the owner of the contract.
		 // Ganache uses accounts[0] as the owner, but the local geth uses accounts[1] for
		 // historical reasons. So, we use accounts[2].

		 other_account = accounts[2];
		 other_initial_balance = 20000;

		 return CGTokenBaseTester.new(10, 4, other_account, other_initial_balance)
		     .then(function(instance) {
			       tok = instance;
			       return tok.owner.call();
			   })
		     .then(function(o) {
			       owner = o;
			       not_owner = _.find(accounts, function(v, idx) {
						      return v != owner;
						  });
			       return CGRewarderBaseTester.new(tok.address);
			   })
		     .then(function(instance) {
			       rew = instance;

			       // This primes the balance for the rewarder account
			       return tok.transfer(rew.address, other_initial_balance, { from: other_account });
			   });
	     });

  it("initializes correctly", function() {
	 return rew.owner.call()
	     .then(function(o) {
		       assert.equal(o, owner, "the contract owner is not as expected");
		       return rew.getVersionNumber.call();
		   })
	     .then(function(vn) {
		       assert.equal(vn, _versionNumber, "version number is not initialized correctly");
		       return rew.tokenizer.call();
		   })
	     .then(function(a) {
		       assert.equal(a, tok.address, "tokenizer is not initializedized correctly");
		       return rew.getMinBase.call();
		   })
	     .then(function(b) {
		       assert.equal(b.toNumber(), _base, "min base is not initializedized correctly");
		   });
     });

  it("changes tokenizer", function() {
	 var old_tokenizer;
	 var new_tokenizer;

	 return CGTokenBaseTester.new(10, 4, other_account, 60000)
	     .then(function(instance) {
		       new_tokenizer = instance;

		       return rew.tokenizer.call();
		   })
	     .then(function(t) {
		       old_tokenizer = t;

		       return rew.changeTokenizer(new_tokenizer.address, { from: not_owner });
		   })
	     .then(function(r) {
		       assert(false, 'change tokenizer from not owner should have failed');
		       return true;
		   },
		   function(e) {
		       assert.didRevertTransaction(e, "change tokenizer from not owner should have raised VM exception");
		       return rew.changeTokenizer(new_tokenizer.address, { from: owner });
		   })
	     .then(function(r) {
		       return rew.tokenizer.call();
		   })
	     .then(function(t) {
		       assert.equal(new_tokenizer.address, t, "tokenizer did not change as expected");
		       return true;
		   });
     });

  it("upgrades balance", function() {
	 var new_rewarder;
	 var old_balance;

	 return CGRewarderBaseTester.new(tok.address)
	     .then(function(instance) {
		       new_rewarder = instance;

		       return tok.balanceOf(rew.address);
		   })
	     .then(function(b) {
		       old_balance = b.toNumber();
		       return tok.balanceOf(new_rewarder.address);
		   })
	     .then(function(b) {
		       assert.equal(0, b.toNumber(), "new rewarder should have 0 balance");

		       return rew.pause({ from: owner });
		   })
	     .then(function(r) {
		       return rew.upgrade(new_rewarder.address, { from: owner });
		   })
	     .then(function(r) {
		       assert(false, 'upgrade when paused should have failed');
		       return true;
		   },
		   function(e) {
		       assert.didRevertTransaction(e, "upgrade when paused should have raised VM exception");
		       return rew.unpause({ from: owner });
		   })
	     .then(function(r) {
		       return rew.upgrade(new_rewarder.address, { from: not_owner });
		   })
	     .then(function(r) {
		       assert(false, 'upgrade when not owner should have failed');
		       return true;
		   },
		   function(e) {
		       assert.didRevertTransaction(e, "upgrade when not owner should have raised VM exception");
		       return rew.upgrade(new_rewarder.address, { from: owner });
		   })
	     .then(function(r) {
		       return tok.balanceOf(rew.address);
		   })
	     .then(function(b) {
		       assert.equal(0, b.toNumber(), "old rewarder should have 0 balance");

		       return tok.balanceOf(new_rewarder.address);
		   })
	     .then(function(b) {
		       assert.equal(old_balance, b.toNumber(), "new rewarder should have the old balance");

		       return true;
		   });
     });

  it("pauses and unpauses correctly", function() {
	 return rew.pause({ from: not_owner })
	     .then(function(r) {
		       assert(false, 'pause from not owner should have failed');
		       return true;
		   },
		   function(e) {
		       assert.didRevertTransaction(e, "pause from not owner should have raised VM exception");
		       return rew.pause({ from: owner });
		   })
	     .then(function(r) {
		       assert.didLogEvent(r, { event: 'Pause' },
					  'missing or incorrect Pause event');
		       return rew.unpause({ from: not_owner });
		   })
	     .then(function(r) {
		       assert(false, 'unpause from not owner should have failed');
		       return true;
		   },
		   function(e) {
		       assert.didRevertTransaction(e, "unpause from not owner should have raised VM exception");
		       return rew.unpause({ from: owner });
		   })
	     .then(function(r) {
		       assert.didLogEvent(r, { event: 'Unpause' },
					  'missing or incorrect Unpause event');
		       return true;
		   });
     });

  it("disburses rewards", function() {
	 var disbursed;
	 var initial_to_balance;
	 var final_to_balance;
	 var initial_r_balance;
	 var final_r_balance;

	 return tok.balanceOf.call(not_owner)
	     .then(function(b) {
		       initial_to_balance = b.toNumber();
		       return tok.balanceOf.call(rew.address);
		   })
	     .then(function(b) {
		       initial_r_balance = b.toNumber();
		       return rew.rewardTest(not_owner, 400, { from: owner });
		   })
	     .then(function(r) {
		       assert.didLogEvent(r, { event: 'Disburse', args: { _to: not_owner } },
					  'missing or incorrect Disburse event');
		       var elist = testutils.filterEvents(r, { event: 'Disburse' });
		       disbursed = elist[0].args.amount.toNumber();
		       return tok.balanceOf.call(not_owner);
		   })
	     .then(function(b) {
		       final_to_balance = b.toNumber();
		       return tok.balanceOf.call(rew.address);
		   })
	     .then(function(b) {
		       final_r_balance = b.toNumber();

		       var to_delta = final_to_balance - initial_to_balance;
		       var r_delta = final_r_balance - initial_r_balance;
		       assert.equal(to_delta, disbursed, 'disbursement not transferred correctly to author');
		       assert.equal(r_delta, -disbursed, 'disbursement not transferred correctly from reward contract');

		       return rew.rewardTest(not_owner, 400, { from: not_owner });
		   })
	     .then(function(r) {
		       assert(false, 'reward not from owner should have failed');
		       return true;
		   },
		   function(e) {
		       assert.didRevertTransaction(e, "reward not from owner should have raised VM exception");
		       return rew.pause({ from: owner });
		   })
	     .then(function(r) {
		       return rew.rewardTest(not_owner, 400, { from: owner });
		   })
	     .then(function(r) {
		       assert(false, 'reward when paused should have failed');
		       return true;
		   },
		   function(e) {
		       assert.didRevertTransaction(e, "reward when paused should have raised VM exception");
		       return rew.unpause({ from: owner });
		   })
	     .then(function(r) {
		       return rew.rewardTest(not_owner, 400, { from: owner });
		   })
	     .then(function(r) {
		       assert.didLogEvent(r, { event: 'Disburse', args: { _to: not_owner } },
					  'missing or incorrect Disburse event');
		   });
     });

  it("rewards correctly", function() {
	 var disbursed;

	 return rew.rewardTest(not_owner, 240, { from: owner })
	     .then(function(r) {
		       assert.didLogEvent(r, { event: 'Disburse', args: { _to: not_owner } },
					  'missing or incorrect Disburse event');
		       var elist = testutils.filterEvents(r, { event: 'Disburse' });
		       disbursed = elist[0].args.amount.toNumber();
		       assert.equal(480, disbursed, 'disbursement not as expected');

		       return rew.rewardTest(not_owner, 60, { from: owner });
		   })
	     .then(function(r) {
		       assert(false, 'reward with low base should have failed');
		       return true;
		   },
		   function(e) {
		       assert.didRevertTransaction(e, "reward with low base should have raised VM exception");
		       return rew.setMinBase(40, { from: owner });
		   })
	     .then(function(r) {
		       return rew.rewardTest(not_owner, 60, { from: owner });
		   })
	     .then(function(r) {
		       assert.didLogEvent(r, { event: 'Disburse', args: { _to: not_owner } },
					  'missing or incorrect Disburse event');
		       var elist = testutils.filterEvents(r, { event: 'Disburse' });
		       disbursed = elist[0].args.amount.toNumber();
		       assert.equal(120, disbursed, 'disbursement not as expected');
		       return rew.estimateTestReward(not_owner, 60);
		   })
	     .then(function(r) {
		       assert.equal(120, r.toNumber(), "incorrect reward estimate");
		       return true;
		   });
     });
});
