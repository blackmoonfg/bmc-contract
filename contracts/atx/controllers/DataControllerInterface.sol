pragma solidity ^0.4.18;


/// @title Provides possibility manage holders? country limits and limits for holders.
contract DataControllerInterface {

    /// @notice Checks user is holder.
    /// @param _address - checking address.
    /// @return `true` if _address is registered holder, `false` otherwise.
    function isHolderAddress(address _address) public view returns (bool);

    function allowance(address _user) public view returns (uint);

    function changeAllowance(address _holder, uint _value) public returns (uint);
}
