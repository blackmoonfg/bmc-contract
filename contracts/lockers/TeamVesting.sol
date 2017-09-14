pragma solidity ^0.4.11;
import "../core/common/Object.sol";
import '../core/event/MultiEventsHistoryAdapter.sol';

contract DelayedPaymentsEmitter is MultiEventsHistoryAdapter {
        event Error(bytes32 message);

        function emitError(bytes32 _message) {
           Error(_message);
        }
}

contract TeamVesting is Object {

    uint constant TIME_LOCK_SCOPE = 51000;
    uint constant TIME_LOCK_TRANSFER_ERROR = TIME_LOCK_SCOPE + 10;
    uint constant TIME_LOCK_TRANSFERFROM_ERROR = TIME_LOCK_SCOPE + 11;
    uint constant TIME_LOCK_BALANCE_ERROR = TIME_LOCK_SCOPE + 12;
    uint constant TIME_LOCK_TIMESTAMP_ERROR = TIME_LOCK_SCOPE + 13;
    uint constant TIME_LOCK_INVALID_INVOCATION = TIME_LOCK_SCOPE + 17;

    // custom data structure to hold locked funds and time
    struct accountData {
        uint balance;
        uint initDate;
        uint lastSpending;
    }

    // Should use interface of the emitter, but address of events history.
    address public eventsHistory;

    address asset;

    accountData lock;

    function TeamVesting(address _asset) {
        asset = _asset;
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
            return TIME_LOCK_INVALID_INVOCATION;
        }
        eventsHistory = _eventsHistory;
        return OK;
    }

    function payIn() onlyContractOwner returns (uint errorCode) {
        // send some amount (in Wei) when calling this function.
        // the amount will then be placed in a locked account
        // the funds will be released once the indicated lock time in seconds
        // passed and can only be retrieved by the same account which was
        // depositing them - highlighting the intrinsic security model
        // offered by a blockchain system like Ethereum
        uint amount = ERC20Interface(asset).balanceOf(this); 
        if(lock.balance != 0) {
            if(lock.balance != amount) {
				lock.balance == amount;
				return OK;
            }
            return TIME_LOCK_INVALID_INVOCATION;
        }
        if (amount == 0) {
            return TIME_LOCK_BALANCE_ERROR;
        }
        lock = accountData(amount,now,0);
        return OK;
    }
    
    function payOut(address reciever) onlyContractOwner returns (uint errorCode) {
        // check if user has funds due for pay out because lock time is over
        uint amount = getVesting();
        if(amount == 0) {
            return TIME_LOCK_INVALID_INVOCATION;
        }
        if(!ERC20Interface(asset).transfer(reciever,amount)) {
            return TIME_LOCK_TRANSFER_ERROR;
        }
        return OK;
    }

    // used to calculate amount we are able to spend according to current timestamp 
    function getVesting() returns (uint) {
        uint amount;
        for(uint i = 24; i >= 6;) {
           uint date = 30 days * i;
           if(now > (lock.initDate + date)) {
              if(lock.lastSpending == i) {
                 break;
              }
		      if(lock.lastSpending == 0)
              {
                 amount = (lock.balance * 125 * (i/3)) / 1000;
                 lock.lastSpending = i;
                 break;
              }
              else {
                 amount = ((lock.balance * 125 * (i/3)) / 1000) - ((lock.balance * 125 * (lock.lastSpending/3)) / 1000);
                 lock.lastSpending = i;
                 break;
              }
          }
            i-=3;
        }
        return amount;   
    }

    function getLockedFunds() constant returns (uint) {
        return ERC20Interface(asset).balanceOf(this);
    }
    
    function getLockedFundsLastSpending() constant returns (uint) {
	    return lock.lastSpending;
    }

}
