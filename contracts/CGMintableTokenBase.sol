pragma solidity ^0.4.23;

import './CGTokenBase.sol';
import './CGMintable.sol';

/**
 * @title CampGenie Mintable token base
 * @dev This contract adds support for minting tokens to CGTokenBase.
 * Based on code by OpenZeppelin: https://github.com/OpenZeppelin/zeppelin-solidity/blob/master/contracts/token/MintableToken.sol
 */

contract CGMintableTokenBase is CGTokenBase, CGMintable {
    /**
     * Constructor function
     *
     * Initializes contract with initial supply tokens to the creator of the contract.
     * Adds the owner to the list of minters with a limit of 1/10 of the initial supply.
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
    )
        public
        CGTokenBase(initialSupplyValue, tokenDecimals, tokenName, tokenSymbol)
    {
        registerMinter(owner, totalSupply / 10);
    }
  
    /**
     * Function to mint tokens.
     * @dev The call fails if `_amount` is larger than the current mint limit for the caller.
     * @param _to The address that will receive the minted tokens.
     * @param _amount The amount of tokens to mint.
     */
    function mint(address _to, uint256 _amount) mintEnabled activeMinter(msg.sender) public {
        Minter storage m = minters[msg.sender];
        uint256 minted = m.minted.add(_amount);
        require (minted <= m.max);
        
        m.minted = minted;
        totalSupply = totalSupply.add(_amount);
        balances[_to] = balances[_to].add(_amount);

        emit Mint(_to, _amount);
    }
}
