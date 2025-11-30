import { loadFixture, time } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { expect } from "chai";
import hre from "hardhat";

describe("StakingContract", () => {
  async function deployFixture() {
    const stakeTokenName = "Roddy Token";
    const stakeTokenSymbol = "ROD";

    const rewardTokenName = "Doyin Token";
    const rewardTokenSymbol = "DYN";

    const [owner, account1, account2] = await hre.ethers.getSigners();

    const rewardRate = 10;

    const StakeToken = await hre.ethers.getContractFactory("StakeToken");
    const stakeToken = await StakeToken.deploy(stakeTokenName, stakeTokenSymbol);

    const RewardToken = await hre.ethers.getContractFactory("RewardToken");
    const rewardToken = await RewardToken.deploy(rewardTokenName, rewardTokenSymbol);

    const StakingContract = await hre.ethers.getContractFactory("StakingContract");
    const stakingContract = await StakingContract.deploy(
      stakeToken.target,
      rewardToken.target,
      rewardRate
    );

    await stakeToken.mint(account1.address, hre.ethers.parseEther("1000"));
    await stakeToken.mint(account2.address, hre.ethers.parseEther("1000"));
    await rewardToken.mint(owner.address, hre.ethers.parseEther("5000"));

    await rewardToken.transfer(
      stakingContract.target,
      hre.ethers.parseEther("3000")
    );

    await stakeToken.connect(account1).approve(
      stakingContract.target,
      hre.ethers.parseEther("1000")
    );

    await stakeToken.connect(account2).approve(
      stakingContract.target,
      hre.ethers.parseEther("1000")
    );

    return {
      stakingContract,
      stakeToken,
      rewardToken,
      owner,
      account1,
      account2,
      rewardRate
    };
  }

  it("deploys with correct parameters", async () => {
    const { stakingContract, stakeToken, rewardToken, rewardRate } =
      await loadFixture(deployFixture);

    expect(await stakingContract.stakeToken()).to.equal(stakeToken.target);
    expect(await stakingContract.rewardToken()).to.equal(rewardToken.target);
    expect(await stakingContract.rewardRate()).to.equal(rewardRate);
  });

  it("allows a user to stake tokens", async () => {
    const { stakingContract, account1 } = await loadFixture(deployFixture);

    await stakingContract.connect(account1).stake(hre.ethers.parseEther("100"));

    expect(await stakingContract.userStaked(account1.address)).to.equal(
      hre.ethers.parseEther("100")
    );

    expect(await stakingContract.totalStaked()).to.equal(
      hre.ethers.parseEther("100")
    );
  });

  it("reverts if user tries to stake zero", async () => {
    const { stakingContract, account1 } = await loadFixture(deployFixture);

    await expect(
      stakingContract.connect(account1).stake(0)
    ).to.be.revertedWith("Amount must be greater than zero");
  });

  it("accumulates rewards over time", async () => {
    const { stakingContract, account1, rewardRate } =
      await loadFixture(deployFixture);

    await stakingContract.connect(account1).stake(hre.ethers.parseEther("100"));

    await time.increase(10); // simulate 10 seconds

    const earned = await stakingContract.earned(account1.address);

    // Expected reward = rewardRate * seconds
    const expected = BigInt(rewardRate) * BigInt(10);

    expect(earned).to.be.closeTo(
      expected,
      BigInt("100000000000000000") // allow small difference
    );
  });

  it("allows a user to claim rewards", async () => {
    const { stakingContract, rewardToken, account1 } =
      await loadFixture(deployFixture);

    await stakingContract.connect(account1).stake(hre.ethers.parseEther("100"));

    await time.increase(5);

    await stakingContract.connect(account1).claimReward();

    const bal = await rewardToken.balanceOf(account1.address);
    expect(bal).to.be.gt(0);
  });

  it("reverts when claiming zero rewards", async () => {
    const { stakingContract, account1 } =
      await loadFixture(deployFixture);

    await expect(
      stakingContract.connect(account1).claimReward()
    ).to.be.revertedWith("No reward available");
  });

  it("allows user to withdraw staked tokens", async () => {
    const { stakingContract, stakeToken, account1 } =
      await loadFixture(deployFixture);

    await stakingContract.connect(account1).stake(hre.ethers.parseEther("50"));

    await stakingContract.connect(account1).withdraw(hre.ethers.parseEther("50"));

    const bal = await stakeToken.balanceOf(account1.address);
    expect(bal).to.equal(hre.ethers.parseEther("1000"));
  });

  it("reverts when withdrawing more than staked", async () => {
    const { stakingContract, account1 } = await loadFixture(deployFixture);

    await expect(
      stakingContract.connect(account1).withdraw(hre.ethers.parseEther("10"))
    ).to.be.revertedWith("Withdraw exceeds stake");
  });

  it("allows only owner to update reward rate", async () => {
    const { stakingContract, owner, account1 } =
      await loadFixture(deployFixture);

    await stakingContract.connect(owner).setRewardRate(20);
    expect(await stakingContract.rewardRate()).to.equal(20);

    await expect(
      stakingContract.connect(account1).setRewardRate(30)
    ).to.be.revertedWith("Not owner");
  });
});
