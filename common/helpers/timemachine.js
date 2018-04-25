function TimeMachine(web3) {

	const self = this

	const minute = 60
	const hour = 60 * minute
	const day = 24 * hour
	const year = day * 365

	this.jump = seconds => new Promise((resolve, reject) => {
		send("evm_increaseTime", [seconds,], e => {
			if (e) {
				reject(e)
			}
			getBlock(resolve, reject)
		})
	})
	this.jumpHourForward = hours => self.jump(parseInt(hours) * hour)
	this.jumpDaysForward = days => self.jump(parseInt(days) * day)
	this.jumpMinuteForward = minutes => self.jump(parseInt(minutes) * minute)
	this.jumpYearForward = years => self.jump(parseInt(years) * year)
	this.getCurrentTime = async() => {
		const block = await new Promise((resolve, reject) => getBlock(resolve, reject))
		return block.timestamp
	}
	this.getFutureTime = async plus => {
		const currentTime = await self.getCurrentTime()
		return parseInt(currentTime) + parseInt(plus)
	}
	this.secondsToDate = seconds => {
		const date = new Date(1970, 0, 1)
		date.setSeconds(seconds)
		return date
	}

	this.addDays = (date, days) => {
		const result = new Date(date)
		result.setDate(result.getDate() + days)
		return result
	}

	function send(method, params, callback) {
		if (typeof params === "function") {
			callback = params
			params = []
		}

		web3.currentProvider.sendAsync({
			jsonrpc: "2.0",
			method: method,
			params: params || [],
			id: new Date().getTime(),
		}, callback)
	}

	function getBlock(resolve, reject) {
		send("evm_mine", e => {
			if (e) {
				reject(e)
			}
			web3.eth.getBlock('latest', function (e, block) {
				if (e) {
					reject(e)
				}
				resolve(block)
			})
		})
	}
}

module.exports = TimeMachine
