pragma solidity ^0.4.11;

contract Clock {
    function time() public view returns (uint) {
        return now;
    }
}
