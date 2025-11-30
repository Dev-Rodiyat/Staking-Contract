import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { expect } from "chai";
import hre from "hardhat";

describe("StakeToken", function () {

  async function deployStakeTokenFixture() {
    const tokenName = "Roddy Token";
    const tokenSymbol = "ROD";

    const [owner, account1, account2, account3] = await hre.ethers.getSigners();

    const StakeToken = await hre.ethers.getContractFactory("StakeToken");
    const staketoken = await StakeToken.deploy(tokenName, tokenSymbol);

    return {
      tokenName,
      tokenSymbol,
      staketoken,
      owner,
      account1,
      account2,
      account3,
    };
  }

  describe("Deployment Test", function () {
    it("Should set the right token name and symbol", async function () {
      const { tokenName, tokenSymbol, staketoken } = await loadFixture(
        deployStakeTokenFixture
      );

      expect(await staketoken.name()).to.equal(tokenName);
      expect(await staketoken.symbol()).to.equal(tokenSymbol);
    });

    it("Should assign owner at deployment", async function () {
      const { staketoken, owner } = await loadFixture(deployStakeTokenFixture);

      expect(await staketoken.owner()).to.equal(owner.address);
    });

    it("Should update total supply after deployment", async function () {
      const { staketoken } = await loadFixture(deployStakeTokenFixture);

      expect(await staketoken.totalSupply()).to.be.greaterThan(0);
    });

    it("Owner should have the total supply after deployment", async function () {
      const { staketoken, owner } = await loadFixture(deployStakeTokenFixture);

      const totalSupply = await staketoken.totalSupply();
      const ownerBal = await staketoken.balanceOf(owner.address);

      expect(ownerBal).to.equal(totalSupply);
    });
  });

  describe("Transfer Tests", function () {
    it("Should revert if sender is address zero", async function () {
      const { staketoken, owner, account1 } = await loadFixture(
        deployStakeTokenFixture
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
        staketoken.connect(zeroSigner).transfer(account1.address, 100)
      ).to.be.revertedWith("Invalid sender address");
    });

    it("Should revert if recipient is address zero", async function () {
      const { staketoken, owner } = await loadFixture(deployStakeTokenFixture);
      const zeroAddr = hre.ethers.ZeroAddress;

      await expect(
        staketoken.connect(owner).transfer(zeroAddr, 100)
      ).to.be.revertedWith("Invalid recipient address");
    });

    it("Should revert if amount is zero or less", async function () {
      const { staketoken, owner, account1 } = await loadFixture(
        deployStakeTokenFixture
      );

      await expect(
        staketoken.connect(owner).transfer(account1.address, 0)
      ).to.be.revertedWith("Amount must be greater than zero");
    });

    it("Should revert if sender has insufficient balance", async function () {
      const { staketoken, owner, account1 } = await loadFixture(
        deployStakeTokenFixture
      );
      const amount = hre.ethers.parseUnits("10000000", 18); // 10 million

      await expect(
        staketoken.connect(owner).transfer(account1.address, amount)
      ).to.be.revertedWith("Insufficient balance");
    });

    it("Should transfer tokens successfully", async function () {
      const { staketoken, owner, account1 } = await loadFixture(
        deployStakeTokenFixture
      );

      const initialBalancOfAccount1 = await staketoken.balanceOf(
        account1.address
      );
      const initialbalanceOfOwner = await staketoken.balanceOf(owner.address);
      const amountToTransfer = hre.ethers.parseUnits("100", 18); //100 tokens

      await staketoken
        .connect(owner)
        .transfer(account1.address, amountToTransfer);

      const account1BalanceAfterTransfer = await staketoken.balanceOf(
        account1.address
      );
      const ownerBalanceAfterTransfer = await staketoken.balanceOf(
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
      const { staketoken, owner, account1 } = await loadFixture(
        deployStakeTokenFixture
      );
      const amountToTransfer = hre.ethers.parseUnits("100", 18);

      await expect(
        staketoken.connect(owner).transfer(account1.address, amountToTransfer)
      )
        .to.emit(staketoken, "Transfer")
        .withArgs(owner.address, account1.address, amountToTransfer);
    });
  });

  describe("Approve Tests", function () {
    it("Should revert if approver (sender) is address zero", async function () {
      const { staketoken, owner, account1 } = await loadFixture(
        deployStakeTokenFixture
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
        staketoken.connect(zeroSigner).approve(account1.address, 100)
      ).to.be.revertedWith("Invalid sender address");
    });

    it("Should revert if spender (approved) is address zero", async function () {
      const { staketoken, owner } = await loadFixture(deployStakeTokenFixture);

      await expect(
        staketoken.connect(owner).approve(hre.ethers.ZeroAddress, 100)
      ).to.be.revertedWith("Invalid spender address");
    });

    it("Should revert if approver (sender) has insufficient balance", async function () {
      const { staketoken, owner, account1 } = await loadFixture(
        deployStakeTokenFixture
      );
      const amount = hre.ethers.parseUnits("10000000", 18); // 10 million

      await expect(
        staketoken.connect(owner).approve(account1.address, amount)
      ).to.be.revertedWith("Insufficient balance");
    });

    it("Should revert if amount is zero or less", async function () {
      const { staketoken, owner, account1 } = await loadFixture(
        deployStakeTokenFixture
      );

      await expect(
        staketoken.connect(owner).approve(account1.address, 0)
      ).to.be.revertedWith("Amount must be greater than zero");
    });

    it("Should approve spender to spend tokens successfully", async function () {
      const { staketoken, owner, account1 } = await loadFixture(
        deployStakeTokenFixture
      );

      const amountToApprove = hre.ethers.parseUnits("100", 9);

      await staketoken
        .connect(owner)
        .approve(account1.address, amountToApprove);
    });

    it("Should emit Approval event on successful approval", async function () {
      const { staketoken, owner, account1 } = await loadFixture(
        deployStakeTokenFixture
      );
      const amountToApprove = hre.ethers.parseUnits("100", 9);

      await expect(
        staketoken.connect(owner).approve(account1.address, amountToApprove)
      )
        .to.emit(staketoken, "Approval")
        .withArgs(owner.address, account1.address, amountToApprove);
    });
  });

  describe("TransferFrom Tests", () => {
    it("Should revert if caller (spender) is address zero", async () => {
      const { staketoken, owner, account2 } = await loadFixture(
        deployStakeTokenFixture
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
        staketoken.connect(zeroSigner).transferFrom(owner.address, account2.address, 100)
      ).to.be.revertedWith("Invalid caller address");
    });

    it("Should revert if owner is address zero", async () => {
      const { staketoken, account1, account2 } = await loadFixture(
        deployStakeTokenFixture
      );
      const zeroAddr = hre.ethers.ZeroAddress;

      await expect(
        staketoken.connect(account1).transferFrom(zeroAddr, account2.address, 100)
      ).to.be.revertedWith("Invalid owner address");
    });

    it("Should revert if recipient is address zero", async () => {
      const { staketoken, owner, account1 } = await loadFixture(deployStakeTokenFixture);

      await expect(
        staketoken.connect(account1).transferFrom(owner.address, hre.ethers.ZeroAddress, 100)
      ).to.be.revertedWith("Invalid recipient address");
    });

    it("Should revert if amount is zero or less", async () => {
      const { staketoken, owner, account1, account2 } = await loadFixture(
        deployStakeTokenFixture
      );

      await expect(
        staketoken.connect(account1).transferFrom(owner.address, account2.address, 0)
      ).to.be.revertedWith("Amount must be greater than zero");
    });

    it("Should revert if owner has insufficient balance", async () => {
      const { staketoken, owner, account1, account2 } = await loadFixture(
        deployStakeTokenFixture
      );
      const amount = hre.ethers.parseUnits("10000000", 24); // 10 million

      await expect(
        staketoken.connect(account1).transferFrom(owner.address, account2.address, amount)
      ).to.be.revertedWith("Insufficient balance");
    });

    it("Should revert if ammount excedes approved amount", async () => {
      const { staketoken, owner, account1, account2 } = await loadFixture(
        deployStakeTokenFixture
      );

      const approvedAmount = hre.ethers.parseUnits("100", 18);

      await expect(
        staketoken.connect(account1).transferFrom(owner.address, account2.address, approvedAmount)
      ).to.be.revertedWith("Allownce exceeded");
    });

    it("Should allow account 1 to transfer from owner to account 2 successfully", async () => {
      const { staketoken, owner, account1, account2 } = await loadFixture(deployStakeTokenFixture);

      await staketoken.connect(owner).approve(account1.address, 100)
      await staketoken.connect(account1).transferFrom(owner.address, account2.address, 100)
    })

    it("Should emit Transfer event on successful transfer", async () => {
      const { staketoken, owner, account1, account2 } = await loadFixture(
        deployStakeTokenFixture
      );
      const amountToTransfer = hre.ethers.parseUnits("100", 9);

      await staketoken.connect(owner).approve(account1.address, amountToTransfer);

      await expect(
        staketoken.connect(account1).transferFrom(owner.address, account2.address, amountToTransfer)
      )
        .to.emit(staketoken, "Transfer")
        .withArgs(owner.address, account2.address, amountToTransfer);
    });
  });

  describe("Mint Tests", () => {
    it("Should revert if others users except owner tries to mint token", async () => {
      const { staketoken, account1 } = await loadFixture(
        deployStakeTokenFixture
      );

      await expect(
        staketoken.connect(account1).mint(account1.address, 100)
      ).to.be.revertedWith("Only owner can mint token");
    });

    it("Should revert if recipient is address zero", async () => {
      const { staketoken, owner } = await loadFixture(deployStakeTokenFixture);
      const zeroAddr = hre.ethers.ZeroAddress;

      await expect(
        staketoken.connect(owner).mint(zeroAddr, 100)
      ).to.be.revertedWith("Invalid recipient address");
    });

    it("Should revert if amount is zero or less", async () => {
      const { staketoken, owner } = await loadFixture(
        deployStakeTokenFixture
      );

      await expect(
        staketoken.connect(owner).mint(owner.address, 0)
      ).to.be.revertedWith("Amount must be greater than zero");
    });

    it("Should allow owner to mint token successfully", async () => {
      const { staketoken, owner } = await loadFixture(
        deployStakeTokenFixture
      );

      const initialbalanceOfOwner = await staketoken.balanceOf(owner.address);
      const amountToMint = hre.ethers.parseUnits("100", 2);

      await staketoken.connect(owner).mint(owner.address, amountToMint)

      const ownerBalanceAfterMint = await staketoken.balanceOf(
        owner.address
      );

      expect(ownerBalanceAfterMint).to.be.greaterThan(initialbalanceOfOwner);
      expect(ownerBalanceAfterMint).to.equal(
        initialbalanceOfOwner + amountToMint
      );
    });

    it("Should emit Transfer event on successful mint", async () => {
      const { staketoken, owner } = await loadFixture(
        deployStakeTokenFixture
      );
      const amountToMint = hre.ethers.parseUnits("100", 9);
      const zeroAddr = hre.ethers.ZeroAddress;

      await expect(
        staketoken.connect(owner).mint(owner.address, amountToMint)
      )
        .to.emit(staketoken, "Transfer")
        .withArgs(zeroAddr, owner.address, amountToMint);
    });
  });

  describe("Burn Tests", () => {
    it("Should revert if amount is zero or less", async () => {
      const { staketoken, owner } = await loadFixture(
        deployStakeTokenFixture
      );

      await expect(
        staketoken.connect(owner).burn(0)
      ).to.be.revertedWith("Amount must be greater than zero");
    });

    it("Should revert if sender has insufficient balance", async () => {
      const { staketoken, account1 } = await loadFixture(
        deployStakeTokenFixture
      );
      const amount = hre.ethers.parseUnits("10000000", 24);

      await expect(
        staketoken.connect(account1).burn(amount)
      ).to.be.revertedWith("Insufficient balance");
    });

    it("Should allow users to burn token successfully", async () => {
      const { staketoken, owner } = await loadFixture(
        deployStakeTokenFixture
      );

      const initialbalanceOfOwner = await staketoken.balanceOf(owner.address);
      const amountBurn = hre.ethers.parseUnits("100", 2);

      await staketoken.connect(owner).burn(amountBurn)

      const ownerBalanceAfterBurn = await staketoken.balanceOf(
        owner.address
      );

      expect(ownerBalanceAfterBurn).to.be.lessThan(initialbalanceOfOwner);
      expect(ownerBalanceAfterBurn).to.equal(
        initialbalanceOfOwner - amountBurn
      );
    });

    it("Should emit Transfer event on successful burn", async () => {
      const { staketoken, owner } = await loadFixture(
        deployStakeTokenFixture
      );
      const amountBurn = hre.ethers.parseUnits("100", 9);
      const zeroAddr = hre.ethers.ZeroAddress;

      await expect(
        staketoken.connect(owner).burn(amountBurn)
      )
        .to.emit(staketoken, "Transfer")
        .withArgs(owner.address, zeroAddr, amountBurn);
    });
  });
});