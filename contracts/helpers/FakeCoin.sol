pragma solidity ^0.4.11;

// For testing purposes
contract FakeCoin {
    event Transfer(address indexed from, address indexed to, uint256 value);

    mapping(address => uint) public balanceOf;

    function mint(address _to, uint _value) public {
        balanceOf[_to] += _value;
        Transfer(this, _to, _value);
    }

    function totalSupply() public pure returns (uint) {
        return 0;
    }

    function symbol() public pure returns (string) {
        return 'FAKE';
    }

    function decimals() public pure returns (uint) {
        return 4;
    }

    function transfer(address _to, uint _value) public returns (bool) {
        return transferFrom(msg.sender, _to, _value);
    }

    function transferFrom(address _from, address _to, uint _value) public returns (bool) {
        if (balanceOf[_from] < _value) {
            return false;
        }
        balanceOf[_from] -= _value;
        balanceOf[_to] += _value;
        Transfer(_from, _to, _value);
        return true;
    }

    function balanceEth(address _address) public view returns (uint) {
        return _address.balance;
    }

    function() public payable {
        if (msg.value == 0)
            revert();
    }
}
