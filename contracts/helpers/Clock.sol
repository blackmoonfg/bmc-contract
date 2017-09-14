pragma solidity ^0.4.11;

contract Clock {
    function time() constant returns (uint) {
        return now;
    }
}
