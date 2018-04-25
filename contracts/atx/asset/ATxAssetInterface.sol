pragma solidity ^0.4.18;

import "../controllers/DataControllerInterface.sol";
import "../controllers/ServiceControllerInterface.sol";


contract ATxAssetInterface {

    DataControllerInterface public dataController;
    ServiceControllerInterface public serviceController;

    function __transferWithReference(address _to, uint _value, string _reference, address _sender) public returns (bool);
    function __transferFromWithReference(address _from, address _to, uint _value, string _reference, address _sender) public returns (bool);
    function __approve(address _spender, uint _value, address _sender) public returns (bool);
    function __process(bytes /*_data*/, address /*_sender*/) payable public {
        revert();
    }
}