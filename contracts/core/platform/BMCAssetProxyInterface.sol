pragma solidity ^0.4.11;

contract BMCAssetProxyInterface {
    address public bmcPlatform;
    function __transferWithReference(address _to, uint _value, string _reference, address _sender) returns(bool);
    function __transferFromWithReference(address _from, address _to, uint _value, string _reference, address _sender) returns(bool);
    function __approve(address _spender, uint _value, address _sender) returns(bool);    
    function getLatestVersion() returns(address);
    function init(address _bmcPlatform, string _symbol, string _name);
    function proposeUpgrade(address _newVersion);
}
