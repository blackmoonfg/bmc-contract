const Setup = require('../setup/setup')
const error = require('../../common/errors')
const utils = require('../../common//helpers/utils')
const eventsHelper = require('../../common//helpers/eventsHelper')

contract("Pending Manager", accounts => {
	const INT_BIG_NUMBER = 2**32

	const setup = new Setup(false)

	const systemOwner = accounts[0]
	const nonOwner = accounts[9]

	const defKey = "0x11223344"
	var sig

	const moderatorsGroupName = "Moderators EU zone"
	const tokenOwnerGroupName = "Satoshi Token owners"
	const _signature = "0xeeeeee"
	const _address = "0xadee"
	const groupPriority = 2

	const policyRequirements = {
		[moderatorsGroupName]: 1,
		[tokenOwnerGroupName]: 1,
		[_signature]: "0xeeeeee",
		[_address]: "0xadee",
	}

	const user1 = accounts[5]
	const user2 = accounts[6]
	const user3 = accounts[7]

	const satoshiTokenPolicyName = "Satoshi Policy"

	before("setup", async() => {
		await setup.snapshot()
		await setup.beforeAll()
		await setup.snapshot()
	})

	after("cleanup", async () => {
		await setup.revert(INT_BIG_NUMBER)
	})

	context("integration", () => {

		it("presents in tests", () => {
			assert.isDefined(setup.PendingManager)
		})

		it("has an address", () => {
			assert.notEqual(setup.PendingManager.address, utils.zeroAddress)
		})

		it("has correct contract owner", async() => {
			assert.equal(await setup.PendingManager.contractOwner.call(), systemOwner)
		})
	})

	context("authorize", () => {
		const authorizedAddress = accounts[2]
		const nonAuthorizedAddress = accounts[4]

		before("init", async() => {
			await setup.revert()
		})

		it("shouldn't be able to add autorized address by non-owner with UNAUTHORIZED code", async() => {
			assert.equal((await setup.TestPendingManager.signIn.call(nonAuthorizedAddress, { from: nonOwner, })).toNumber(), error.UNAUTHORIZED)
		})

		it("shouldn't be able to add autorized address by non-owner", async() => {
			await setup.TestPendingManager.signIn(nonAuthorizedAddress, { from: nonOwner, })
			assert.isFalse(await setup.TestPendingManager.authorized.call(nonAuthorizedAddress))
		})

		it("should be able to add authorized address by contract owner with OK code", async() => {
			assert.equal((await setup.TestPendingManager.signIn.call(nonAuthorizedAddress, { from: systemOwner, })).toNumber(), error.OK)
		})

		it("should be able to add authorized address by contract owner", async() => {
			await setup.TestPendingManager.signIn(nonAuthorizedAddress, { from: systemOwner, })
			assert.isTrue(await setup.TestPendingManager.authorized.call(nonAuthorizedAddress))
		})

		it("shouldn't be able to remove authorized address by non-owner with UNAUTHORIZED code", async() => {
			assert.equal((await setup.TestPendingManager.signOut.call(authorizedAddress, { from: nonOwner, })).toNumber(), error.UNAUTHORIZED)
		})

		it("shouldn't be able to remove authorized address by non-owner", async() => {
			await setup.TestPendingManager.signOut(nonAuthorizedAddress, { from: nonOwner, })
			assert.isTrue(await setup.TestPendingManager.authorized.call(nonAuthorizedAddress))
		})

		it("should be able to remove authorized address by contract owner with OK code", async() => {
			assert.equal((await setup.TestPendingManager.signOut.call(nonAuthorizedAddress, { from: systemOwner, })).toNumber(), error.OK)
		})

		it("should be able to remove authorized address by contract owner", async() => {
			await setup.TestPendingManager.signOut(nonAuthorizedAddress, { from: systemOwner, })
			assert.isFalse(await setup.TestPendingManager.authorized.call(nonAuthorizedAddress))
		})
	})


	context("policies", () => {
		before(async() => {
			await setup.revert()
		})

		describe("pre-setup", () => {

			it("should have registered users", async() => {
				await setup.GroupsAccessManager.registerUser(user1, { from: systemOwner, })
				await setup.GroupsAccessManager.registerUser(user2, { from: systemOwner, })
				await setup.GroupsAccessManager.registerUser(user3, { from: systemOwner, })
				assert.isTrue(await setup.GroupsAccessManager.isRegisteredUser.call(user1))
				assert.isTrue(await setup.GroupsAccessManager.isRegisteredUser.call(user2))
				assert.isTrue(await setup.GroupsAccessManager.isRegisteredUser.call(user3))
			})

			it("should have prepared groups", async() => {
				assert.equal((await setup.GroupsAccessManager.groupsCount.call()).toNumber(), 1)
				await setup.GroupsAccessManager.createGroup(moderatorsGroupName, groupPriority, { from: systemOwner, })
				await setup.GroupsAccessManager.createGroup(tokenOwnerGroupName, groupPriority, { from: systemOwner, })
				assert.equal((await setup.GroupsAccessManager.groupsCount.call()).toNumber(), 3)
			})

			it("should add users to groups", async() => {
				await setup.GroupsAccessManager.addUsersToGroup(moderatorsGroupName, [ user1, user2, ], { from: systemOwner, })
				await setup.GroupsAccessManager.addUsersToGroup(tokenOwnerGroupName, [user3,], { from: systemOwner, })

				assert.isTrue(await setup.GroupsAccessManager.isUserInGroup.call(moderatorsGroupName, user1))
				assert.isTrue(await setup.GroupsAccessManager.isUserInGroup.call(moderatorsGroupName, user2))
				assert.isTrue(await setup.GroupsAccessManager.isUserInGroup.call(tokenOwnerGroupName, user3))
			})
		})


		describe("removing rules for groups", () => {

			it("should have no policy", async() => {
				const [policyGroupNames,] = await setup.TestPendingManager.getPolicyDetails.call(policyRequirements[_signature], policyRequirements[_address])
				assert.lengthOf(policyGroupNames, 0)
			})

			it("should be able to add rule to the policy with OK code", async() => {
				assert.equal((await setup.TestPendingManager.addPolicyRule.call(
					policyRequirements[_signature],
					policyRequirements[_address],
					tokenOwnerGroupName,
					policyRequirements[moderatorsGroupName],
					policyRequirements[moderatorsGroupName],
					{ from: systemOwner, }
				)).toNumber(), error.OK)
			})

			it("should be able to add rule to the policy", async() => {
				const tx = await setup.TestPendingManager.addPolicyRule(
					policyRequirements[_signature],
					policyRequirements[_address],
					tokenOwnerGroupName,
					policyRequirements[moderatorsGroupName],
					policyRequirements[moderatorsGroupName],
					{ from: systemOwner, }
				)
				console.log(`${tx.receipt.gasUsed}`)
				assert.equal((await setup.TestPendingManager.policiesCount.call()).toNumber(), 1)
			})


			it("should be able to see added group in the policy details", async() => {
				const [policyGroupNames,] = await setup.TestPendingManager.getPolicyDetails.call(policyRequirements[_signature], policyRequirements[_address])
				assert.lengthOf(policyGroupNames, 1)
				assert.include(policyGroupNames.map(e => utils.toUtf8String(e)), tokenOwnerGroupName)
			})

			it("shouldn't be able to remove rule from the policy by non-owner with UNAUTHORIZED code", async() => {
				assert.equal((await setup.TestPendingManager.removePolicyRule.call(
					policyRequirements[_signature],
					policyRequirements[_address],
					tokenOwnerGroupName,
					{ from: nonOwner, }
				)).toNumber(), error.UNAUTHORIZED)
			})

			it("shouldn't be able to remove rule from the policy by non-owner", async() => {
				await setup.TestPendingManager.removePolicyRule(
					policyRequirements[_signature],
					policyRequirements[_address],
					tokenOwnerGroupName,
					{ from: nonOwner, }
				)

				const [policyGroupNames,] = await setup.TestPendingManager.getPolicyDetails.call(policyRequirements[_signature], policyRequirements[_address])
				assert.lengthOf(policyGroupNames, 1)
				assert.include(policyGroupNames.map(e => utils.toUtf8String(e)), tokenOwnerGroupName)
			})

			it("should be able to remove rule from the policy by contract owner with OK code", async() => {
				assert.equal((await setup.TestPendingManager.removePolicyRule.call(
					policyRequirements[_signature],
					policyRequirements[_address],
					tokenOwnerGroupName,
					{ from: systemOwner, })
				).toNumber(), error.OK)
			})

			it("should be able to remove rule from the policy by contract owner", async() => {
				const tx = await setup.TestPendingManager.removePolicyRule(
					policyRequirements[_signature],
					policyRequirements[_address],
					tokenOwnerGroupName,
					{ from: systemOwner, }
				)
				console.log(`${tx.receipt.gasUsed}`)

				const [policyGroupNames,] = await setup.TestPendingManager.getPolicyDetails.call(policyRequirements[_signature], policyRequirements[_address])
				assert.lengthOf(policyGroupNames, 0)
			})
		})

		describe("adding rules for groups", () => {
			it("should have single policy without attached groups", async() => {
				assert.equal((await setup.TestPendingManager.policiesCount.call()).toNumber(), 1)

				const [policyGroupNames,] = await setup.TestPendingManager.getPolicyDetails.call(policyRequirements[_signature], policyRequirements[_address])
				assert.lengthOf(policyGroupNames, 0)
			})

			it("shouldn't be able to add rule by non-owner with UNAUTHORIZED code", async() => {
				assert.equal((await setup.TestPendingManager.addPolicyRule.call(
					policyRequirements[_signature],
					policyRequirements[_address],
					tokenOwnerGroupName,
					policyRequirements[moderatorsGroupName],
					policyRequirements[moderatorsGroupName],
					{ from: nonOwner, }
				)).toNumber(), error.UNAUTHORIZED)
			})

			it("shouldn't be able to add rule by non-owner", async() => {
				await setup.TestPendingManager.addPolicyRule(
					policyRequirements[_signature],
					policyRequirements[_address],
					tokenOwnerGroupName,
					policyRequirements[moderatorsGroupName],
					policyRequirements[moderatorsGroupName],
					{ from: nonOwner, }
				)
				const [policyGroupNames,] = await setup.TestPendingManager.getPolicyDetails.call(policyRequirements[_signature], policyRequirements[_address])
				assert.lengthOf(policyGroupNames, 0)
			})

			it("should be able to see added group in the policy details", async() => {
				await setup.TestPendingManager.addPolicyRule(
					policyRequirements[_signature],
					policyRequirements[_address],
					tokenOwnerGroupName,
					policyRequirements[moderatorsGroupName],
					policyRequirements[moderatorsGroupName],
					{ from: systemOwner, }
				)

				const [policyGroupNames,] = await setup.TestPendingManager.getPolicyDetails.call(policyRequirements[_signature], policyRequirements[_address])
				assert.lengthOf(policyGroupNames, 1)
				assert.include(policyGroupNames.map(e => utils.toUtf8String(e)), tokenOwnerGroupName)
			})

			it("shouldn't be able to remove rule from the policy by non-owner with UNAUTHORIZED code", async() => {
				assert.equal((await setup.TestPendingManager.removePolicyRule.call(
					policyRequirements[_signature],
					policyRequirements[_address],
					tokenOwnerGroupName,
					{ from: nonOwner, }
				)).toNumber(), error.UNAUTHORIZED)
			})

			it("should be able to add rule by contract owner with OK code", async() => {
				assert.equal((await setup.TestPendingManager.addPolicyRule.call(
					policyRequirements[_signature],
					policyRequirements[_address],
					moderatorsGroupName,
					policyRequirements[moderatorsGroupName],
					policyRequirements[moderatorsGroupName],
					{ from: systemOwner, }
				)).toNumber(), error.OK)
			})

			it("should be able to add rule by contract owner", async() => {
				const tx = await setup.TestPendingManager.addPolicyRule(
					policyRequirements[_signature],
					policyRequirements[_address],
					moderatorsGroupName,
					policyRequirements[moderatorsGroupName],
					policyRequirements[moderatorsGroupName],
					{ from: systemOwner, }
				)
				console.log(`${tx.receipt.gasUsed}`)

				assert.equal((await setup.TestPendingManager.policiesCount.call()).toNumber(), 1)		
			})

			it("should be able to see set policy rule in details call", async() => {
				const [ policyGroupNames, policyNumberOfRequired, ] = await setup.TestPendingManager.getPolicyDetails.call(policyRequirements[_signature], policyRequirements[_address])
				assert.lengthOf(policyNumberOfRequired, policyGroupNames.length)
				assert.lengthOf(policyGroupNames, 2)
				assert.include(policyGroupNames.map(e => utils.toUtf8String(e)), moderatorsGroupName)
			})
		})
	})

	context("securing", () => {
		const authorizedAddress = systemOwner
		const key1 = "0x001001001001"

		let moderatorUser

		before("revert", async () => {
			await setup.revert()
		})

		context("from one group with one user", () => {

			before("init", async() => {
				await setup.revert()

				moderatorUser = accounts[2]
				await setup.GroupsAccessManager.createGroup(moderatorsGroupName, groupPriority, { from: systemOwner, })
				await setup.GroupsAccessManager.registerUser(moderatorUser, { from: systemOwner, })
				await setup.GroupsAccessManager.addUsersToGroup(moderatorsGroupName, [moderatorUser,], { from: systemOwner, })

				var tx = await setup.TestPendingManager.addPolicyRule(
					policyRequirements[_signature],
					policyRequirements[_address],
					moderatorsGroupName,
					policyRequirements[moderatorsGroupName],
					policyRequirements[moderatorsGroupName],
					{ from: systemOwner, }
				)
				sig = await setup.def.PendingFacade.getSig(tx)
			})

			describe("confirmation and `done`", () => {
				describe("pre-setup", () => {
					it("should have only on rule for the policy", async() => {
						const [policyGroupNames,] = await setup.TestPendingManager.getPolicyDetails.call(policyRequirements[_signature], policyRequirements[_address])
						assert.lengthOf(policyGroupNames, 1)
					})
				})

				describe("adding tx", () => {
					it("should be able to add secure key", async() => {
						await setup.TestPendingManager.addTx(defKey, sig, policyRequirements[_address], { from: authorizedAddress, })
						assert.equal((await setup.TestPendingManager.txCount.call()).toNumber(), 1)
					})

					it("should have `Pending` state after adding secure key", async () => {
						assert.equal((await setup.TestPendingManager.hasConfirmedRecord.call(defKey)).toNumber(), error.PENDING_MANAGER_IN_PROCESS)
					})

					it("should be able for a user from a group to confirm secure key with OK code", async() => {
						const code = await setup.TestPendingManager.accept.call(defKey, moderatorsGroupName, { from: moderatorUser, })
						assert.equal(code.toNumber(), error.OK)
					})

					it("should be able for a user from a group to confirm secure key", async() => {
						await setup.TestPendingManager.accept(defKey, moderatorsGroupName, { from: moderatorUser, })
						assert.equal((await setup.TestPendingManager.hasConfirmedRecord.call(defKey)).toNumber(), error.OK)
					})
				})
			})

			describe("declining and `cancelled`", () => {
				describe("adding tx", () => {
					it("should be able to add secure key", async() => {
						await setup.TestPendingManager.addTx(key1, sig, policyRequirements[_address], { from: authorizedAddress, })
						assert.equal((await setup.TestPendingManager.txCount.call()).toNumber(), 2)
					})

					it("should have `Pending` state after adding secure key", async () => {
						assert.equal(await setup.TestPendingManager.hasConfirmedRecord.call(key1), error.PENDING_MANAGER_IN_PROCESS)
					})

					it("should be able for a user from a group to decline secure key with OK code", async() => {
						const code = await setup.TestPendingManager.decline.call(key1, moderatorsGroupName, { from: moderatorUser, })
						assert.equal(code.toNumber(), error.OK)
					})

					it("should be able for a user from a group to decline secure key", async() => {
						await setup.TestPendingManager.decline(key1, moderatorsGroupName, { from: moderatorUser, })
						assert.equal((await setup.TestPendingManager.hasConfirmedRecord.call(key1)).toNumber(), error.PENDING_MANAGER_REJECTED)
					})
				})
			})
		})

		let moderatorUser2
		let moderatorUser3

		context("from one group with several users", () => {

			const acceptLimit = 2
			const declineLimit = 2

			before("init", async() => {
				await setup.revert()

				moderatorUser = accounts[2]
				moderatorUser2 = accounts[3]
				moderatorUser3 = accounts[7]

				assert.isFalse(await setup.GroupsAccessManager.isGroupExists.call(moderatorsGroupName))

				await setup.GroupsAccessManager.createGroup(moderatorsGroupName, groupPriority, { from: systemOwner, })
				await setup.GroupsAccessManager.registerUser(moderatorUser, { from: systemOwner, })
				await setup.GroupsAccessManager.registerUser(moderatorUser2, { from: systemOwner, })
				await setup.GroupsAccessManager.registerUser(moderatorUser3, { from: systemOwner, })
				await setup.GroupsAccessManager.addUsersToGroup(moderatorsGroupName, [ moderatorUser, moderatorUser2, moderatorUser3, ], { from: systemOwner, })

				var tx = await setup.TestPendingManager.addPolicyRule(
					policyRequirements[_signature],
					policyRequirements[_address],
					moderatorsGroupName,
					acceptLimit,
					declineLimit,
					{ from: systemOwner, }
				)
				sig = await setup.def.PendingFacade.getSig(tx)
			})

			describe("confirmation, rejection, confirmation and `done`", () => {

				const key1 = "0xc1c2c2c3"

				it("should have correctly set limits for the policy", async () => {
					const [
						policyGroupNames,
						groupAcceptLimits,
						groupDeclineLimits,
						totalAcceptedLimit,
						totalDeclinedLimit,
					] = await setup.TestPendingManager.getPolicyDetails.call(policyRequirements[_signature], policyRequirements[_address])
					assert.lengthOf(policyGroupNames, 1)
					assert.equal(groupAcceptLimits[0], acceptLimit)
					assert.equal(groupDeclineLimits[0], declineLimit)
					assert.equal(totalAcceptedLimit, acceptLimit)
					assert.equal(totalDeclinedLimit, declineLimit)
				})

				it("should be able to add transaction", async() => {
					await setup.TestPendingManager.addTx(key1, sig, policyRequirements[_address], { from: authorizedAddress, })
					assert.equal((await setup.TestPendingManager.txCount.call()).toNumber(), 1)
				})

				it("should be able for a user from a group to accept transaction with OK code", async() => {
					const code = await setup.TestPendingManager.accept.call(key1, moderatorsGroupName, { from: moderatorUser, })
					assert.equal(code.toNumber(), error.OK)
				})

				it("should be able for a user from a group to accept transaction", async() => {
					await setup.TestPendingManager.accept(key1, moderatorsGroupName, { from: moderatorUser, })
					assert.equal((await setup.TestPendingManager.hasConfirmedRecord.call(key1)).toNumber(), error.PENDING_MANAGER_IN_PROCESS)
				})

				it("should allow decline transaction for other user from group with OK code", async () => {
					const code = await setup.TestPendingManager.decline.call(key1, moderatorsGroupName, { from: moderatorUser2, })
					assert.equal(code.toNumber(), error.OK)
				})

				it("should allow decline transaction for other user from group", async () => {
					await setup.TestPendingManager.decline(key1, moderatorsGroupName, { from: moderatorUser2, })
					assert.equal((await setup.TestPendingManager.hasConfirmedRecord.call(key1)).toNumber(), error.PENDING_MANAGER_IN_PROCESS)
				})

				it("should not change transaction state after accepting TX by already voted user", async () => {
					await setup.TestPendingManager.accept(key1, moderatorsGroupName, { from: moderatorUser, })
					assert.equal((await setup.TestPendingManager.hasConfirmedRecord.call(key1)).toNumber(), error.PENDING_MANAGER_IN_PROCESS)
				})

				it("should be able to confirm transaction by third user with OK code", async () => {
					const code = await setup.TestPendingManager.accept.call(key1, moderatorsGroupName, { from: moderatorUser3, })
					assert.equal(code.toNumber(), error.OK)
				})

				it("should be able to confirm transaction by third user", async () => {
					await setup.TestPendingManager.accept(key1, moderatorsGroupName, { from: moderatorUser3, })
					assert.equal((await setup.TestPendingManager.hasConfirmedRecord.call(key1)).toNumber(), error.OK)
				})

				it("should not be able to revoke its confirmation for transaction that was done with PENDING_MANAGER_INVALID_INVOCATION code", async() => {
					assert.equal((await setup.TestPendingManager.revoke.call(key1, { from: moderatorUser, })).toNumber(), error.PENDING_MANAGER_INVALID_INVOCATION)
				})

				it("should not be able to revoke its confirmation for transaction that was done", async() => {
					await setup.TestPendingManager.revoke(key1, { from: moderatorUser, })
					assert.equal((await setup.TestPendingManager.hasConfirmedRecord.call(key1)).toNumber(), error.OK)
				})

				it("should not be able to revoke its decline for transaction that was done with PENDING_MANAGER_INVALID_INVOCATION code", async() => {
					assert.equal((await setup.TestPendingManager.revoke.call(key1, { from: moderatorUser2, })).toNumber(), error.PENDING_MANAGER_INVALID_INVOCATION)
				})

				it("should not be able to revoke its decline for transaction that was done", async() => {
					await setup.TestPendingManager.revoke(key1, { from: moderatorUser2, })
					assert.equal((await setup.TestPendingManager.hasConfirmedRecord.call(key1)).toNumber(), error.OK)
				})
			})

			describe("confirmation, revokation, declining and `rejected`", () => {

				const key2 = "0xe1e2e3e4"
				const initialNumberOfTxs = 2

				it("should be able to add transaction", async() => {
					await setup.TestPendingManager.addTx(key2, sig, policyRequirements[_address], { from: authorizedAddress, })
					assert.equal((await setup.TestPendingManager.txCount.call()).toNumber(), initialNumberOfTxs)
				})

				it("should be able for a user from a group to accept transaction", async() => {
					await setup.TestPendingManager.accept(key2, moderatorsGroupName, { from: moderatorUser, })
					assert.equal((await setup.TestPendingManager.hasConfirmedRecord.call(key2)).toNumber(), error.PENDING_MANAGER_IN_PROCESS)
				})

				it("should allow to revoke without changing transaction state for a user that not in group", async() => {
					assert.equal((await setup.TestPendingManager.revoke.call(key2, { from: authorizedAddress, })).toNumber(), error.PENDING_MANAGER_HASNT_VOTED)
					assert.equal((await setup.TestPendingManager.hasConfirmedRecord.call(key2)).toNumber(), error.PENDING_MANAGER_IN_PROCESS)
				})

				it("should allow to revoke for the allowed user", async() => {
					await setup.TestPendingManager.revoke(key2, { from: moderatorUser, })
					assert.equal((await setup.TestPendingManager.hasConfirmedRecord.call(key2)).toNumber(), error.PENDING_MANAGER_IN_PROCESS)
				})

				it("should allow to decline TX by other allowed user", async () => {
					await setup.TestPendingManager.decline(key2, moderatorsGroupName, { from: moderatorUser2, })
					assert.equal((await setup.TestPendingManager.hasConfirmedRecord.call(key2)).toNumber(), error.PENDING_MANAGER_IN_PROCESS)
				})

				it("should be able to reject TX by declining by a user", async () => {
					await setup.TestPendingManager.decline(key2, moderatorsGroupName, { from: moderatorUser3, })
					assert.equal((await setup.TestPendingManager.hasConfirmedRecord.call(key2)).toNumber(), error.PENDING_MANAGER_REJECTED)
				})

				it("should have the same number of transactions", async () => {
					assert.equal((await setup.TestPendingManager.txCount.call()).toNumber(), initialNumberOfTxs)
				})

				it("should not be able to accept its declining for transaction that was rejected with PENDING_MANAGER_INVALID_INVOCATION code", async() => {
					assert.equal((await setup.TestPendingManager.accept.call(key2, moderatorsGroupName, { from: moderatorUser3, })).toNumber(), error.PENDING_MANAGER_INVALID_INVOCATION)
				})

				it("should not be able to accept its declining for transaction that was rejected", async() => {
					await setup.TestPendingManager.revoke(key2, { from: moderatorUser3, })
					assert.equal((await setup.TestPendingManager.hasConfirmedRecord.call(key2)).toNumber(), error.PENDING_MANAGER_REJECTED)
				})
			})
		})

		context("from two different groups", () => {

			const acceptLimitForEveryGroup = 1
			const declineLimitForEveryGroup = 1

			let tokenOwnerUser
			let moderatorUser
			let moderatorUser2

			var initialNumberOfTxs

			before(async() => {
				await setup.revert()

				tokenOwnerUser = accounts[2]
				moderatorUser = accounts[3]
				moderatorUser2 = accounts[4]

				await setup.GroupsAccessManager.createGroup(tokenOwnerGroupName, groupPriority, { from: systemOwner, })
				await setup.GroupsAccessManager.createGroup(moderatorsGroupName, groupPriority, { from: systemOwner, })
				await setup.GroupsAccessManager.registerUser(tokenOwnerUser, { from: systemOwner, })
				await setup.GroupsAccessManager.registerUser(moderatorUser, { from: systemOwner, })
				await setup.GroupsAccessManager.registerUser(moderatorUser2, { from: systemOwner, })
				await setup.GroupsAccessManager.addUsersToGroup(tokenOwnerGroupName, [tokenOwnerUser,], { from: systemOwner, })
				await setup.GroupsAccessManager.addUsersToGroup(moderatorsGroupName, [ moderatorUser, moderatorUser2, ], { from: systemOwner, })

				const tx = await setup.TestPendingManager.addPolicyRule(
					policyRequirements[_signature],
					policyRequirements[_address],
					tokenOwnerGroupName,
					acceptLimitForEveryGroup,
					declineLimitForEveryGroup,
					{ from: systemOwner, }
				)
				sig = await setup.def.PendingFacade.getSig(tx)

				await setup.TestPendingManager.addPolicyRule(
					policyRequirements[_signature],
					policyRequirements[_address],
					moderatorsGroupName,
					acceptLimitForEveryGroup,
					declineLimitForEveryGroup,
					{ from: systemOwner, }
				)
			})

			describe("pre-setup", () => {

				it("should have no txs in pending", async() => {
					assert.equal(await setup.TestPendingManager.txCount.call(), 0)
				})

				it("should have one rule with two groups for the policy", async() => {
					const [policyGroupNames,] = await setup.TestPendingManager.getPolicyDetails.call(policyRequirements[_signature], policyRequirements[_address])
					assert.lengthOf(policyGroupNames, 2)
				})
			})

			const key1 = "0xf0000f0000f"

			describe("double confirmation and `done`", () => {

				it("should be able to add tx for confirmation", async () => {
					await setup.TestPendingManager.addTx(key1, sig, policyRequirements[_address])
					assert.equal((await setup.TestPendingManager.hasConfirmedRecord.call(key1)).toNumber(), error.PENDING_MANAGER_IN_PROCESS)

					initialNumberOfTxs = (await setup.TestPendingManager.txCount.call()).toNumber()
				})

				it("should be in pending after first user vote", async () => {
					await setup.TestPendingManager.accept(key1, tokenOwnerGroupName, { from: tokenOwnerUser, })
					assert.equal((await setup.TestPendingManager.hasConfirmedRecord.call(key1)).toNumber(), error.PENDING_MANAGER_IN_PROCESS)
				})

				it("should be done after second user vote", async () => {
					await setup.TestPendingManager.accept(key1, moderatorsGroupName, { from: moderatorUser2, })
					assert.equal((await setup.TestPendingManager.hasConfirmedRecord.call(key1)).toNumber(), error.OK)
				})

				it("should keep initial number of txs after confirming", async () => {
					assert.equal((await setup.TestPendingManager.txCount.call()).toNumber(), initialNumberOfTxs)
				})
			})


			const key2 = "0xff000ff00f"

			describe("single confirmation, double declining, `rejected`", () => {

				it("should be able to add tx for confirmation", async () => {
					await setup.TestPendingManager.addTx(key2, sig, policyRequirements[_address])
					initialNumberOfTxs += 1
					assert.equal((await setup.TestPendingManager.hasConfirmedRecord.call(key2)).toNumber(), error.PENDING_MANAGER_IN_PROCESS)
					assert.equal((await setup.TestPendingManager.txCount.call()).toNumber(), initialNumberOfTxs)
				})

				it("should be in pending after first user vote", async () => {
					await setup.TestPendingManager.accept(key2, tokenOwnerGroupName, { from: tokenOwnerUser, })
					assert.equal((await setup.TestPendingManager.hasConfirmedRecord.call(key2)).toNumber(), error.PENDING_MANAGER_IN_PROCESS)
				})

				it("should be able to decline previous acceptance by the first user", async () => {
					await setup.TestPendingManager.decline(key2, tokenOwnerGroupName, { from: tokenOwnerUser, })
					assert.equal((await setup.TestPendingManager.hasConfirmedRecord.call(key2)).toNumber(), error.PENDING_MANAGER_IN_PROCESS)
				})

				it("should be able to decline by second user and be rejected", async () => {
					await setup.TestPendingManager.decline(key2, moderatorsGroupName, { from: moderatorUser2, })
					assert.equal((await setup.TestPendingManager.hasConfirmedRecord.call(key2)).toNumber(), error.PENDING_MANAGER_REJECTED)
				})

				it("should keep initial number of txs after confirming", async () => {
					assert.equal((await setup.TestPendingManager.txCount.call()).toNumber(), initialNumberOfTxs)
				})
			})
		})
	})
})