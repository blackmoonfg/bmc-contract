function TimeMachine(web3) {
    var dTime = 0;

    function send(method, params, callback) {
        if (typeof params == "function") {
            callback = params;
            params = [];
        }

        web3.currentProvider.sendAsync({
            jsonrpc: "2.0",
            method: method,
            params: params || [],
            id: new Date().getTime()
        }, callback);
    };

    this.jump = (seconds) => {
        return new Promise(function (resolve, reject) {
            send("evm_increaseTime", [seconds], function(e, result) {
                if (e) reject(e);
                dTime += seconds;

                // Mine a block so new time is recorded.
                send("evm_mine", function(err, result) {
                    if (e) reject(e);

                    web3.eth.getBlock('latest', function(e, block) {
                        if(e) reject(e);
                        resolve();
                    })
                })
            })
        });
    }

    // this.reset = (seconds) => {
    //     TODO: negative values are not suported yet
    //     return this.jump(-dTime).then(() => dTime = 0);
    // }
}

module.exports = TimeMachine;
