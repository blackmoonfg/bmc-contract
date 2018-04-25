pragma solidity ^0.4.0;

import {ATxPlatform as Platform} from "../../../contracts/atx/asset/ATxPlatform.sol";
import {ATxPlatformEmitter as Emitter} from "../../../contracts/atx/asset/ATxPlatformEmitter.sol";

/// @title ATxPlatformServiseAllowanceTestable implementation contract.
///
/// This is a platform's version with override logic for allowance. This contract doesn't check and update allowance fields.
/// It can be used as MOCK platform for test purpose
///
/// Note: USE ONLY FOR TEST PURPOSE.
contract ATxPlatformServiceAllowanceTestable is Platform {

    /// @notice This is override transfer method. It doesn't check and update allowance
    /// @notice NOTE: USE ONLY FOR TEST PURPOSE
    function _transfer(uint _fromId, uint _toId, uint _value, bytes32 _symbol, string _reference, uint) internal returns (uint) {
        // Should not allow to send to oneself.
        if (_fromId == _toId) {
            return _error(ATX_PLATFORM_CANNOT_APPLY_TO_ONESELF);
        }
        // Should have positive value.
        if (_value == 0) {
            return _error(ATX_PLATFORM_INVALID_VALUE);
        }
        // Should have enough balance.
        if (_balanceOf(_fromId, _symbol) < _value) {
            return _error(ATX_PLATFORM_INSUFFICIENT_BALANCE);
        }

        _transferDirect(_fromId, _toId, _value, _symbol);
        // Internal Out Of Gas/Throw: revert this transaction too;
        // Call Stack Depth Limit reached: n/a after HF 4;
        // Recursive Call: safe, all changes already made.
        Emitter(eventsHistory).emitTransfer(_address(_fromId), _address(_toId), _symbol, _value, _reference);
        _proxyTransferEvent(_fromId, _toId, _value, _symbol);
        return OK;
    }
}
