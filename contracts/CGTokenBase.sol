pragma solidity ^0.4.23;

import 'openzeppelin-solidity/contracts/token/ERC20/StandardToken.sol';
import 'openzeppelin-solidity/contracts/ownership/Ownable.sol';
import 'openzeppelin-solidity/contracts/lifecycle/Pausable.sol';

// for some reason, the super.burn call triggers an opcode error in the tests (when run against ganache-cli),
// so we implement that function directly here and do not use BurnableToken.
// But we leave the BurnableToken code for historical reasons.
//import 'openzeppelin-solidity/contracts/token/BurnableToken.sol';

/**
 * @title CGTokenBase
 * @dev Base ERC20 token for CampGenie.
 *  This contract is one of the following from OpenZeppelin:
 *  - StandardToken: standard ERC20 token functionality.
 *  - Ownable: the owner is the account that can make admin changes to the contract.
 *  - Pausable: the contract can be paused; affects transfer, transferFrom, approve, and burn.
 *  - (BurnableToken: the contract supports burning tokens (and thereby removing them from circulation).)
 */

contract CGTokenBase is StandardToken, Ownable, Pausable /*, BurnableToken */ {
    string public name = "CGTokenBase";
    string public symbol = "CGTB";
    uint8 public decimals = 18;

    // initialSupply is the initial allocation of tokens.
    uint256 public initialSupply;

    // totalSupply may have changed from initialSupply due to burning or inflation
    uint256 public totalSupply;

    mapping (address => bool) internal frozenAccounts;
    
    /**
     * Event generated when a CampGenie token account is frozen or released.
     * @param account The address of the affected account.
     * @param state The account state: `true` if frozen, `false` if released.
     */
    event FundsFrozen(address account, bool state);

    /**
     * Event generated when CampGenie tokens are removed from an account's balance (and threfore disappear).
     * @param burner The address of the account that burned the tokens.
     * @param value The amount of tokens that were burned.
     */
    event Burn(address indexed burner, uint256 value);

    modifier whenFrozen(address _account) {
        require(frozenAccounts[_account] == true);
        _;
    }

    modifier whenNotFrozen(address _account) {
        require(frozenAccounts[_account] == false);
        _;
    }
    
    /**
     * Constructor function
     *
     * Initializes contract with initial supply tokens to the creator of the contract.
     * @param initialSupplyValue The initial supply of tokens, in units of tokens.
     * @param tokenDecimals The number of decimals in the currency; controls how finely a token is split.
     * @param tokenName The token name (leave empty to use the default value).
     * @param tokenSymbol The token symbol (leave empty to use the default value).
     */
    constructor(
        uint256 initialSupplyValue,
        uint8 tokenDecimals,
        string tokenName,
        string tokenSymbol
    ) public {
        decimals = tokenDecimals;
        if (bytes(tokenName).length > 0) name = tokenName;
        if (bytes(tokenSymbol).length > 0) symbol = tokenSymbol;
        
        initialSupply = initialSupplyValue * 10**uint256(decimals);
        totalSupply = initialSupply;
        balances[msg.sender] = totalSupply;
    }

    /**
     * Transfer tokens.
     *
     * Send `_value` tokens to `_to` from your account.
     * Adds the `whenNotPaused` modifier and calls the superclass implementation.
     *
     * @param _to The address of the recipient
     * @param _value the amount to send
     */
    function transfer(address _to, uint256 _value) 
        public
        whenNotPaused
        whenNotFrozen(msg.sender) whenNotFrozen(_to)
        returns (bool)
    {
        return super.transfer(_to, _value);
    }

    /**
     * Transfer tokens from other address.
     *
     * Send `_value` tokens to `_to` on behalf of `_from`
     * Adds the `whenNotPaused` modifier and calls the superclass implementation.
     *
     * @param _from The address of the sender
     * @param _to The address of the recipient
     * @param _value the amount to send
     */
    function transferFrom(address _from, address _to, uint256 _value)
        public
        whenNotPaused
        whenNotFrozen(msg.sender) whenNotFrozen(_from) whenNotFrozen(_to)
        returns (bool)
    {
        return super.transferFrom(_from, _to, _value);
    }

    /**
     * Set allowance for other address.
     *
     * Allows `_spender` to spend no more than `_value` tokens on your behalf.
     * Adds the `whenNotPaused` modifier and calls the superclass implementation.
     *
     * @param _spender The address authorized to spend
     * @param _value the max amount they can spend
     */
    function approve(address _spender, uint256 _value)
        public
        whenNotPaused
        whenNotFrozen(msg.sender) whenNotFrozen(_spender)
        returns (bool)
    {
        return super.approve(_spender, _value);
    }

    /**
     * Destroy tokens.
     *
     * Remove `_value` tokens from the system irreversibly.
     * (Originally: Adds the `whenNotPaused` modifier and calls the superclass implementation.)
     *
     * @param _value the amount of money to burn
     */
    function burn(uint256 _value) public whenNotPaused whenNotFrozen(msg.sender) {
        // super.burn(_value);
        require(_value > 0);
        require(_value <= balances[msg.sender]);
        // no need to require value <= totalSupply, since that would imply the
        // sender's balance is greater than the totalSupply, which *should* be an assertion failure

        address burner = msg.sender;
        balances[burner] = balances[burner].sub(_value);
        totalSupply = totalSupply.sub(_value);
        emit Burn(burner, _value);
    }

    /**
     * Freeze or release funds for an account.
     * A frozen account cannot transfer or burn tokens.
     * @param _account The address of the account to freeze or release.
     * @param _frozen The account state: `true` to freeze, `false` to release.
     */
    function freeze(address _account, bool _frozen) public onlyOwner {
        frozenAccounts[_account] = _frozen;
        emit FundsFrozen(_account, _frozen);
    }

    /**
     * Get the frozen status of an account.
     * @param _account The address of the account.
     * @return Returns `true` if the account is frozen, `false` otherwise.
     */

    function isFrozen(address _account) public view returns(bool) {
        return (frozenAccounts[_account]) ? true : false;
    }
}
