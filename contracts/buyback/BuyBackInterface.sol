pragma solidity ^0.4.11;

contract BuyBackInterface {
    function setPrices(uint _buyPrice, uint _sellPrice) returns (uint errorCode);
}
