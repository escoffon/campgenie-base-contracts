var CGTokenBaseTester = artifacts.require("./contracts/mocks/CGTokenBaseTester.sol");

var testutils = require('./utils/testutils.js');

testutils.injectAsserts(assert);

contract('CGTokenBase', function(accounts) {
  var cgtt;
  var owner;
  var initial_allocation;
  var other_account;
  var other_initial_balance;

  beforeEach(function createToken() {
		 // we need to make sure that the address that gets an initial allocation of 20000
		 // is NOT the owner of the contract.
		 // Ganache uses accounts[0] as the owner, but the local geth uses accounts[1] for
		 // historical reasons. So, we use accounts[2].

		 other_account = accounts[2];
		 other_initial_balance = 20000;
		 initial_allocation = 100000;

		 return CGTokenBaseTester.new(10, 4, other_account, other_initial_balance)
		     .then(function(instance) {
			       cgtt = instance;
			       return cgtt.owner.call();
			   })
		     .then(function(o) {
			       owner = o;
			       return true;
			   });
	     });

  it("initializes correctly", function() {
	 return CGTokenBaseTester.deployed()
	     .then(function(instance) {
		       return cgtt.name.call();
		   })
	     .then(function(n) {
		       assert.equal(n, 'CGTokenBaseTester', "token name is not initialized correctly");
		       return cgtt.symbol.call();
		   })
	     .then(function(s) {
		       assert.equal(s, 'CGTT', "token symbol is not initialized correctly");
		       return cgtt.decimals.call();
		   })
	     .then(function(d) {
		       assert.equal(d, 4, "decimals is not initialized correctly");
		       return cgtt.owner.call();
		   })
	     .then(function(o) {
		       assert.equal(o, owner, "the contract owner is not as expected");
		       return cgtt.initialSupply.call();
		   })
	     .then(function(i) {
		       assert.equal(i, initial_allocation, "initial supply is not initialized correctly");
		       return cgtt.totalSupply.call();
		   })
	     .then(function(i) {
		       assert.equal(i, initial_allocation, "total supply is not initializedized correctly");
		       return cgtt.balanceOf.call(owner);
		   })
	     .then(function(b) {
		       let ob = initial_allocation - other_initial_balance;
		       assert.equal(b.toNumber(), ob, "incorrect balance in the owner account");
		       return cgtt.balanceOf.call(other_account);
		   })
	     .then(function(b) {
		       assert.equal(b.toNumber(), other_initial_balance, "incorrect balance in the other account");
		   });
     });

  it("should transfer tokens correctly", function() {
	 var account_two = accounts[2];
	 var account_three = accounts[3];

	 var account_two_starting_balance;
	 var account_three_starting_balance;
	 var account_two_ending_balance;
	 var account_three_ending_balance;

	 var amount = 10000;

	 return CGTokenBaseTester.deployed()
	     .then(function(instance) {
		       return cgtt.balanceOf.call(account_three);
		   })
	     .then(function(b) {
		       account_three_starting_balance = b.toNumber();
		       return cgtt.balanceOf.call(account_two);
		   })
	     .then(function(b) {
		       account_two_starting_balance = b.toNumber();
		       return cgtt.transfer(account_three, amount, { from: account_two });
		   })
	     .then(function(rv) {
		       assert.didLogEvent(rv, { event: 'Transfer', args: {
						    from: account_two, to: account_three, value: amount } },
					  'missing or incorrect Transfer event');
		       return cgtt.balanceOf.call(account_three);
		   })
	     .then(function(b) {
		       account_three_ending_balance = b.toNumber();
		       return cgtt.balanceOf.call(account_two);
		   })
	     .then(function(b) {
		       account_two_ending_balance = b.toNumber();

		       assert.equal(account_two_ending_balance, account_two_starting_balance - amount, "Amount wasn't correctly taken from the sender");
		       assert.equal(account_three_ending_balance, account_three_starting_balance + amount, "Amount wasn't correctly sent to the receiver");
		   });
     });

  it("should reject transfers with insufficient funds", function() {
	 var account_one = accounts[1];
	 var account_two = accounts[2];
	 var account_three = accounts[3];
	 var account_four = accounts[4];

	 var amount = 120000;

	 return CGTokenBaseTester.deployed()
	     .then(function(instance) {
		       return cgtt.transfer(account_two, amount, { from: account_one });
		   })
	     .then(function(rv) {
		       assert(false, 'transfer (1) of insufficient funds should have failed');
		   },
		   function(e) {
		       assert.didRevertTransaction(e, "transfer (1) of insufficient funds should have raised VM exception");
		       amount = 10000;
		       return cgtt.transfer(account_three, amount, { from: account_one });
		   })
	     .then(function(rv) {
		       assert.didLogEvent(rv, { event: 'Transfer', args: {
						    from: account_one, to: account_three, value: amount } },
					  'missing or incorrect Transfer event');
		       return cgtt.balanceOf.call(account_three);
		   })
	     .then(function(b) {
		       assert.equal(b, amount, 'tokens did not all transfer to account (2)');
		       amount = 20000;
		       return cgtt.transfer(account_four, amount, { from: account_three });
		   })
	     .then(function(rv) {
		       assert(false, 'transfer (2) of insufficient funds should have failed');
		   },
		   function(e) {
		       assert.didRevertTransaction(e, "transfer (2) of insufficient funds should have raised VM exception");
		  });
     });

  it("should reject transfers with insufficient allowances", function() {
	 var account_one = accounts[1];
	 var account_two = accounts[2];
	 var account_three = accounts[3];
	 var account_four = accounts[4];

	 var amount = 20000;
	 var allowance = 10000;

	 return CGTokenBaseTester.deployed()
	     .then(function(instance) {
		       assert.isDefined(account_one, 'account_one is not defined');
		       assert.isDefined(account_two, 'account_two is not defined');
		       assert.isDefined(account_three, 'account_three is not defined');
		       assert.isDefined(account_four, 'account_four is not defined');
		       return cgtt.transfer(account_two, amount, { from: account_one });
		   })
	     .then(function(rv) {
		       assert.didLogEvent(rv, { event: 'Transfer', args: {
						    from: account_one, to: account_two, value: amount } },
					  'missing or incorrect Transfer event');
		       amount = 5000;
		       return cgtt.transferFrom(account_two, account_three, amount, { from: account_four });
		   })
	     .then(function(rv) {
		       assert.isFalse(rv, 'transfer (1) of insufficient allocation should have failed');
		   },
		   function(e) {
		       assert.didRevertTransaction(e, "transfer (1) of insufficient allocation should have raised VM exception");
		       return cgtt.approve(account_four, allowance, { from: account_two });
		   })
	     .then(function(r) {
		       return cgtt.transferFrom(account_two, account_three, amount, { from: account_four });
		   })
	     .then(function(r) {
		       assert.didLogEvent(r, { event: 'Transfer', args: {
						   from: account_two, to: account_three, value: amount } },
					  'missing or incorrect Transfer event');
		       return cgtt.balanceOf.call(account_three);
		   })
	     .then(function(b) {
		       assert.equal(b, amount, 'tokens did not all transfer to account (3)');
		       amount = 6000;
		       return cgtt.transferFrom(account_two, account_three, amount, { from: account_four });
		   })
	     .then(function(rv) {
		       assert(false, 'transfer (3) of insufficient funds should have failed');
		   },
		   function(e) {
		       assert.didRevertTransaction(e, "transfer (3) of insufficient funds should have raised VM exception");
		   });
     });

  it('allows only owner to pause/unpause', function() {
	 var account_two = accounts[2];

	 return CGTokenBaseTester.deployed()
	     .then(function(instance) {
		       return cgtt.pause({ from: owner });
		   })
	     .then(function(r) {
		       // somehow testrpc does not return Pause and Unpause in the tx receipt
		       //assert.didLogEvent(r, { event: 'Pause' }, 'missing or incorrect Pause event');
		       return cgtt.unpause({ from: account_two });
		  })
	     .then(function(r) {
		       assert(false, 'unpause from account (2) should have failed');
		   },
		   function(e) {
		       assert.didRevertTransaction(e, "unpause from account (2) should have raised VM exception");
		       return cgtt.unpause({ from: owner });
		  })
	     .then(function(r) {
		       // somehow testrpc does not return Pause and Unpause in the tx receipt
		       //assert.didLogEvent(r, { event: 'Unpause' }, 'missing or incorrect Unpause event');
		       return cgtt.pause({ from: account_two });
		  })
	     .then(function(r) {
		       assert(false, 'pause from account (2) should have failed');
		   },
		   function(e) {
		       assert.didRevertTransaction(e, "pause from account (2) should have raised VM exception");
		  });
     });

  it('should enforce pause/unpause', function() {
	 var account_two = accounts[2];
	 var account_three = accounts[3];
	 var account_four = accounts[4];

	 var amount = 20000;
	 var allowance = 10000;
	 var burn = 1000;

	 return CGTokenBaseTester.deployed()
	     .then(function(instance) {
		       return cgtt.transfer(account_two, amount, { from: owner });
		   })
	     .then(function(r) {
		       assert.didLogEvent(r, { event: 'Transfer', args: {
						   from: owner, to: account_two, value: amount } },
					  'missing or incorrect Transfer event');
		       return cgtt.approve(account_four, allowance, { from: account_two });
		   })
	     .then(function(r) {
		       assert.didLogEvent(r, { event: 'Approval', args: {
						   owner: account_four, spender: account_two, value: allowance } },
					  'missing or incorrect Approval event');
		       amount = 4000;
		       return cgtt.transferFrom(account_two, account_three, amount, { from: account_four });
		   })
	     .then(function(r) {
		       assert.didLogEvent(r, { event: 'Transfer', args: {
						   from: account_two, to: account_three, value: amount } },
					  'missing or incorrect Transfer event');
		       return cgtt.pause({ from: owner });
		   })
	     .then(function(r) {
		       return cgtt.transfer(account_two, amount, { from: owner });
		   })
	     .then(function(r) {
		       assert(false, 'transfer while paused should have failed');
		   },
		   function(e) {
		       assert.didRevertTransaction(e, "transfer while paused should have raised VM exception");
		       amount = 2000;
		       return cgtt.transferFrom(account_two, account_three, amount, { from: account_four });
		   })
	     .then(function(r) {
		       assert(false, 'transferFrom while paused should have failed');
		   },
		   function(e) {
		       assert.didRevertTransaction(e, "transferFrom while paused should have raised VM exception");
		       return cgtt.approve(account_four, allowance, { from: account_two });
		  })
	     .then(function(r) {
		       assert(false, 'approve while paused should have failed');
		   },
		   function(e) {
		       assert.didRevertTransaction(e, "approve while paused should have raised VM exception");
		       return cgtt.burn(burn, { from: owner });
		   })
	     .then(function(r) {
		       assert(false, 'burn while paused should have failed');
		   },
		   function(e) {
		       assert.didRevertTransaction(e, "burn while paused should have raised VM exception");
		       return cgtt.unpause({ from: owner });
		  });
     });

  it('burns correctly', function() {
	 var burn = 20000;
	 var initial_balance;
	 var final_balance;
	 var initial_supply;
	 var final_supply;

	 return CGTokenBaseTester.deployed()
	     .then(function(instance) {
		       return cgtt.balanceOf.call(owner);
		   })
	     .then(function(b) {
		       initial_balance = b.toNumber();
		       return cgtt.totalSupply.call();
		   })
	     .then(function(s) {
		       initial_supply = s.toNumber();
		       return cgtt.burn(burn, { from: owner });
		   })
	     .then(function(r) {
		       return cgtt.balanceOf.call(owner);
		   })
	     .then(function(b) {
		       final_balance = b.toNumber();
		       return cgtt.totalSupply.call();
		   })
	     .then(function(s) {
		       final_supply = s.toNumber();
		       assert.equal(final_supply, (initial_supply - burn), 'total supply after burn is incorrect');
		       assert.equal(final_balance, (initial_balance - burn), 'balance after burn is incorrect');
		       return cgtt.burn(final_balance += 1000, { from: owner });
		   })
	     .then(function(r) {
		       assert(false, 'burn more than balance should have failed');
		   },
		   function(e) {
		       assert.didRevertTransaction(e, "burn more than balance should have raised VM exception");
		       return cgtt.burn(0, { from: owner });
		  })
	     .then(function(r) {
		       assert(false, 'burn 0 should have failed');
		   },
		   function(e) {
		       assert.didRevertTransaction(e, "burn 0 should have raised VM exception");
		  });
     });

  it('allows only owner to freeze/release', function() {
	 var account_two = accounts[2];
	 var account_three = accounts[3];

	 return CGTokenBaseTester.deployed()
	     .then(function(instance) {
		       return cgtt.freeze(account_two, true, { from: owner });
		   })
	     .then(function(r) {
		       assert.didLogEvent(r, { event: 'FundsFrozen', args: {
						   account: account_two, state: true } }, 'missing or incorrect FundsFrozen event');
		       return cgtt.freeze(account_two, false, { from: account_two });
		  })
	     .then(function(r) {
		       assert(false, 'unfreeze from account (2) should have failed');
		   },
		   function(e) {
		       assert.didRevertTransaction(e, "unfreeeze from account (2) should have raised VM exception");
		       return cgtt.freeze(account_two, false, { from: owner });
		  })
	     .then(function(r) {
		       assert.didLogEvent(r, { event: 'FundsFrozen', args: {
						   account: account_two, state: false } }, 'missing or incorrect FundsFrozen event');
		       return cgtt.freeze(account_two, true, { from: account_three });
		  })
	     .then(function(r) {
		       assert(false, 'freeze from account (3) should have failed');
		   },
		   function(e) {
		       assert.didRevertTransaction(e, "feeze from account (3) should have raised VM exception");
		  });
     });

  it('should enforce freeze/release', function() {
	 var account_one = accounts[1];
	 var account_two = accounts[2];
	 var account_three = accounts[3];
	 var account_four = accounts[4];

	 var amount = 10000;
	 var allowance = 1000;

	 return CGTokenBaseTester.deployed()
	     .then(function(instance) {
		       return cgtt.transfer(account_one, amount, { from: account_two });
		   })
	     .then(function(r) {
		       return cgtt.approve(account_four, allowance, { from: account_one });
		   })
	     .then(function(r) {
		       return cgtt.approve(account_four, allowance, { from: account_two });
		   })
	     .then(function(r) {
		       amount = 120;
		       return cgtt.transferFrom(account_one, account_two, amount, { from: account_four });
		   })
	     .then(function(r) {
		       return cgtt.freeze(account_two, true, { from: owner });
		   })
	     .then(function(r) {
		       return cgtt.isFrozen.call(account_two);
		   })
	     .then(function(f) {
		       assert.equal(f, true, 'account should be marked frozen');
		       amount = 130;
		       return cgtt.transfer(account_two, amount, { from: account_one });
		   })
	     .then(function(r) {
		       assert(false, 'transfer to a frozen account should have failed');
		   },
		   function(e) {
		       assert.didRevertTransaction(e, "transfer to a frozen account should have raised VM exception");
		       amount = 140;
		       return cgtt.transfer(account_one, amount, { from: account_two });
		   })
	     .then(function(r) {
		       assert(false, 'transfer from a frozen account should have failed');
		   },
		   function(e) {
		       assert.didRevertTransaction(e, "transfer from a frozen account should have raised VM exception");
		       amount = 150;
		       return cgtt.transferFrom(account_two, account_three, amount, { from: account_four });
		   })
	     .then(function(r) {
		       assert(false, 'transferFrom from a frozen account should have failed');
		   },
		   function(e) {
		       assert.didRevertTransaction(e, "transferFrom from a frozen account should have raised VM exception");
		       amount = 160;
		       return cgtt.transferFrom(account_one, account_two, amount, { from: account_four });
		   })
	     .then(function(r) {
		       assert(false, 'transferFrom to a frozen account should have failed');
		   },
		   function(e) {
		       assert.didRevertTransaction(e, "transferFrom to a frozen account should have raised VM exception");
		       allowance = 1000;
		       return cgtt.approve(account_four, allowance, { from: account_two });
		  })
	     .then(function(r) {
		       assert(false, 'approve while frozen should have failed');
		   },
		   function(e) {
		       assert.didRevertTransaction(e, "approve while frozen should have raised VM exception");
		       return cgtt.burn(100, { from: account_two });
		   })
	     .then(function(r) {
		       assert(false, 'burn while frozen should have failed');
		   },
		   function(e) {
		       assert.didRevertTransaction(e, "burn while frozen should have raised VM exception");
		       return cgtt.freeze(account_two, false, { from: owner });
		  });
     });
});
