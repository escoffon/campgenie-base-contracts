pragma solidity ^0.4.23;

import '../../contracts/CGMintableTokenBase.sol';

/**
 * @title CGMintableTokenBaseTester
 * @dev Test ERC20 mintable token for CampGenie.
 */

contract CGMintableTokenBaseTester is CGMintableTokenBase {
    /**
     * Constructor function
     *
     * Initializes contract with initial supply tokens to the creator of the contract.
     * @param initialSupplyValue The initial supply of tokens, in units of tokens.
     * @param tokenDecimals The number of decimals in the currency; controls how finely a token is split.
     */
    constructor(uint256 initialSupplyValue, uint8 tokenDecimals)
        public
        CGMintableTokenBase(initialSupplyValue, tokenDecimals, "CGMintableTokenBaseTester", "CGMTT")
    {
    }
}
