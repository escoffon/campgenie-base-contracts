var CGMintableTokenBaseTester = artifacts.require("./contracts/mocks/CGMintableTokenBaseTester.sol");

var testutils = require('./utils/testutils.js');

testutils.injectAsserts(assert);

contract('CGMintableTokenBase', function(accounts) {
  var cgmt;
  var owner;
  var not_owners;

  beforeEach(function createToken() {
		 return CGMintableTokenBaseTester.deployed()
		     .then(function(instance) {
			       return CGMintableTokenBaseTester.new(100, 1);
			   })
		     .then(function(instance) {
			       cgmt = instance;
			       return cgmt.owner.call();
			   })
		     .then(function(o) {
			       owner = o;
			       not_owners = testutils.filterOwner(accounts, owner);
			   });
	     });

  it("initializes correctly", function() {
	 return cgmt.name.call()
	     .then(function(n) {
		       assert.equal(n, 'CGMintableTokenBaseTester', "token name is not initialized correctly");
		       return cgmt.symbol.call();
		   })
	     .then(function(s) {
		       assert.equal(s, 'CGMTT', "token symbol is not initialized correctly");
		       return cgmt.decimals.call();
		   })
	     .then(function(d) {
		       assert.equal(d, 1, "decimals is not initialized correctly");
		       return cgmt.initialSupply.call();
		   })
	     .then(function(i) {
		       assert.equal(i, 1000, "initial supply is not initialized correctly");
		       return cgmt.totalSupply.call();
		   })
	     .then(function(i) {
		       assert.equal(i, 1000, "total supply is not initializedized correctly");
		       return cgmt.balanceOf.call(owner);
		   })
	     .then(function(b) {
		       assert.equal(b.valueOf(), 1000, "100.0 wasn't in the owner account");
		       return cgmt.minterStatus.call(owner, { from: owner });
		   })
	     .then(function(r) {
		       assert.equal(r[0], 100, 'incorrect mint limit for owner account');
		       assert.equal(r[1], 0, 'incorrect mint count for owner account');
		       assert.equal(r[2], true, 'incorrect active state for owner account');

		       return true;
		   });
     });

  it("should mint tokens correctly", function() {
	 var account_two = not_owners[1];

	 var starting_total_supply;
	 var ending_total_supply;
	 var account_two_starting_balance;
	 var account_two_ending_balance;

	 var amount = 60;

	 return cgmt.totalSupply.call()
	     .then(function(s) {
		       starting_total_supply = s.toNumber();
		       return cgmt.balanceOf.call(account_two);
		   })
	     .then(function(b) {
		       account_two_starting_balance = b.toNumber();
		       return cgmt.mint(account_two, amount, { from: owner });
		   })
	     .then(function(r) {
		       assert.didLogEvent(r, { event: 'Mint', args: { _to: account_two } },
					  'missing or incorrect Mint event');
		       var elist = testutils.filterEvents(r, { event: 'Mint' });
		       var minted = elist[0].args.amount.toNumber();
		       assert.equal(amount, minted, 'did not mint the correct amount (1)');

		       return cgmt.minterStatus.call(owner, { from: owner });
		   })
	     .then(function(r) {
		       assert.equal(r[1], amount, 'incorrect mint count for owner account');
		       return cgmt.totalSupply.call();
		   })
	     .then(function(s) {
		       ending_total_supply = s.toNumber();
		       return cgmt.balanceOf.call(account_two);
		   })
	     .then(function(b) {
		       account_two_ending_balance = b.toNumber();

		       assert.equal(ending_total_supply, starting_total_supply + amount, "Minted amount wasn't correctly added to the total supply");
		       assert.equal(account_two_ending_balance, account_two_starting_balance + amount, "Minted amount wasn't correctly added to the receiver");
		   });
     });

  it("should reject high mint requests", function() {
	 var account_two = not_owners[1];

	 var amount = 600;

	 return cgmt.mint(account_two, amount, { from: owner })
	     .then(function(rv) {
		       assert(false, 'high mint request should have failed');
		   },
		   function(e) {
		       assert.didRevertTransaction(e, "high mint request should have raised VM exception");
		  });
     });

  it("should register minters correctly", function() {
	 var account_one = not_owners[0];
	 var account_two = not_owners[1];

	 var amount = 400;

	 // we assume that the initial balance for account_two is 0

	 return cgmt.registerMinter(account_one, 500, { from: owner })
	     .then(function(r) {
		       return cgmt.mint(account_two, amount, { from: account_one });
		   })
	     .then(function(r) {
		       assert.didLogEvent(r, { event: 'Mint', args: { _to: account_two } },
					  'missing or incorrect Mint event');
		       var elist = testutils.filterEvents(r, { event: 'Mint' });
		       var minted = elist[0].args.amount.toNumber();
		       assert.equal(amount, minted, 'did not mint the correct amount (1)');

		       return cgmt.minterStatus.call(account_one, { from: account_one });
		   })
	     .then(function(r) {
		       assert.equal(r[1], amount, 'incorrect mint count for owner account');

		       return cgmt.balanceOf.call(account_two, { from: account_two });
		   })
	     .then(function(b) {
		       assert.equal(amount, b.toNumber(), 'incorrect balance for account');

		       return cgmt.mint(account_two, amount, { from: account_two });
		   })
	     .then(function(r) {
		       assert(false, 'mint request from non minter should have failed');
		   },
		   function(e) {
		       assert.didRevertTransaction(e, "mint request from non minter should have raised VM exception");
		       amount = 200;
		       return cgmt.mint(account_two, amount, { from: account_one });
		   })
	     .then(function(r) {
		       assert(false, 'mint request above allocation should have failed');
		   },
		   function(e) {
		       assert.didRevertTransaction(e, "mint request above allocation should have raised VM exception");
		   });
     });

  it("should return minter status", function() {
	 var account_one = not_owners[0];
	 var account_two = not_owners[1];

	 return cgmt.registerMinter(account_one, 500, { from: owner })
	     .then(function(r) {
		       return cgmt.minterStatus.call(account_one, { from: owner });
		   })
	     .then(function(r) {
		       assert.equal(r[0], 500, 'incorrect mint limit for account (1)');
		       assert.equal(r[1], 0, 'incorrect mint count for account (1)');
		       assert.equal(r[2], true, 'incorrect active state for account (1)');

		       return cgmt.mint(account_two, 100, { from: account_one });
		   })
	     .then(function(r) {
		       return cgmt.minterStatus.call(account_one, { from: account_two });
		   })
	     .then(function(r) {
		       assert.equal(r[0], 500, 'incorrect mint limit for account (2)');
		       assert.equal(r[1], 100, 'incorrect mint count for account (2)');
		       assert.equal(r[2], true, 'incorrect active state for account (2)');

		       return cgmt.minterStatus.call(account_two, { from: owner });
		   })
	     .then(function(r) {
		       assert.equal(r[0], 0, 'incorrect mint limit for account (3)');
		       assert.equal(r[1], 0, 'incorrect mint count for account (3)');
		       assert.equal(r[2], false, 'incorrect active state for account (3)');

		       return cgmt.deactivateMinter(account_one, { from: owner });
		   })
	     .then(function(r) {
		       return cgmt.minterStatus.call(account_one, { from: account_two });
		   })
	     .then(function(r) {
		       assert.equal(r[0], 500, 'incorrect mint limit for account (2)');
		       assert.equal(r[1], 100, 'incorrect mint count for account (2)');
		       assert.equal(r[2], false, 'incorrect active state for account (2)');

		       return cgmt.activateMinter(account_one, { from: owner });
		   })
	     .then(function(r) {
		       return cgmt.minterStatus.call(account_one, { from: account_two });
		   })
	     .then(function(r) {
		       assert.equal(r[0], 500, 'incorrect mint limit for account (3)');
		       assert.equal(r[1], 100, 'incorrect mint count for account (3)');
		       assert.equal(r[2], true, 'incorrect active state for account (3)');

		       return cgmt.unregisterMinter(account_one, { from: owner });
		   })
	     .then(function(r) {
		       return cgmt.minterStatus.call(account_one, { from: account_two });
		   })
	     .then(function(r) {
		       assert.equal(r[0], 0, 'incorrect mint limit for account (3)');
		       assert.equal(r[1], 0, 'incorrect mint count for account (3)');
		       assert.equal(r[2], false, 'incorrect active state for account (3)');
		   });
     });
});
