pragma solidity ^0.4.11;
import "../core/common/Object.sol";
import '../core/event/MultiEventsHistoryAdapter.sol';

contract DelayedPaymentsEmitter is MultiEventsHistoryAdapter {
    event Error(bytes32 message);

    function emitError(bytes32 _message) {
        Error(_message);
    }
}

contract DelayedPayments is Object {
   
    uint constant DELAYED_PAYMENTS_SCOPE = 52000;
    uint constant DELAYED_PAYMENTS_INVALID_INVOCATION = DELAYED_PAYMENTS_SCOPE + 17;

    /// @dev `Payment` is a public structure that describes the details of
    ///  each payment making it easy to track the movement of funds
    ///  transparently
    struct Payment {
        address spender;        // Who is sending the funds
        uint earliestPayTime;   // The earliest a payment can be made (Unix Time)
        bool canceled;         // If True then the payment has been canceled
        bool paid;              // If True then the payment has been paid
        address recipient;      // Who is receiving the funds
        uint amount;            // The amount of wei sent in the payment
        uint securityGuardDelay;// The seconds `securityGuard` can delay payment
    }

    Payment[] public authorizedPayments;

    address public securityGuard;
    uint public absoluteMinTimeLock;
    uint public timeLock;
    uint public maxSecurityGuardDelay;

    // Should use interface of the emitter, but address of events history.
    address public eventsHistory;

    /// @dev The white list of approved addresses allowed to set up && receive
    ///  payments from this vault
    mapping (address => bool) public allowedSpenders;

    /// @dev The address assigned the role of `securityGuard` is the only
    ///  addresses that can call a function with this modifier
    modifier onlySecurityGuard { if (msg.sender != securityGuard) throw; _; }

    // @dev Events to make the payment movements easy to find on the blockchain
    event PaymentAuthorized(uint indexed idPayment, address indexed recipient, uint amount);
    event PaymentExecuted(uint indexed idPayment, address indexed recipient, uint amount);
    event PaymentCanceled(uint indexed idPayment);
    event EtherReceived(address indexed from, uint amount);
    event SpenderAuthorization(address indexed spender, bool authorized);

/////////
// Constructor
/////////

    /// @notice The Constructor creates the Vault on the blockchain
    /// @param _absoluteMinTimeLock The minimum number of seconds `timelock` can
    ///  be set to, if set to 0 the `owner` can remove the `timeLock` completely
    /// @param _timeLock Initial number of seconds that payments are delayed
    ///  after they are authorized (a security precaution)
    /// @param _maxSecurityGuardDelay The maximum number of seconds in total
    ///   that `securityGuard` can delay a payment so that the owner can cancel
    ///   the payment if needed
    function DelayedPayments(
        uint _absoluteMinTimeLock,
        uint _timeLock,
        uint _maxSecurityGuardDelay) 
    {
        absoluteMinTimeLock = _absoluteMinTimeLock;
        timeLock = _timeLock;
        securityGuard = msg.sender;
        maxSecurityGuardDelay = _maxSecurityGuardDelay;
    }

    /**
     * Emits Error event with specified error message.
     *
     * Should only be used if no state changes happened.
     *
     * @param _errorCode code of an error
     * @param _message error message.
     */
    function _error(uint _errorCode, bytes32 _message) internal returns(uint) {
        DelayedPaymentsEmitter(eventsHistory).emitError(_message);
        return _errorCode;
    }

    /**
     * Sets EventsHstory contract address.
     *
     * Can be set only once, and only by contract owner.
     *
     * @param _eventsHistory MultiEventsHistory contract address.
     *
     * @return success.
     */
    function setupEventsHistory(address _eventsHistory) returns(uint errorCode) {
        errorCode = checkOnlyContractOwner();
        if (errorCode != OK) {
            return errorCode;
        }
        if (eventsHistory != 0x0 && eventsHistory != _eventsHistory) {
            return DELAYED_PAYMENTS_INVALID_INVOCATION;
        }
        eventsHistory = _eventsHistory;
        return OK;
    }

/////////
// Helper functions
/////////

    /// @notice States the total number of authorized payments in this contract
    /// @return The number of payments ever authorized even if they were canceled
    function numberOfAuthorizedPayments() constant returns (uint) {
        return authorizedPayments.length;
    }

//////
// Receive Ether
//////

    /// @notice Called anytime ether is sent to the contract && creates an event
    /// to more easily track the incoming transactions
    function receiveEther() payable {
        EtherReceived(msg.sender, msg.value);
    }

    /// @notice The fall back function is called whenever ether is sent to this
    ///  contract
    function () payable {
        receiveEther();
    }

////////
// Spender Interface
////////

    /// @notice only `allowedSpenders[]` Creates a new `Payment`
    /// @param _recipient Destination of the payment
    /// @param _amount Amount to be paid in wei
    /// @param _paymentDelay Number of seconds the payment is to be delayed, if
    ///  this value is below `timeLock` then the `timeLock` determines the delay
    /// @return The Payment ID number for the new authorized payment
    function authorizePayment(
        address _recipient,
        uint _amount,
        uint _paymentDelay
    ) returns(uint) {

        // Fail if you arent on the `allowedSpenders` white list
        if (!allowedSpenders[msg.sender]) throw;
        uint idPayment = authorizedPayments.length;       // Unique Payment ID
        authorizedPayments.length++;

        // The following lines fill out the payment struct
        Payment p = authorizedPayments[idPayment];
        p.spender = msg.sender;

        // Overflow protection
        if (_paymentDelay > 10**18) throw;

        // Determines the earliest the recipient can receive payment (Unix time)
        p.earliestPayTime = _paymentDelay >= timeLock ?
                                now + _paymentDelay :
                                now + timeLock;
        p.recipient = _recipient;
        p.amount = _amount;
        PaymentAuthorized(idPayment, p.recipient, p.amount);
        return idPayment;
    }

    /// @notice only `allowedSpenders[]` The recipient of a payment calls this
    ///  function to send themselves the ether after the `earliestPayTime` has
    ///  expired
    /// @param _idPayment The payment ID to be executed
    function collectAuthorizedPayment(uint _idPayment) {

        // Check that the `_idPayment` has been added to the payments struct
        if (_idPayment >= authorizedPayments.length) return;

        Payment p = authorizedPayments[_idPayment];

        // Checking for reasons not to execute the payment
        if (msg.sender != p.recipient) return;
        if (now < p.earliestPayTime) return;
        if (p.canceled) return;
        if (p.paid) return;
        if (this.balance < p.amount) return;

        p.paid = true; // Set the payment to being paid
        if (!p.recipient.send(p.amount)) {  // Make the payment
            return;
        }
        PaymentExecuted(_idPayment, p.recipient, p.amount);
     }

/////////
// SecurityGuard Interface
/////////

    /// @notice `onlySecurityGuard` Delays a payment for a set number of seconds
    /// @param _idPayment ID of the payment to be delayed
    /// @param _delay The number of seconds to delay the payment
    function delayPayment(uint _idPayment, uint _delay) onlySecurityGuard {
        if (_idPayment >= authorizedPayments.length) throw;

        // Overflow test
        if (_delay > 10**18) throw;

        Payment p = authorizedPayments[_idPayment];

        if ((p.securityGuardDelay + _delay > maxSecurityGuardDelay) ||
            (p.paid) ||
            (p.canceled))
            throw;

        p.securityGuardDelay += _delay;
        p.earliestPayTime += _delay;
    }

////////
// Owner Interface
///////

    /// @notice `onlyOwner` Cancel a payment all together
    /// @param _idPayment ID of the payment to be canceled.
    function cancelPayment(uint _idPayment) onlyContractOwner {
        if (_idPayment >= authorizedPayments.length) throw;

        Payment p = authorizedPayments[_idPayment];


        if (p.canceled) throw;
        if (p.paid) throw;

        p.canceled = true;
        PaymentCanceled(_idPayment);
    }

    /// @notice `onlyOwner` Adds a spender to the `allowedSpenders[]` white list
    /// @param _spender The address of the contract being authorized/unauthorized
    /// @param _authorize `true` if authorizing and `false` if unauthorizing
    function authorizeSpender(address _spender, bool _authorize) onlyContractOwner {
        allowedSpenders[_spender] = _authorize;
        SpenderAuthorization(_spender, _authorize);
    }

    /// @notice `onlyOwner` Sets the address of `securityGuard`
    /// @param _newSecurityGuard Address of the new security guard
    function setSecurityGuard(address _newSecurityGuard) onlyContractOwner {
        securityGuard = _newSecurityGuard;
    }

    /// @notice `onlyOwner` Changes `timeLock`; the new `timeLock` cannot be
    ///  lower than `absoluteMinTimeLock`
    /// @param _newTimeLock Sets the new minimum default `timeLock` in seconds;
    ///  pending payments maintain their `earliestPayTime`
    function setTimelock(uint _newTimeLock) onlyContractOwner {
        if (_newTimeLock < absoluteMinTimeLock) throw;
        timeLock = _newTimeLock;
    }

    /// @notice `onlyOwner` Changes the maximum number of seconds
    /// `securityGuard` can delay a payment
    /// @param _maxSecurityGuardDelay The new maximum delay in seconds that
    ///  `securityGuard` can delay the payment's execution in total
    function setMaxSecurityGuardDelay(uint _maxSecurityGuardDelay) onlyContractOwner {
        maxSecurityGuardDelay = _maxSecurityGuardDelay;
    }
}
