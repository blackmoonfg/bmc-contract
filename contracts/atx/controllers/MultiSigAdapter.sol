pragma solidity ^0.4.18;


import "./pending/PendingManager.sol";
import "../../core/common/Object.sol";


/// @title MultiSigAdapter
///
/// Abstract implementation
/// This contract serves as transaction signer
contract MultiSigAdapter is Object {

    uint constant MULTISIG_ADDED = 3;
    uint constant NO_RECORDS_WERE_FOUND = 4;

    modifier isAuthorized {
        if (msg.sender == contractOwner || msg.sender == getPendingManager()) {
            _;
        }
    }

    /// @notice Get pending address
    /// @dev abstract. Needs child implementation
    ///
    /// @return pending address
    function getPendingManager() public view returns (address);

    /// @notice Sign current transaction and add it to transaction pending queue
    ///
    /// @return code
    function _multisig(bytes32 _args, uint _block) internal returns (uint _code) {
        bytes32 _txHash = _getKey(_args, _block);
        address _manager = getPendingManager();

        _code = PendingManager(_manager).hasConfirmedRecord(_txHash);
        if (_code != NO_RECORDS_WERE_FOUND) {
            return _code;
        }

        if (OK != PendingManager(_manager).addTx(_txHash, msg.sig, address(this))) {
            revert();
        }

        return MULTISIG_ADDED;
    }

    function _isTxExistWithArgs(bytes32 _args, uint _block) internal view returns (bool) {
        bytes32 _txHash = _getKey(_args, _block);
        address _manager = getPendingManager();
        return PendingManager(_manager).isTxExist(_txHash);
    }

    function _getKey(bytes32 _args, uint _block) private view returns (bytes32 _txHash) {
        _block = _block != 0 ? _block : block.number;
        _txHash = keccak256(msg.sig, _args, _block);
    }
}
