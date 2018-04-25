pragma solidity ^0.4.18;


import "../../core/event/MultiEventsHistoryAdapter.sol";


/// @title Fund Tokens Platform Emitter.
///
/// Contains all the original event emitting function definitions and events.
/// In case of new events needed later, additional emitters can be developed.
/// All the functions is meant to be called using delegatecall.
contract ATxPlatformEmitter is MultiEventsHistoryAdapter {

    event Transfer(address indexed from, address indexed to, bytes32 indexed symbol, uint value, string reference);
    event Issue(bytes32 indexed symbol, uint value, address indexed by);
    event Revoke(bytes32 indexed symbol, uint value, address indexed by);
    event OwnershipChange(address indexed from, address indexed to, bytes32 indexed symbol);
    event Approve(address indexed from, address indexed spender, bytes32 indexed symbol, uint value);
    event Recovery(address indexed from, address indexed to, address by);
    event Error(uint errorCode);

    function emitTransfer(address _from, address _to, bytes32 _symbol, uint _value, string _reference) public {
        Transfer(_from, _to, _symbol, _value, _reference);
    }

    function emitIssue(bytes32 _symbol, uint _value, address _by) public {
        Issue(_symbol, _value, _by);
    }

    function emitRevoke(bytes32 _symbol, uint _value, address _by) public {
        Revoke(_symbol, _value, _by);
    }

    function emitOwnershipChange(address _from, address _to, bytes32 _symbol) public {
        OwnershipChange(_from, _to, _symbol);
    }

    function emitApprove(address _from, address _spender, bytes32 _symbol, uint _value) public {
        Approve(_from, _spender, _symbol, _value);
    }

    function emitRecovery(address _from, address _to, address _by) public {
        Recovery(_from, _to, _by);
    }

    function emitError(uint _errorCode) public {
        Error(_errorCode);
    }
}
