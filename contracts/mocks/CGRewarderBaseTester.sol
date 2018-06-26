pragma solidity ^0.4.23;

import '../../contracts/CGRewarderBase.sol';

/**
 * @title CGRewarderBaseTester
 * @dev Test base reward contract functionality for CampGenie.
 */

contract CGRewarderBaseTester is CGRewarderBase {
    uint32 internal minBase;

    /**
     * Constructor function
     *
     * Associates the contract with a given token contract.
     *
     * @param _tokenizer The token contract to use.
     */

    constructor(address _tokenizer)
        CGRewarderBase(_tokenizer)
        public
    {
        versionNumber = 10010002; /* 1.1.2 = 2 + (1 * 10000) + (1 * 10000000) */

        minBase = 100;
    }

    /**
     * @notice Estimate the current reward.
     * @param _base The base value for the reward.
     */

    function estimateTestReward(uint32 _base)
        public view returns (uint256)
    {
        return calculateTestReward(_base);
    }

    /**
     * @notice Disburse tokens as a reward for doing something.
     * @dev The disbursement happens here.
     * @param _to The address to which tokens should be disbursed.
     * @param _base The base value for the reward.
     */

    function rewardTest(address _to, uint32 _base)
        onlyOwner whenNotPaused public
    {
        uint256 value = calculateTestReward(_base);
        disburse(_to, value);
    }

    /**
     * Get the minimum base value required to disburse funds.
     * @return The minimum number, as a uint32.
     */
    function getMinBase() public view returns (uint32) {
        return minBase;
    }

    /**
     * Set the minimum base value required to disburse funds.
     * @param _value The new minimum number.
     */
    function setMinBase(uint32 _value) onlyOwner public {
        require(_value > 0);
        minBase = _value;
    }

    /**
     * @notice Upgrade to a new version of the contract.
     * @dev Here as a sample; all it does is called the superclass.
     * @param _to The address of the new contract.
     */

    function upgrade(address _to) onlyOwner whenNotPaused public
    {
        super.upgrade(_to);
    }

    function calculateTestReward(uint32 _base)
        internal view returns (uint256)
    {
        require(_base >= minBase);

        uint256 value = _base * 2;

        return value;
    }
}
