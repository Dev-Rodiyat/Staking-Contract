// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import "./interfaces/IERC20.sol";

contract StakingContract {

    IERC20 public stakeToken;
    IERC20 public rewardToken;
    address public owner;

    uint256 public totalStaked;
    uint256 public rewardRate; // reward tokens per second 
    uint256 public lastUpdateTime;
    uint256 public rewardPerTokenStored;

    mapping(address => uint256) public userStaked; 
    mapping(address => uint256) public userRewardPerTokenPaid;
    mapping(address => uint256) public rewards;

    event Staked(address indexed user, uint256 amount);
    event Withdrawn(address indexed user, uint256 amount);
    event RewardPaid(address indexed user, uint256 reward);

    constructor(address _stakeToken, address _rewardToken, uint256 _rewardRate) {
        stakeToken = IERC20(_stakeToken);
        rewardToken = IERC20(_rewardToken);
        owner = msg.sender;
        rewardRate = _rewardRate;
        lastUpdateTime = block.timestamp;
    }

    modifier updateReward(address _address) {
        require(msg.sender != address(0), "Invalid sender address");
        rewardPerTokenStored = rewardPerToken();
        lastUpdateTime = block.timestamp;

        if (_address != address(0)) {
            rewards[_address] = earned(_address);
            userRewardPerTokenPaid[_address] = rewardPerTokenStored;
        }
        _;
    }

    // reward per token calculation
    function rewardPerToken() public view returns (uint256) {
        if (totalStaked == 0) {
            return rewardPerTokenStored;
        }
        return rewardPerTokenStored + ((block.timestamp - lastUpdateTime) * rewardRate * 1e18 / totalStaked);
    }

    function earned(address _address) public view returns (uint256) {
        return (userStaked[_address] * (rewardPerToken() - userRewardPerTokenPaid[_address]) / 1e18) + rewards[_address];
    }

    // stake tokens
    function stake(uint256 amount) external updateReward(msg.sender) {
        require(amount > 0, "Amount must be greater than zero");

        totalStaked += amount;
        userStaked[msg.sender] += amount;

        require(stakeToken.transferFrom(msg.sender, address(this), amount), "Stake transfer failed");

        emit Staked(msg.sender, amount);
    }

    // withdraw staked tokens
    function withdraw(uint256 amount) public updateReward(msg.sender) {
        require(amount > 0, "Cannot withdraw 0");
        require(userStaked[msg.sender] >= amount, "Withdraw exceeds stake");

        totalStaked -= amount;
        userStaked[msg.sender] -= amount;

        require(stakeToken.transfer(msg.sender, amount), "Withdraw transfer failed");

        emit Withdrawn(msg.sender, amount);
    }

    // claim rewards
    function claimReward() public updateReward(msg.sender) {
        uint256 reward = rewards[msg.sender];
        require(reward > 0, "No reward available");

        rewards[msg.sender] = 0;
        require(rewardToken.transfer(msg.sender, reward), "Reward transfer failed");

        emit RewardPaid(msg.sender, reward);
    }

    // only owner can update reward rate
    function setRewardRate(uint256 _rewardRate) external {
        require(msg.sender == owner, "Not owner");
        rewardRate = _rewardRate;
    }
}
