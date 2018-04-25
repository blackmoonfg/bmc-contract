pragma solidity ^0.4.18;


contract PendingManagerInterface {

    function signIn(address _contract) external returns (uint);
    function signOut(address _contract) external returns (uint);

    function addPolicyRule(
        bytes4 _sig, 
        address _contract, 
        bytes32 _groupName, 
        uint _acceptLimit, 
        uint _declineLimit 
        ) 
        external returns (uint);
        
    function removePolicyRule(
        bytes4 _sig, 
        address _contract, 
        bytes32 _groupName
        ) 
        external returns (uint);

    function addTx(bytes32 _key, bytes4 _sig, address _contract) external returns (uint);
    function deleteTx(bytes32 _key) external returns (uint);

    function accept(bytes32 _key, bytes32 _votingGroupName) external returns (uint);
    function decline(bytes32 _key, bytes32 _votingGroupName) external returns (uint);
    function revoke(bytes32 _key) external returns (uint);

    function hasConfirmedRecord(bytes32 _key) public view returns (uint);
    function getPolicyDetails(bytes4 _sig, address _contract) public view returns (
        bytes32[] _groupNames,
        uint[] _acceptLimits,
        uint[] _declineLimits,
        uint _totalAcceptedLimit,
        uint _totalDeclinedLimit
        );
}
