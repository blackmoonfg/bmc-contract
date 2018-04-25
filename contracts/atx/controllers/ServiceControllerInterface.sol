pragma solidity ^0.4.18;


/// @title ServiceController
///
/// Base implementation
/// Serves for managing service instances
contract ServiceControllerInterface {

    /// @notice Check target address is service
    /// @param _address target address
    /// @return `true` when an address is a service, `false` otherwise
    function isService(address _address) public view returns (bool);
}
