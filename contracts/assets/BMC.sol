pragma solidity ^0.4.11;

import "../core/platform/BMCAsset.sol";

/**
 * @title Blackmooncrypto.com BMC tokens contract.
 *
 * The official Blackmooncrypto.com token implementation.
 */
contract BMC is BMCAsset {

    uint public icoUsd;
    uint public icoEth;
    uint public icoBtc;
    uint public icoLtc;

    function initBMC(BMCAssetProxy _proxy, uint _icoUsd, uint _icoEth, uint _icoBtc, uint _icoLtc) returns(bool) {
        if(icoUsd != 0 || icoEth != 0 || icoBtc != 0 || icoLtc != 0) {
            return false;
        }
        icoUsd = _icoUsd;
        icoEth = _icoEth;
        icoBtc = _icoBtc;
        icoLtc = _icoLtc;
        super.init(_proxy);
        return true;
    }

}
