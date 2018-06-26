pragma solidity ^0.4.17;

import '../../contracts/CGMintable.sol';
import 'openzeppelin-solidity/contracts/math/SafeMath.sol';

/**
 * @title CGMintableTester
 * @dev Test ERC20 mintable token for CampGenie.
 */

contract CGMintableTester is CGMintable {
    using SafeMath for uint256;

    /**
     * Constructor function
     */
    constructor() public {
    }

    /**
     * Function to mint tokens.
     * @dev Implementation is not complete; this function is defined so that the contract can be instantiated.
     *  However, the Mint event is generated and the minter status updated.
     * @param _to The address that will receive the minted tokens.
     * @param _amount The amount of tokens to mint.
     */
    function mint(address _to, uint256 _amount) mintEnabled activeMinter(msg.sender) public {
        Minter storage m = minters[msg.sender];
        uint256 minted = m.minted.add(_amount);
        require(minted <= m.max);
        
        m.minted = minted;

        emit Mint(_to, _amount);
    }
}
