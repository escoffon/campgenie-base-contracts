pragma solidity ^0.4.23;

import 'openzeppelin-solidity/contracts/token/ERC20/StandardToken.sol';
import 'openzeppelin-solidity/contracts/ownership/Ownable.sol';
import 'openzeppelin-solidity/contracts/lifecycle/Pausable.sol';

/**
 * @title Base class for CampGenie token rewards contracts.
 * @dev This contract implement the common functionality for contracts that disburse CampGenie
 *  token rewards. Subclasses implement the application-specific rewards.
 */

contract CGRewarderBase is Ownable, Pausable {
    StandardToken public tokenizer;

    event Disburse(address indexed to, uint256 amount);
    event Upgrade(address indexed to, uint256 amount);

    uint32 internal versionNumber = 0; /* 0.0.0 = 0 + (0 * 10000) + (0 * 10000000) */

    /**
     * Constructor.
     *
     * Associates the contract with a given token contract.
     *
     * @param _tokenizer The token contract to use.
     */

    constructor(address _tokenizer) public {
        tokenizer = StandardToken(_tokenizer);
    }

    /**
     * Change the token contract used for disbursements.
     * @param _tokenizer The new token contract.
     */

    function changeTokenizer(address _tokenizer) onlyOwner public {
        tokenizer = StandardToken(_tokenizer);
    }

    /**
     * Get the version number
     * @return The version number, as a uint32. The version number is generated as follows:
     *  given major version number maj, minor version number min, and release number rel, then the
     *  version number is rel + (min * 10000) + (maj * 10000000).
     */

    function getVersionNumber() public view returns (uint32) {
        return versionNumber;
    }

    /**
     * @notice Upgrade to a new version of the contract.
     * @dev This method hands off to a different contract, which is typically a new version of the
     *  rewarder. Currently all it does is transfer the contract's unused tokens to the new contract.
     * @param _to The address of the new contract.
     */

    function upgrade(address _to) onlyOwner whenNotPaused public
    {
        // This is the balance of undisbursed tokens, which we'll transfer to _to

        uint256 bal = tokenizer.balanceOf(address(this));
        
        tokenizer.transfer(_to, bal);

        emit Upgrade(_to, bal);
    }

    /**
     * @notice Disburse tokens to a given address.
     * @dev This internal method should be used by the reward methods to disburse the tokens, since
     *  it not only transfers the balance to the given account, but also generates a Disburse event
     *  to mark the transaction. Note that this method does no access or validity controls, as it assumes
     *  the callers have taken care of that.
     * @param _to The address to which the tokens are transfered.
     * @param _value The amount to transfer.
     */

    function disburse(address _to, uint256 _value) internal {
        tokenizer.transfer(_to, _value);

        emit Disburse(_to, _value);
    }
}
