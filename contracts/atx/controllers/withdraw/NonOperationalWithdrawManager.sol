pragma solidity ^0.4.18;


import "../DataControllerInterface.sol";
import "../../asset/ATxAssetProxyInterface.sol";
import "../../asset/ATxAssetInterface.sol";
import "../MultiSigAdapter.sol";
import "../../../core/common/Owned.sol";
import "./NonOperationalWithdrawManagerEmitter.sol";


contract NonOperationalWithdrawManager is MultiSigAdapter, NonOperationalWithdrawManagerEmitter {

    uint constant NON_OPERATIONAL_WITHDRAW = 65000;
    uint constant WRONG_WITHDRAW_SUM = NON_OPERATIONAL_WITHDRAW + 1;

    address pendingManager;

    function NonOperationalWithdrawManager(address _pendingManager) public {
        require(_pendingManager != 0x0);
        pendingManager = _pendingManager;
    }

    function() payable public {
        revert();
    }

    function setPendingManager(address _pendingManager) public onlyContractOwner returns (uint) {
        pendingManager = _pendingManager;
        return OK;
    }

    function withdraw(uint _value, address _proxyAddress, uint _block) public returns (uint _code) {
        require(_value != 0);
        require(_proxyAddress != 0x0);

        address _account = msg.sender;
        bytes32 _args = keccak256(_value, _proxyAddress);

        ATxAssetProxyInterface _proxy = ATxAssetProxyInterface(_proxyAddress);
        ATxAssetInterface _asset = ATxAssetInterface(_proxy.getLatestVersion());
        DataControllerInterface _dataController = _asset.dataController();

        if (!_isTxExistWithArgs(_args, _block)) {
            _code = _dataController.changeAllowance(_account, _value);
            if (OK != _code) {
                return _code;
            }
        }

        _code = _multisig(_args, _block);
        if (OK != _code) {
            return _code;
        }

        if (!_proxy.transferFrom(_account, Owned(_proxyAddress).contractOwner(), _value)) {
            revert();
        }

        if (OK != _dataController.changeAllowance(_account, 0)) {
            revert();
        }

        TokensWithdraw(_account, _value, now);

        return OK;
    }

    function getPendingManager() public view returns (address) {
        return pendingManager;
    }
}
