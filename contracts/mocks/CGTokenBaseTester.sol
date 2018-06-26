pragma solidity ^0.4.23;

import '../../contracts/CGTokenBase.sol';

/**
 * @title CGTokenBaseTester
 * @dev Test ERC20 token for CampGenie.
 */

contract CGTokenBaseTester is CGTokenBase {
    /**
     * Constructor function
     *
     * Initializes contract with initial supply tokens to the creator of the contract.
     * @param initialSupplyValue The initial supply of tokens, in units of tokens.
     * @param tokenDecimals The number of decimals in the currency; controls how finely a token is split.
     * @param initAddress The address of an account that is given tokens.
     * @param tokens How many tokens to give to +initAddress+.
     */
    constructor(
        uint256 initialSupplyValue,
        uint8 tokenDecimals,
        address initAddress,
        uint256 tokens
    )
        public
        CGTokenBase(initialSupplyValue, tokenDecimals, "CGTokenBaseTester", "CGTT")
    {
        if (initAddress != 0) {
            transfer(initAddress, tokens);
        }
    }
}
