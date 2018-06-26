pragma solidity ^0.4.23;

import 'openzeppelin-solidity/contracts/ownership/Ownable.sol';

/**
 * @title CampGenie mintable token abstract contract.
 * @dev This contract adds support for minting tokens to CGTokenBase. It implements the functionality to
 *  manage permissions to mint, leaving the implementation of the actual mint functionality to subclasses.
 * @dev It is an abstract contract that implements some common functionality, but leaves
 * @dev the `mint` function unimplemented.
 * @dev Based on code by OpenZeppelin: https://github.com/OpenZeppelin/zeppelin-solidity/blob/master/contracts/token/MintableToken.sol
 */

contract CGMintable is Ownable {
    event Mint(address indexed to, uint256 amount);
    event MintPaused();
    event MintResumed();

    struct Minter {
        uint256 max;
        uint256 minted;
        bool active;
    }

    bool public mintingPaused = false;
    mapping(address => Minter) internal minters;
  
    modifier mintEnabled() {
        require(!mintingPaused);
        _;
    }

    modifier activeMinter(address m) {
        require(isMinterActive(m));
        _;
    }
  
    /**
     * @notice Mint tokens and award them to a given address.
     * @dev The call fails if `_amount` is larger than the current mint limit for the caller.
     * @param _to The address that will receive the minted tokens.
     * @param _amount The amount of tokens to mint.
     */
    function mint(address _to, uint256 _amount) mintEnabled activeMinter(msg.sender) public {
    }

    /**
     * @notice Pause minting new tokens.
     */
    function pauseMinting() onlyOwner public {
        mintingPaused = true;
        emit MintPaused();
    }

    /**
     * @notice Resume minting new tokens.
     */
    function resumeMinting() onlyOwner public {
        mintingPaused = false;
        emit MintResumed();
    }

    /**
     * @notice Register a minter.
     *  If the minter is already registered, the _max_ value is modified.
     * @param m An address that will be allowed to mint tokens.
     * @param max The maximum amount of tokens that the minter will be allowed to create.
     *  Must be greater than 0.
     */
    function registerMinter(address m, uint256 max) onlyOwner public {
        require(max > 0);
        
        if (isMinterRegistered(m)) {
            minters[m].max = max;
        } else {
            minters[m] = Minter({ max: max, minted: 0, active: true });
        }
    }

    /**
     * @notice Unregister a minter.
     * @param m An address that will no longer be allowed to mint tokens.
     */
    function unregisterMinter(address m) onlyOwner public {
        delete minters[m];
    }

    /**
     * @notice Deactivate a minter.
     * @param m An address that will not be allowed to mint tokens until reactivated.
     */
    function deactivateMinter(address m) onlyOwner public {
        if (isMinterActive(m)) {
            minters[m].active = false;
        }
    }

    /**
     * @notice Activate a minter.
     * @param m An address that will be allowed to mint tokens (if it had previously been registered with
     *  `registerMinter`).
     */
    function activateMinter(address m) onlyOwner public {
        if (!isMinterActive(m)) {
            minters[m].active = true;
        }
    }

    /**
     * @notice Get a minter's status.
     * @param m An address registered as a minter.
     * @return Returns an exploded `Minter` struct containing the minter's status:
     *  `true` if active; how many tokens it can mint; how many tokens it has minted so far.
     */
    function minterStatus(address m) public view returns(uint256, uint256, bool) {
        return (minters[m].max, minters[m].minted, minters[m].active);
    }

    function isMinterRegistered(address m) internal view returns(bool) {
        return (minters[m].max > 0);
    }

    function isMinterActive(address m) internal view returns(bool) {
        return (isMinterRegistered(m) && minters[m].active);
    }
}
