pragma solidity ^0.4.11;

contract ExchangeInterface {
    function setPrices(uint _buyPrice, uint _sellPrice) returns (uint errorCode);
}
