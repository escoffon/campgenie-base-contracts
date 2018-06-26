var CGMintableTester = artifacts.require("./contracts/mocks/CGMintableTester.sol");

var testutils = require('./utils/testutils.js');

testutils.injectAsserts(assert);

contract('CGMintable', function(accounts) {
  var cgmt;
  var owner;
  var not_owners;

  beforeEach(function createToken() {
		 return CGMintableTester.deployed()
		     .then(function(instance) {
			       return CGMintableTester.new();
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

  it("should register minters correctly", function() {
	 return cgmt.registerMinter(not_owners[0], 500, { from: owner })
	     .then(function(r) {
		       return cgmt.minterStatus.call(not_owners[0], { from: owner });
		   })
	     .then(function(r) {
		       assert.equal(r[0], 500, 'incorrect mint limit for account (1)');
		       assert.equal(r[1], 0, 'incorrect mint count for account (1)');
		       assert.equal(r[2], true, 'incorrect active state for account (1)');

		       return cgmt.registerMinter(not_owners[0], 200, { from: owner });
		   })
	     .then(function(r) {
		       return cgmt.minterStatus.call(not_owners[0], { from: owner });
		   })
	     .then(function(r) {
		       assert.equal(r[0], 200, 'incorrect mint limit for account (1.1)');
		       assert.equal(r[1], 0, 'incorrect mint count for account (1.1)');
		       assert.equal(r[2], true, 'incorrect active state for account (1.1)');

		       return cgmt.registerMinter(not_owners[1], 500, { from: not_owners[0] });
		   })
	     .then(function(rv) {
		       assert(false, 'minter registration from non owner should have failed');
		   },
		   function(e) {
		       assert.didRevertTransaction(e, "minter registration from non owner should have raised VM exception");
		       return cgmt.unregisterMinter(not_owners[1], { from: not_owners[0] });
		   })
	     .then(function(rv) {
		       assert(false, 'minter unregistration from non owner should have failed');
		   },
		   function(e) {
		       assert.didRevertTransaction(e, "minter unregistration from non owner should have raised VM exception");
		       return cgmt.unregisterMinter(not_owners[0], { from: owner });
		   })
	     .then(function(r) {
		       return cgmt.minterStatus.call(not_owners[0], { from: owner });
		   })
	     .then(function(r) {
		       assert.equal(r[0], 0, 'incorrect mint limit for account (2)');
		       assert.equal(r[1], 0, 'incorrect mint count for account (2)');
		       assert.equal(r[2], false, 'incorrect active state for account (2)');

		       return cgmt.registerMinter(not_owners[1], 0, { from: owner });
		   })
	     .then(function(rv) {
		       assert(false, 'minter registration with 0 max should have failed');
		   },
		   function(e) {
		       assert.didRevertTransaction(e, "minter registration with 0 max should have raised VM exception");
		       return true;
		   });
     });

  it("should activate minters correctly", function() {
	 return cgmt.registerMinter(not_owners[0], 500, { from: owner })
	     .then(function(r) {
		       return cgmt.minterStatus.call(not_owners[0], { from: owner });
		   })
	     .then(function(r) {
		       assert.equal(r[0], 500, 'incorrect mint limit for account (1)');
		       assert.equal(r[1], 0, 'incorrect mint count for account (1)');
		       assert.equal(r[2], true, 'incorrect active state for account (1)');

		       return cgmt.deactivateMinter(not_owners[0], { from: not_owners[1] });
		   })
	     .then(function(rv) {
		       assert(false, 'minter deactivation from non owner should have failed');
		   },
		   function(e) {
		       assert.didRevertTransaction(e, "minter deactivation from non owner should have raised VM exception");
		       return cgmt.deactivateMinter(not_owners[0], { from: owner });
		   })
	     .then(function(rv) {
		       return cgmt.minterStatus.call(not_owners[0], { from: owner });
		   })
	     .then(function(r) {
		       assert.equal(r[0], 500, 'incorrect mint limit for account (2)');
		       assert.equal(r[1], 0, 'incorrect mint count for account (2)');
		       assert.equal(r[2], false, 'incorrect active state for account (2)');

		       return cgmt.activateMinter(not_owners[0], { from: not_owners[1] });
		   })
	     .then(function(rv) {
		       assert(false, 'minter activation from non owner should have failed');
		   },
		   function(e) {
		       assert.didRevertTransaction(e, "minter activation from non owner should have raised VM exception");
		       return cgmt.activateMinter(not_owners[0], { from: owner });
		   })
	     .then(function(rv) {
		       return cgmt.minterStatus.call(not_owners[0], { from: owner });
		   })
	     .then(function(r) {
		       assert.equal(r[2], true, 'incorrect active state for account (3)');
		       assert.equal(r[0], 500, 'incorrect mint limit for account (3)');
		       assert.equal(r[1], 0, 'incorrect mint count for account (3)');
		   });
     });

  it("should pause and resume correctly", function() {
	 return cgmt.pauseMinting({ from: owner })
	     .then(function(r) {
		       assert.didLogEvent(r, { event: 'MintPaused' },
					  'missing or incorrect MintPaused event');
		       return cgmt.resumeMinting({ from: not_owners[0] });
		   })
	     .then(function(rv) {
		       assert(false, 'resume from non owner should have failed');
		   },
		   function(e) {
		       assert.didRevertTransaction(e, "resume from non owner should have raised VM exception");
		       return cgmt.resumeMinting({ from: owner });
		   })
	     .then(function(r) {
		       assert.didLogEvent(r, { event: 'MintResumed' },
					  'missing or incorrect MintResumed event');
		       return cgmt.pauseMinting({ from: not_owners[0] });
		   })
	     .then(function(rv) {
		       assert(false, 'pause from non owner should have failed');
		   },
		   function(e) {
		       assert.didRevertTransaction(e, "pause from non owner should have raised VM exception");
		       return true;
		   });
     });

  it("should observe permissions when minting", function() {
	 // This test does NOT fully cover minting behavior, because the mint function implemented by the
	 // CGMintableTester contract is not complete.
	 // But it does cover access control restrictions.
	 // Tests for real implementations MUST repeat these tests, and more.

	 // Note also that the CGMintableTester contract does NOT register the owner as a minter, so
	 // using the owner as the sender will fail

	 return cgmt.registerMinter(not_owners[0], 500, { from: owner })
	     .then(function(r) {
		       return cgmt.mint(not_owners[0], 100, { from: not_owners[0] });
		   })
	     .then(function(r) {
		       assert.didLogEvent(r, { event: 'Mint', args: { _to: not_owners[0] } },
					  'missing or incorrect Mint event');
		       var elist = testutils.filterEvents(r, { event: 'Mint' });
		       var minted = elist[0].args.amount.toNumber();
		       assert.equal(100, minted, 'did not mint the correct amount (1)');

		       return cgmt.minterStatus.call(not_owners[0], { from: not_owners[0] });
		   })
	     .then(function(r) {
		       assert.equal(r[1], 100, 'incorrect mint count for account (1)');

		       return cgmt.mint(not_owners[0], 40, { from: not_owners[0] });
		   })
	     .then(function(r) {
		       assert.didLogEvent(r, { event: 'Mint', args: { _to: not_owners[0] } },
					  'missing or incorrect Mint event');
		       var elist = testutils.filterEvents(r, { event: 'Mint' });
		       var minted = elist[0].args.amount.toNumber();
		       assert.equal(40, minted, 'did not mint the correct amount (2)');

		       return cgmt.minterStatus.call(not_owners[0], { from: not_owners[0] });
		   })
	     .then(function(r) {
		       assert.equal(r[1], 140, 'incorrect mint count for account (2)');

		       return cgmt.mint(not_owners[0], 80, { from: not_owners[1] });
		   })
	     .then(function(rv) {
		       assert(false, 'mint from non minter should have failed');
		   },
		   function(e) {
		       assert.didRevertTransaction(e, "mint from non minter should have raised VM exception");

		       return cgmt.minterStatus.call(not_owners[0], { from: not_owners[0] });
		   })
	     .then(function(r) {
		       assert.equal(r[1], 140, 'incorrect mint count for account (2.1)');

		       return cgmt.pauseMinting({ from: owner });
		   })
	     .then(function(rv) {
		       return cgmt.mint(not_owners[0], 80, { from: not_owners[0] });
		   })
	     .then(function(rv) {
		       assert(false, 'mint when paused should have failed');
		   },
		   function(e) {
		       assert.didRevertTransaction(e, "mint when paused should have raised VM exception");

		       return cgmt.minterStatus.call(not_owners[0], { from: not_owners[0] });
		   })
	     .then(function(r) {
		       assert.equal(r[1], 140, 'incorrect mint count for account (2.2)');

		       return cgmt.resumeMinting({ from: owner });
		   })
	     .then(function(rv) {
		       return cgmt.mint(not_owners[0], 80, { from: not_owners[0] });
		   })
	     .then(function(r) {
		       assert.didLogEvent(r, { event: 'Mint', args: { _to: not_owners[0] } },
					  'missing or incorrect Mint event');
		       var elist = testutils.filterEvents(r, { event: 'Mint' });
		       var minted = elist[0].args.amount.toNumber();
		       assert.equal(80, minted, 'did not mint the correct amount (1)');

		       return cgmt.minterStatus.call(not_owners[0], { from: not_owners[0] });
		   })
	     .then(function(r) {
		       assert.equal(r[1], 220, 'incorrect mint count for account (3)');

		       // at least 281 triggers the max check, since we already minted 220

		       return cgmt.mint(not_owners[0], 340, { from: not_owners[0] });
		   })
	     .then(function(rv) {
		       assert(false, 'mint beyond max limit should have failed');
		   },
		   function(e) {
		       assert.didRevertTransaction(e, "mint beyond max limit should have raised VM exception");
		       return true;
		   });
     });
});
