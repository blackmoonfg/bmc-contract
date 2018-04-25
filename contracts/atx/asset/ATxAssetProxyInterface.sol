pragma solidity ^0.4.18;


import {ERC20Interface as ERC20} from "../../core/erc20/ERC20Interface.sol";


contract ATxAssetProxyInterface is ERC20 {
    
    bytes32 public smbl;
    address public platform;

    function __transferWithReference(address _to, uint _value, string _reference, address _sender) public returns (bool);
    function __transferFromWithReference(address _from, address _to, uint _value, string _reference, address _sender) public returns (bool);
    function __approve(address _spender, uint _value, address _sender) public returns (bool);
    function getLatestVersion() public returns (address);
    function init(address _bmcPlatform, string _symbol, string _name) public;
    function proposeUpgrade(address _newVersion) public;
}
