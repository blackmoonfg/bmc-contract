pragma solidity ^0.4.18;


import "../../core/common/Object.sol";


contract OracleAdapter is Object {

    mapping(address => bool) public oracles;

    /// @dev Allow access only for oracle
    modifier onlyOracle {
        if (oracles[msg.sender]) {
            _;
        }
    }

    /// @notice Add oracles to whitelist.
    ///
    /// @param _whitelist user list.
    function addOracles(address[] _whitelist) external onlyContractOwner returns (uint)    {
        for (uint _idx = 0; _idx < _whitelist.length; ++_idx) {
            oracles[_whitelist[_idx]] = true;
        }
        return OK;
    }

    /// @notice Removes oracles from whitelist.
    ///
    /// @param _blacklist user in whitelist.
    function removeOracles(address[] _blacklist) external onlyContractOwner returns (uint)    {
        for (uint _idx = 0; _idx < _blacklist.length; ++_idx) {
            delete oracles[_blacklist[_idx]];
        }
        return OK;
    }
}
