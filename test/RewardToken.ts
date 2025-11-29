import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { expect } from "chai";
import hre from "hardhat";

describe("RewardToken", function () {
  // Setup fixture function
  async function deployRewardTokenFixture() {
    const tokenName = "Doyin Token";
    const tokenSymbol = "DYN";

    // get accounts from ethers
    const [owner, account1, account2, ] = await hre.ethers.getSigners();

    const RewardToken = await hre.ethers.getContractFactory("RewardToken");
    const rewardToken = await RewardToken.deploy(tokenName, tokenSymbol);

    return {
      tokenName,
      tokenSymbol,
      rewardToken,
      owner,
      account1,
      account2
    };
  }

  describe("Deployment Test", function () {
    it("Should set the right token name and symbol", async function () {
      const { tokenName, tokenSymbol, rewardToken } = await loadFixture(
        deployRewardTokenFixture
      );

      expect(await rewardToken.name()).to.equal(tokenName);
      expect(await rewardToken.symbol()).to.equal(tokenSymbol);
    });

    it("Should assign owner at deployment", async function () {
      const { rewardToken, owner } = await loadFixture(deployRewardTokenFixture);

      expect(await rewardToken.owner()).to.equal(owner.address);
    });

    it("Should update total supply after deployment", async function () {
      const { rewardToken } = await loadFixture(deployRewardTokenFixture);

      expect(await rewardToken.totalSupply()).to.be.greaterThan(0);
    });

    it("Owner should have the total supply after deployment", async function () {
      const { rewardToken, owner } = await loadFixture(deployRewardTokenFixture);

      const totalSupply = await rewardToken.totalSupply();
      const ownerBal = await rewardToken.balanceOf(owner.address);

      expect(ownerBal).to.equal(totalSupply);
    });
  });

  describe("Transfer Tests", function () {
    it("Should revert if sender is address zero", async function () {
      const { rewardToken, owner, account1 } = await loadFixture(
        deployRewardTokenFixture
      );
      const zeroAddr = hre.ethers.ZeroAddress;

      await hre.network.provider.request({
        method: "hardhat_impersonateAccount",
        params: [zeroAddr],
      });

      await owner.sendTransaction({
        to: zeroAddr,
        value: hre.ethers.parseEther("1.0"),
      });

      const zeroSigner = await hre.ethers.getSigner(zeroAddr);

      await expect(
        rewardToken.connect(zeroSigner).transfer(account1.address, 100)
      ).to.be.revertedWith("Invalid sender address");
    });

    it("Should revert if recipient is address zero", async function () {
      const { rewardToken, owner } = await loadFixture(deployRewardTokenFixture);
      const zeroAddr = hre.ethers.ZeroAddress;

      await expect(
        rewardToken.connect(owner).transfer(zeroAddr, 100)
      ).to.be.revertedWith("Invalid recipient address");
    });

    it("Should revert if amount is zero or less", async function () {
      const { rewardToken, owner, account1 } = await loadFixture(
        deployRewardTokenFixture
      );

      await expect(
        rewardToken.connect(owner).transfer(account1.address, 0)
      ).to.be.revertedWith("Amount must be greater than zero");
    });

    it("Should revert if sender has insufficient balance", async function () {
      const { rewardToken, owner, account1 } = await loadFixture(
        deployRewardTokenFixture
      );
      const amount = hre.ethers.parseUnits("10000000", 18); // 10 million

      await expect(
        rewardToken.connect(owner).transfer(account1.address, amount)
      ).to.be.revertedWith("Insufficient balance");
    });

    it("Should transfer tokens successfully", async function () {
      const { rewardToken, owner, account1 } = await loadFixture(
        deployRewardTokenFixture
      );

      const initialBalancOfAccount1 = await rewardToken.balanceOf(
        account1.address
      );
      const initialbalanceOfOwner = await rewardToken.balanceOf(owner.address);
      const amountToTransfer = hre.ethers.parseUnits("100", 18); //100 tokens

      await rewardToken
        .connect(owner)
        .transfer(account1.address, amountToTransfer);

      const account1BalanceAfterTransfer = await rewardToken.balanceOf(
        account1.address
      );
      const ownerBalanceAfterTransfer = await rewardToken.balanceOf(
        owner.address
      );

      expect(account1BalanceAfterTransfer).to.be.greaterThan(
        initialBalancOfAccount1
      );
      expect(ownerBalanceAfterTransfer).to.be.lessThan(initialbalanceOfOwner);
      expect(account1BalanceAfterTransfer).to.equal(
        initialBalancOfAccount1 + amountToTransfer
      );
    });

    it("Should emit Transfer event on successful transfer", async function () {
      const { rewardToken, owner, account1 } = await loadFixture(
        deployRewardTokenFixture
      );
      const amountToTransfer = hre.ethers.parseUnits("100", 18);

      await expect(
        rewardToken.connect(owner).transfer(account1.address, amountToTransfer)
      )
        .to.emit(rewardToken, "Transfer")
        .withArgs(owner.address, account1.address, amountToTransfer);
    });
  });

  describe("Approve Tests", function () {
    it("Should revert if approver (sender) is address zero", async function () {
      const { rewardToken, owner, account1 } = await loadFixture(
        deployRewardTokenFixture
      );
      const zeroAddr = hre.ethers.ZeroAddress;

      await hre.network.provider.request({
        method: "hardhat_impersonateAccount",
        params: [zeroAddr],
      });

      await owner.sendTransaction({
        to: zeroAddr,
        value: hre.ethers.parseEther("1.0"),
      });

      const zeroSigner = await hre.ethers.getSigner(zeroAddr);

      await expect(
        rewardToken.connect(zeroSigner).approve(account1.address, 100)
      ).to.be.revertedWith("Invalid sender address");
    });

    it("Should revert if spender (approved) is address zero", async function () {
      const { rewardToken, owner } = await loadFixture(deployRewardTokenFixture);

      await expect(
        rewardToken.connect(owner).approve(hre.ethers.ZeroAddress, 100)
      ).to.be.revertedWith("Invalid spender address");
    });

    it("Should revert if approver (sender) has insufficient balance", async function () {
      const { rewardToken, owner, account1 } = await loadFixture(
        deployRewardTokenFixture
      );
      const amount = hre.ethers.parseUnits("10000000", 18); // 10 million

      await expect(
        rewardToken.connect(owner).approve(account1.address, amount)
      ).to.be.revertedWith("Insufficient balance");
    });

    it("Should revert if amount is zero or less", async function () {
      const { rewardToken, owner, account1 } = await loadFixture(
        deployRewardTokenFixture
      );

      await expect(
        rewardToken.connect(owner).approve(account1.address, 0)
      ).to.be.revertedWith("Amount must be greater than zero");
    });

    it("Should approve spender to spend tokens successfully", async function () {
      const { rewardToken, owner, account1 } = await loadFixture(
        deployRewardTokenFixture
      );

      const amountToApprove = hre.ethers.parseUnits("100", 9);

      await rewardToken
        .connect(owner)
        .approve(account1.address, amountToApprove);
    });

    it("Should emit Approval event on successful approval", async function () {
      const { rewardToken, owner, account1 } = await loadFixture(
        deployRewardTokenFixture
      );
      const amountToApprove = hre.ethers.parseUnits("100", 9);

      await expect(
        rewardToken.connect(owner).approve(account1.address, amountToApprove)
      )
        .to.emit(rewardToken, "Approval")
        .withArgs(owner.address, account1.address, amountToApprove);
    });
  });

  describe("TransferFrom Tests", () => {
    it("Should revert if caller (spender) is address zero", async () => {
      const { rewardToken, owner, account2 } = await loadFixture(
        deployRewardTokenFixture
      );
      const zeroAddr = hre.ethers.ZeroAddress;

      await hre.network.provider.request({
        method: "hardhat_impersonateAccount",
        params: [zeroAddr],
      });

      await owner.sendTransaction({
        to: zeroAddr,
        value: hre.ethers.parseEther("1.0"),
      });

      const zeroSigner = await hre.ethers.getSigner(zeroAddr);

      await expect(
        rewardToken.connect(zeroSigner).transferFrom(owner.address, account2.address, 100)
      ).to.be.revertedWith("Invalid caller address");
    });

    it("Should revert if owner is address zero", async () => {
      const { rewardToken, account1, account2 } = await loadFixture(
        deployRewardTokenFixture
      );
      const zeroAddr = hre.ethers.ZeroAddress;

      await expect(
        rewardToken.connect(account1).transferFrom(zeroAddr, account2.address, 100)
      ).to.be.revertedWith("Invalid owner address");
    });

    it("Should revert if recipient is address zero", async () => {
      const { rewardToken, owner, account1 } = await loadFixture(deployRewardTokenFixture);

      await expect(
        rewardToken.connect(account1).transferFrom(owner.address, hre.ethers.ZeroAddress, 100)
      ).to.be.revertedWith("Invalid recipient address");
    });

    it("Should revert if amount is zero or less", async () => {
      const { rewardToken, owner, account1, account2 } = await loadFixture(
        deployRewardTokenFixture
      );

      await expect(
        rewardToken.connect(account1).transferFrom(owner.address, account2.address, 0)
      ).to.be.revertedWith("Amount must be greater than zero");
    });

    it("Should revert if owner has insufficient balance", async () => {
      const { rewardToken, owner, account1, account2 } = await loadFixture(
        deployRewardTokenFixture
      );
      const amount = hre.ethers.parseUnits("10000000", 24); // 10 million

      await expect(
        rewardToken.connect(account1).transferFrom(owner.address, account2.address, amount)
      ).to.be.revertedWith("Insufficient balance");
    });

    it("Should revert if ammount excedes approved amount", async () => {
      const { rewardToken, owner, account1, account2 } = await loadFixture(
        deployRewardTokenFixture
      );

      const approvedAmount = hre.ethers.parseUnits("100", 18);

      await expect(
        rewardToken.connect(account1).transferFrom(owner.address, account2.address, approvedAmount)
      ).to.be.revertedWith("Allownce exceeded");
    });

    it("Should allow account 1 to transfer from owner to account 2 successfully", async () => {
      const { rewardToken, owner, account1, account2 } = await loadFixture(deployRewardTokenFixture);

      await rewardToken.connect(owner).approve(account1.address, 100)
      await rewardToken.connect(account1).transferFrom(owner.address, account2.address, 100)
    })

    it("Should emit Transfer event on successful transfer", async () => {
      const { rewardToken, owner, account1, account2 } = await loadFixture(
        deployRewardTokenFixture
      );
      const amountToTransfer = hre.ethers.parseUnits("100", 9);

      await rewardToken.connect(owner).approve(account1.address, amountToTransfer);

      await expect(
        rewardToken.connect(account1).transferFrom(owner.address, account2.address, amountToTransfer)
      )
        .to.emit(rewardToken, "Transfer")
        .withArgs(owner.address, account2.address, amountToTransfer);
    });
  });

  describe("Mint Tests", () => {
    it("Should revert if others users except owner tries to mint token", async () => {
      const { rewardToken, account1 } = await loadFixture(
        deployRewardTokenFixture
      );

      await expect(
        rewardToken.connect(account1).mint(account1.address, 100)
      ).to.be.revertedWith("Only owner can mint token");
    });

    it("Should revert if recipient is address zero", async () => {
      const { rewardToken, owner } = await loadFixture(deployRewardTokenFixture);
      const zeroAddr = hre.ethers.ZeroAddress;

      await expect(
        rewardToken.connect(owner).mint(zeroAddr, 100)
      ).to.be.revertedWith("Invalid recipient address");
    });

    it("Should revert if amount is zero or less", async () => {
      const { rewardToken, owner } = await loadFixture(
        deployRewardTokenFixture
      );

      await expect(
        rewardToken.connect(owner).mint(owner.address, 0)
      ).to.be.revertedWith("Amount must be greater than zero");
    });

    it("Should allow owner to mint token successfully", async () => {
      const { rewardToken, owner } = await loadFixture(
        deployRewardTokenFixture
      );

      const initialbalanceOfOwner = await rewardToken.balanceOf(owner.address);
      const amountToMint = hre.ethers.parseUnits("100", 2);

      await rewardToken.connect(owner).mint(owner.address, amountToMint)

      const ownerBalanceAfterMint = await rewardToken.balanceOf(
        owner.address
      );

      expect(ownerBalanceAfterMint).to.be.greaterThan(initialbalanceOfOwner);
      expect(ownerBalanceAfterMint).to.equal(
        initialbalanceOfOwner + amountToMint
      );
    });

    it("Should emit Transfer event on successful mint", async () => {
      const { rewardToken, owner } = await loadFixture(
        deployRewardTokenFixture
      );
      const amountToMint = hre.ethers.parseUnits("100", 9);
      const zeroAddr = hre.ethers.ZeroAddress;

      await expect(
        rewardToken.connect(owner).mint(owner.address, amountToMint)
      )
        .to.emit(rewardToken, "Transfer")
        .withArgs(zeroAddr, owner.address, amountToMint);
    });
  });

  describe("Burn Tests", () => {
    it("Should revert if amount is zero or less", async () => {
      const { rewardToken, owner } = await loadFixture(
        deployRewardTokenFixture
      );

      await expect(
        rewardToken.connect(owner).burn(0)
      ).to.be.revertedWith("Amount must be greater than zero");
    });

    it("Should revert if sender has insufficient balance", async () => {
      const { rewardToken, account1 } = await loadFixture(
        deployRewardTokenFixture
      );
      const amount = hre.ethers.parseUnits("10000000", 24);

      await expect(
        rewardToken.connect(account1).burn(amount)
      ).to.be.revertedWith("Insufficient balance");
    });

    it("Should allow users to burn token successfully", async () => {
      const { rewardToken, owner } = await loadFixture(
        deployRewardTokenFixture
      );

      const initialbalanceOfOwner = await rewardToken.balanceOf(owner.address);
      const amountBurn = hre.ethers.parseUnits("100", 2);

      await rewardToken.connect(owner).burn(amountBurn)

      const ownerBalanceAfterBurn = await rewardToken.balanceOf(
        owner.address
      );

      expect(ownerBalanceAfterBurn).to.be.lessThan(initialbalanceOfOwner);
      expect(ownerBalanceAfterBurn).to.equal(
        initialbalanceOfOwner - amountBurn
      );
    });

    it("Should emit Transfer event on successful burn", async () => {
      const { rewardToken, owner } = await loadFixture(
        deployRewardTokenFixture
      );
      const amountBurn = hre.ethers.parseUnits("100", 9);
      const zeroAddr = hre.ethers.ZeroAddress;

      await expect(
        rewardToken.connect(owner).burn(amountBurn)
      )
        .to.emit(rewardToken, "Transfer")
        .withArgs(owner.address, zeroAddr, amountBurn);
    });
  });
});