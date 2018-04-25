pragma solidity ^0.4.18;


import "../../../core/lib/SafeMath.sol";
import "../../../core/common/Object.sol";
import "./GroupsAccessManagerEmitter.sol";


/// @title Group Access Manager
///
/// Base implementation
/// This contract serves as group manager
contract GroupsAccessManager is Object, GroupsAccessManagerEmitter {

    uint constant USER_MANAGER_SCOPE = 111000;
    uint constant USER_MANAGER_MEMBER_ALREADY_EXIST = USER_MANAGER_SCOPE + 1;
    uint constant USER_MANAGER_GROUP_ALREADY_EXIST = USER_MANAGER_SCOPE + 2;
    uint constant USER_MANAGER_OBJECT_ALREADY_SECURED = USER_MANAGER_SCOPE + 3;
    uint constant USER_MANAGER_CONFIRMATION_HAS_COMPLETED = USER_MANAGER_SCOPE + 4;
    uint constant USER_MANAGER_USER_HAS_CONFIRMED = USER_MANAGER_SCOPE + 5;
    uint constant USER_MANAGER_NOT_ENOUGH_GAS = USER_MANAGER_SCOPE + 6;
    uint constant USER_MANAGER_INVALID_INVOCATION = USER_MANAGER_SCOPE + 7;
    uint constant USER_MANAGER_DONE = USER_MANAGER_SCOPE + 11;
    uint constant USER_MANAGER_CANCELLED = USER_MANAGER_SCOPE + 12;

    using SafeMath for uint;

    struct Member {
        address addr;
        uint groupsCount;
        mapping(bytes32 => uint) groupName2index;
        mapping(uint => uint) index2globalIndex;
    }

    struct Group {
        bytes32 name;
        uint priority;
        uint membersCount;
        mapping(address => uint) memberAddress2index;
        mapping(uint => uint) index2globalIndex;
    }

    uint public membersCount;
    mapping(uint => address) index2memberAddress;
    mapping(address => uint) memberAddress2index;
    mapping(address => Member) address2member;

    uint public groupsCount;
    mapping(uint => bytes32) index2groupName;
    mapping(bytes32 => uint) groupName2index;
    mapping(bytes32 => Group) groupName2group;
    mapping(bytes32 => bool) public groupsBlocked; // if groupName => true, then couldn't be used for confirmation

    function() payable public {
        revert();
    }

    /// @notice Register user
    /// Can be called only by contract owner
    ///
    /// @param _user user address
    ///
    /// @return code
    function registerUser(address _user) external onlyContractOwner returns (uint) {
        require(_user != 0x0);

        if (isRegisteredUser(_user)) {
            return USER_MANAGER_MEMBER_ALREADY_EXIST;
        }

        uint _membersCount = membersCount.add(1);
        membersCount = _membersCount;
        memberAddress2index[_user] = _membersCount;
        index2memberAddress[_membersCount] = _user;
        address2member[_user] = Member(_user, 0);

        UserCreated(_user);
        return OK;
    }

    /// @notice Discard user registration
    /// Can be called only by contract owner
    ///
    /// @param _user user address
    ///
    /// @return code
    function unregisterUser(address _user) external onlyContractOwner returns (uint) {
        require(_user != 0x0);

        uint _memberIndex = memberAddress2index[_user];
        if (_memberIndex == 0 || address2member[_user].groupsCount != 0) {
            return USER_MANAGER_INVALID_INVOCATION;
        }

        uint _membersCount = membersCount;
        delete memberAddress2index[_user];
        if (_memberIndex != _membersCount) {
            address _lastUser = index2memberAddress[_membersCount];
            index2memberAddress[_memberIndex] = _lastUser;
            memberAddress2index[_lastUser] = _memberIndex;
        }
        delete address2member[_user];
        delete index2memberAddress[_membersCount];
        delete memberAddress2index[_user];
        membersCount = _membersCount.sub(1);

        UserDeleted(_user);
        return OK;
    }

    /// @notice Create group
    /// Can be called only by contract owner
    ///
    /// @param _groupName group name
    /// @param _priority group priority
    ///
    /// @return code
    function createGroup(bytes32 _groupName, uint _priority) external onlyContractOwner returns (uint) {
        require(_groupName != bytes32(0));

        if (isGroupExists(_groupName)) {
            return USER_MANAGER_GROUP_ALREADY_EXIST;
        }

        uint _groupsCount = groupsCount.add(1);
        groupName2index[_groupName] = _groupsCount;
        index2groupName[_groupsCount] = _groupName;
        groupName2group[_groupName] = Group(_groupName, _priority, 0);
        groupsCount = _groupsCount;

        GroupCreated(_groupName);
        return OK;
    }

    /// @notice Change group status
    /// Can be called only by contract owner
    ///
    /// @param _groupName group name
    /// @param _blocked block status
    ///
    /// @return code
    function changeGroupActiveStatus(bytes32 _groupName, bool _blocked) external onlyContractOwner returns (uint) {
        require(isGroupExists(_groupName));
        groupsBlocked[_groupName] = _blocked;
        return OK;
    }

    /// @notice Add users in group
    /// Can be called only by contract owner
    ///
    /// @param _groupName group name
    /// @param _users user array
    ///
    /// @return code
    function addUsersToGroup(bytes32 _groupName, address[] _users) external onlyContractOwner returns (uint) {
        require(isGroupExists(_groupName));

        Group storage _group = groupName2group[_groupName];
        uint _groupMembersCount = _group.membersCount;

        for (uint _userIdx = 0; _userIdx < _users.length; ++_userIdx) {
            address _user = _users[_userIdx];
            uint _memberIndex = memberAddress2index[_user];
            require(_memberIndex != 0);

            if (_group.memberAddress2index[_user] != 0) {
                continue;
            }

            _groupMembersCount = _groupMembersCount.add(1);
            _group.memberAddress2index[_user] = _groupMembersCount;
            _group.index2globalIndex[_groupMembersCount] = _memberIndex;

            _addGroupToMember(_user, _groupName);

            UserToGroupAdded(_user, _groupName);
        }
        _group.membersCount = _groupMembersCount;

        return OK;
    }

    /// @notice Remove users in group
    /// Can be called only by contract owner
    ///
    /// @param _groupName group name
    /// @param _users user array
    ///
    /// @return code
    function removeUsersFromGroup(bytes32 _groupName, address[] _users) external onlyContractOwner returns (uint) {
        require(isGroupExists(_groupName));

        Group storage _group = groupName2group[_groupName];
        uint _groupMembersCount = _group.membersCount;

        for (uint _userIdx = 0; _userIdx < _users.length; ++_userIdx) {
            address _user = _users[_userIdx];
            uint _memberIndex = memberAddress2index[_user];
            uint _groupMemberIndex = _group.memberAddress2index[_user];

            if (_memberIndex == 0 || _groupMemberIndex == 0) {
                continue;
            }

            if (_groupMemberIndex != _groupMembersCount) {
                uint _lastUserGlobalIndex = _group.index2globalIndex[_groupMembersCount];
                address _lastUser = index2memberAddress[_lastUserGlobalIndex];
                _group.index2globalIndex[_groupMemberIndex] = _lastUserGlobalIndex;
                _group.memberAddress2index[_lastUser] = _groupMemberIndex;
            }
            delete _group.memberAddress2index[_user];
            delete _group.index2globalIndex[_groupMembersCount];
            _groupMembersCount = _groupMembersCount.sub(1);

            _removeGroupFromMember(_user, _groupName);

            UserFromGroupRemoved(_user, _groupName);
        }
        _group.membersCount = _groupMembersCount;

        return OK;
    }

    /// @notice Check is user registered
    ///
    /// @param _user user address
    ///
    /// @return status
    function isRegisteredUser(address _user) public view returns (bool) {
        return memberAddress2index[_user] != 0;
    }

    /// @notice Check is user in group
    ///
    /// @param _groupName user array
    /// @param _user user array
    ///
    /// @return status
    function isUserInGroup(bytes32 _groupName, address _user) public view returns (bool) {
        return isRegisteredUser(_user) && address2member[_user].groupName2index[_groupName] != 0;
    }

    /// @notice Check is group exist
    ///
    /// @param _groupName group name
    ///
    /// @return status
    function isGroupExists(bytes32 _groupName) public view returns (bool) {
        return groupName2index[_groupName] != 0;
    }

    /// @notice Get current group names
    ///
    /// @return group names
    function getGroups() public view returns (bytes32[] _groups) {
        uint _groupsCount = groupsCount;
        _groups = new bytes32[](_groupsCount);
        for (uint _groupIdx = 0; _groupIdx < _groupsCount; ++_groupIdx) {
            _groups[_groupIdx] = index2groupName[_groupIdx + 1];
        }
    }

    // PRIVATE

    function _removeGroupFromMember(address _user, bytes32 _groupName) private {
        Member storage _member = address2member[_user];
        uint _memberGroupsCount = _member.groupsCount;
        uint _memberGroupIndex = _member.groupName2index[_groupName];
        if (_memberGroupIndex != _memberGroupsCount) {
            uint _lastGroupGlobalIndex = _member.index2globalIndex[_memberGroupsCount];
            bytes32 _lastGroupName = index2groupName[_lastGroupGlobalIndex];
            _member.index2globalIndex[_memberGroupIndex] = _lastGroupGlobalIndex;
            _member.groupName2index[_lastGroupName] = _memberGroupIndex;
        }
        delete _member.groupName2index[_groupName];
        delete _member.index2globalIndex[_memberGroupsCount];
        _member.groupsCount = _memberGroupsCount.sub(1);
    }

    function _addGroupToMember(address _user, bytes32 _groupName) private {
        Member storage _member = address2member[_user];
        uint _memberGroupsCount = _member.groupsCount.add(1);
        _member.groupName2index[_groupName] = _memberGroupsCount;
        _member.index2globalIndex[_memberGroupsCount] = groupName2index[_groupName];
        _member.groupsCount = _memberGroupsCount;
    }
}
