pragma solidity ^0.4.18;

import {ERC20Interface as Token} from "../../core/erc20/ERC20Interface.sol";

/// @title TokenSender implementation contract.
///
/// This contract allows to transfer ERC20 tokens from one account to another.
/// It needs additional setups for allowance or using MOCK-platform in pair
///
/// Note: USE ONLY FOR TEST PURPOSE.
contract TokenSender {

    /// @notice trasfer ERC20 tokens.
    /// NOTE: DOESN'T WORK WITHOUT ALLOWANCE
    function transfer(address _token, address _from, address _to, uint _amount) public returns (bool) {
        require(_token != 0x0 && _from != 0x0 && _to != 0x0 && _amount != 0);

        Token token = Token(_token);
        return token.transferFrom(_from, _to, _amount);
    }
}
