// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

contract RewardToken {

    string private _name;
    string private _symbol;
    uint8 private _decimals = 18;
    uint256 private _totalSupply;

    mapping(address => uint256) public balances;
    mapping(address => mapping(address => uint256)) public allowances;

    address public owner;

    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(address indexed owner, address indexed spender, uint256 value);

    constructor(string memory _n, string memory _s) {
        owner = msg.sender;
        _name = _n;
        _symbol = _s;

        // Mint 1 million tokens to the deployer
        mint(msg.sender, 1_000_000 * (10 ** decimals()));
    }

    // Metadata functions
    function name() public view returns (string memory) { return _name; }
    function symbol() public view returns (string memory) { return _symbol; }
    function decimals() public view returns (uint8) { return _decimals; }
    function totalSupply() public view returns (uint256) { return _totalSupply; }
    function balanceOf(address _address) public view returns (uint256) { return balances[_address]; }
    function allowance(address _owner, address spender) public view returns (uint256) { return allowances[_owner][spender]; }

    // Core functions
    function transfer(address to, uint256 value) public returns (bool) {
        require(msg.sender != address(0), "Invalid sender address");
        require(to != address(0), "Invalid recipient address");
        require(value > 0, "Amount must be greater than zero");
        require(balances[msg.sender] >= value, "Insufficient balance");

        balances[msg.sender] -= value;
        balances[to] += value;

        emit Transfer(msg.sender, to, value);
        return true;
    }

    function approve(address spender, uint256 value) public returns (bool) {
        require(msg.sender != address(0), "Invalid sender address");
        require(spender != address(0), "Invalid spender address");
        require(balances[msg.sender] >= value, "Insufficient balance");
        require(value > 0, "Amount must be greater than zero");

        allowances[msg.sender][spender] += value;
        emit Approval(msg.sender, spender, value);
        return true;
    }

    function transferFrom(address from, address to, uint256 value) public returns (bool) {
        require(msg.sender != address(0), "Invalid caller address");
        require(from != address(0), "Invalid owner address");
        require(to != address(0), "Invalid recipient address");
        require(value > 0, "Amount must be greater than zero");
        require(balances[from] >= value, "Insufficient balance");
        require(allowances[from][msg.sender] >= value, "Allownce exceeded");

        allowances[from][msg.sender] -= value;
        balances[from] -= value;
        balances[to] += value;

        emit Transfer(from, to, value);
        return true;
    }

    // Mint and burn
    function mint(address to, uint256 value) public {
        require(msg.sender == owner, "Only owner can mint token");
        require(to != address(0), "Invalid recipient address");
        require(value > 0, "Amount must be greater than zero");

        _totalSupply += value;
        balances[to] += value;

        emit Transfer(address(0), to, value);
    }

    function burn(uint256 value) public {
        require(value > 0, "Amount must be greater than zero");
        require(balances[msg.sender] >= value, "Insufficient balance");

        balances[msg.sender] -= value;
        _totalSupply -= value;

        emit Transfer(msg.sender, address(0), value);
    }
}
