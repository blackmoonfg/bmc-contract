const Setup = require('../setup/setup')
const error = require('../../common/errors')
const utils = require('../../common//helpers/utils')

contract("GroupAccessManager", accounts => {
	const setup = new Setup()
	setup.init()

	const systemOwner = accounts[ 0 ]
	const nonOwner = accounts[ 9 ]

	before("setup", async () => {
		await setup.beforeAll()
		await setup.snapshot()
	})

	context("integration", () => {
		it("presents in tests", () => {
			assert.isDefined(setup.GroupsAccessManager)
		})

		it("has an address", () => {
			assert.notEqual(setup.GroupsAccessManager.address, utils.zeroAddress)
		})

		it("has correct contract owner", async () => {
			assert.equal(await setup.GroupsAccessManager.contractOwner.call(), systemOwner)
		})
	})

	context("user", () => {
		const user1 = accounts[ 5 ]
		const user2 = accounts[ 6 ]

		describe("registration", () => {
			it("shouldn't show an initial user address as registered", async () => {
				assert.isFalse(await setup.GroupsAccessManager.isRegisteredUser.call(user1))
			})

			it("shouldn't be able to register a user by non-owner with UNAUTHORIZED code", async () => {
				assert.equal(await setup.GroupsAccessManager.registerUser.call(user1, { from: nonOwner, }), error.UNAUTHORIZED)
			})

			it("shouldn't be able to register a user by non-owner", async () => {
				await setup.GroupsAccessManager.registerUser(user1, { from: nonOwner, })
				assert.isFalse(await setup.GroupsAccessManager.isRegisteredUser.call(user1))
			})

			it("should be able to register a user by contract owner with OK code", async () => {
				assert.equal(await setup.GroupsAccessManager.registerUser.call(user1, { from: systemOwner, }), error.OK)
			})

			it("should be able to register a user by contract owner", async () => {
				await setup.GroupsAccessManager.registerUser(user1, { from: systemOwner, })
				assert.isTrue(await setup.GroupsAccessManager.isRegisteredUser.call(user1))
			})

			it("user shouldn't be member of any group after registration", async () => {
				const groups = await setup.GroupsAccessManager.getGroups.call()
				assert.isFalse(await setup.GroupsAccessManager.isRegisteredUser.call(user2))
				groups.forEach(async group => assert.isFalse(await setup.GroupsAccessManager.isUserInGroup.call(group, user2)))

				await setup.GroupsAccessManager.registerUser(user2, { from: systemOwner, })

				assert.isTrue(await setup.GroupsAccessManager.isRegisteredUser.call(user2))
				groups.forEach(async group => assert.isFalse(await setup.GroupsAccessManager.isUserInGroup.call(group, user2)))
			})

			it("should be able to register a second user", async () => {
				const tx = await setup.GroupsAccessManager.registerUser(user2, { from: systemOwner, })
				console.log(`${tx.receipt.gasUsed}`)
				assert.isTrue(await setup.GroupsAccessManager.isRegisteredUser.call(user2))
			})

			it("shouldn't be able to register the same user twice", async () => {
				await setup.GroupsAccessManager.registerUser(user2, { from: systemOwner, })
				assert.equal((await setup.GroupsAccessManager.registerUser.call(user2, { from: systemOwner, })).toNumber(), error.USER_MANAGER_MEMBER_ALREADY_EXIST)
			})
		})

		describe("unregistration", () => {
			const removeUser = user2

			it("shouldn't be able to unregister a user by non-owner with UNAUTHORIZED code", async () => {
				assert.equal(await setup.GroupsAccessManager.unregisterUser.call(removeUser, { from: nonOwner, }), error.UNAUTHORIZED)
			})

			it("shouldn't be able to unregister a user by non-owner", async () => {
				await setup.GroupsAccessManager.registerUser(removeUser, { from: systemOwner, })
				await setup.GroupsAccessManager.unregisterUser(removeUser, { from: nonOwner, })
				assert.isTrue(await setup.GroupsAccessManager.isRegisteredUser.call(removeUser))
			})

			it("should be able to unregister a user by contract owner with OK code", async () => {
				await setup.GroupsAccessManager.registerUser(removeUser, { from: systemOwner, })
				assert.equal((await setup.GroupsAccessManager.unregisterUser.call(removeUser, { from: systemOwner, })).toNumber(), error.OK)
			})

			it("should be able to unregister a user by contract owner", async () => {
				const tx = await setup.GroupsAccessManager.unregisterUser(removeUser, { from: systemOwner, })
				console.log(`${tx.receipt.gasUsed}`)
				assert.isFalse(await setup.GroupsAccessManager.isRegisteredUser.call(removeUser))
			})

			it("shouldn't be able to unregister non-extisted user", async () => {
				assert.equal(await setup.GroupsAccessManager.unregisterUser.call(removeUser, { from: systemOwner, }), error.USER_MANAGER_INVALID_INVOCATION)
			})

			it("should have 1 registered users", async () => {
				assert.equal((await setup.GroupsAccessManager.membersCount.call()).toNumber(), 1)
			})

			it("shouldn't be able to remove register user if he stay in groups", async () => {
				const groupName1 = "Moderators RU zone"
				const groupPriority = 2

				await setup.GroupsAccessManager.registerUser(removeUser, { from: systemOwner, })
				await setup.GroupsAccessManager.createGroup(groupName1, groupPriority, { from: systemOwner, })
				await setup.GroupsAccessManager.addUsersToGroup(groupName1, [removeUser,], { from: systemOwner, })
				assert.equal((await setup.GroupsAccessManager.unregisterUser.call(removeUser, { from: systemOwner, })).toNumber(), error.USER_MANAGER_INVALID_INVOCATION)
			})
		})
	})

	context("groups", () => {
		const groupName1 = "Moderators RU zone"
		const groupName2 = "ATxToken owners"
		const groupPriority = 2

		const user1 = accounts[ 5 ]
		const user2 = accounts[ 6 ]
		const notRegisteredUser = accounts[ 4 ]

		describe("creation", () => {
			it("shouldn't be able to create a group by non-owner with UNAUTHORIZED code", async () => {
				assert.equal(await setup.GroupsAccessManager.createGroup.call(groupName1, groupPriority, { from: nonOwner, }), error.UNAUTHORIZED)
			})

			it("shouldn't be able to create a group by non-owner", async () => {
				const beforeNumberOfGroups = await setup.GroupsAccessManager.groupsCount.call()
				await setup.GroupsAccessManager.createGroup(groupName1, groupPriority, { from: nonOwner, })
				assert.equal(await setup.GroupsAccessManager.groupsCount.call(), beforeNumberOfGroups.toNumber())
			})

			it("should be able to create a group by contract owner with OK CHINA_COUNTRY_CODE", async () => {
				assert.equal(await setup.GroupsAccessManager.createGroup.call(groupName1, groupPriority, { from: systemOwner, }), error.OK)
			})

			it("should be able to create a group by contract owner", async () => {
				const beforeNumberOfGroups = await setup.GroupsAccessManager.groupsCount.call()
				const tx = await setup.GroupsAccessManager.createGroup(groupName1, groupPriority, { from: systemOwner, })
				console.log(`${tx.receipt.gasUsed}`)
				assert.equal(await setup.GroupsAccessManager.groupsCount.call(), beforeNumberOfGroups.toNumber() + 1)
			})

			it("shouldn't be able to create a group with existed name ", async () => {
				await setup.GroupsAccessManager.createGroup(groupName1, groupPriority, { from: systemOwner, })
				assert.equal((await setup.GroupsAccessManager.createGroup.call(groupName1, groupPriority, { from: systemOwner, })).toNumber(), error.USER_MANAGER_GROUP_ALREADY_EXIST)
			})

			it("should be able to create a second group", async () => {
				const beforeNumberOfGroups = await setup.GroupsAccessManager.groupsCount.call()
				await setup.GroupsAccessManager.createGroup(groupName2, groupPriority, { from: systemOwner, })
				assert.equal(await setup.GroupsAccessManager.groupsCount.call(), beforeNumberOfGroups.toNumber() + 1)
			})
		})

		context("blocking", () => {

			beforeEach("setup", async () => {
				await setup.GroupsAccessManager.registerUser(user1, { from: systemOwner, })
				await setup.GroupsAccessManager.registerUser(user2, { from: systemOwner, })

				await setup.GroupsAccessManager.createGroup(groupName1, groupPriority, { from: systemOwner, })
				await setup.GroupsAccessManager.createGroup(groupName2, groupPriority, { from: systemOwner, })
			})

			context("blocking", () => {
				it("group should be unblocked (active) after creation", async () => {
					assert.isFalse(await setup.GroupsAccessManager.groupsBlocked.call(groupName1))
					assert.isFalse(await setup.GroupsAccessManager.groupsBlocked.call(groupName2))
				})

				it("shouldn't be possible to block a group by non-owner with UNAUTHORIZED code", async () => {
					assert.equal(await setup.GroupsAccessManager.changeGroupActiveStatus.call(groupName2, true, { from: nonOwner, }), error.UNAUTHORIZED)
				})

				it("shouldn't be possible to block a group by non-owner", async () => {
					await setup.GroupsAccessManager.changeGroupActiveStatus(groupName2, true, { from: nonOwner, })
					assert.isFalse(await setup.GroupsAccessManager.groupsBlocked.call(groupName2))
				})

				it("should be possible to block a group by contract owner with OK code", async () => {
					assert.equal(await setup.GroupsAccessManager.changeGroupActiveStatus.call(groupName2, true, { from: systemOwner, }), error.OK)
				})

				it("should be possible to block a group by contract owner", async () => {
					const tx = await setup.GroupsAccessManager.changeGroupActiveStatus(groupName2, true, { from: systemOwner, })
					console.log(`${tx.receipt.gasUsed}`)
					assert.isTrue(await setup.GroupsAccessManager.groupsBlocked.call(groupName2))
				})

				it("should be possible to return active status to a group", async () => {
					await setup.GroupsAccessManager.changeGroupActiveStatus(groupName2, false, { from: systemOwner, })
					assert.isFalse(await setup.GroupsAccessManager.groupsBlocked.call(groupName2))
				})
			})

			context("add users", () => {
				it("shouldn't be possible to add users by non-owner with UNAUTHORIZED code", async () => {
					assert.equal(await setup.GroupsAccessManager.addUsersToGroup.call(groupName1, [ user1, user2, ], { from: nonOwner, }), error.UNAUTHORIZED)
				})

				it("shouldn't be possible to add users by non-owner", async () => {
					await setup.GroupsAccessManager.addUsersToGroup(groupName1, [ user1, user2, ], { from: nonOwner, })
					assert.isFalse(await setup.GroupsAccessManager.isUserInGroup.call(groupName1, user1))
					assert.isFalse(await setup.GroupsAccessManager.isUserInGroup.call(groupName1, user2))
				})

				it("should be possible to add one user by contract owner with OK code", async () => {
					assert.equal(await setup.GroupsAccessManager.addUsersToGroup.call(groupName1, [user1,], { from: systemOwner, }), error.OK)
				})

				it("should be possible to add one user by contract owner", async () => {
					const tx = await setup.GroupsAccessManager.addUsersToGroup(groupName1, [user1,], { from: systemOwner, })
					console.log(`${tx.receipt.gasUsed}`)
					assert.isTrue(await setup.GroupsAccessManager.isUserInGroup.call(groupName1, user1))
					assert.isFalse(await setup.GroupsAccessManager.isUserInGroup.call(groupName1, user2))
				})

				it("unregistered user should be shown as unregistered", async () => {
					assert.isFalse(await setup.GroupsAccessManager.isRegisteredUser.call(notRegisteredUser))
				})

				it("should revert when trying to add an unregistered user", async () => {
					try {
						await setup.GroupsAccessManager.addUsersToGroup.call(groupName1, [ user1, notRegisteredUser, ], { from: systemOwner, })
						assert.isTrue(false)
					}
					catch (e) {
						utils.ensureRevert(e)
					}
				})
			})

			context("remove users", () => {

				beforeEach("setup", async () => {
					await setup.GroupsAccessManager.addUsersToGroup(groupName1, [user1,], { from: systemOwner, })
				})

				it("shouldn't be possible to remove users by non-owner with UNAUTHORIZED code", async () => {
					assert.equal(await setup.GroupsAccessManager.removeUsersFromGroup.call(groupName1, [user1,], { from: nonOwner, }), error.UNAUTHORIZED)
				})

				it("shouldn't be possible to remove users by non-owner", async () => {
					await setup.GroupsAccessManager.removeUsersFromGroup(groupName1, [user1,], { from: nonOwner, })
					assert.isTrue(await setup.GroupsAccessManager.isUserInGroup.call(groupName1, user1))
				})

				it("should be possible to remove one user by contract owner with OK code", async () => {
					assert.equal(await setup.GroupsAccessManager.removeUsersFromGroup.call(groupName1, [user1,], { from: systemOwner, }), error.OK)
				})

				it("should be possible to remove one user by contract owner", async () => {
					const tx = await setup.GroupsAccessManager.removeUsersFromGroup(groupName1, [user1,], { from: systemOwner, })
					console.log(`${tx.receipt.gasUsed}`)
					assert.isFalse(await setup.GroupsAccessManager.isUserInGroup.call(groupName1, user1))
				})

				it("unregistered user should be shown as unregistered", async () => {
					assert.isFalse(await setup.GroupsAccessManager.isRegisteredUser.call(notRegisteredUser))
				})

				it("shouldn't revert when trying to remove unregistered user", async () => {
					await setup.GroupsAccessManager.removeUsersFromGroup.call(groupName1, [notRegisteredUser,], { from: systemOwner, })
					assert.isTrue(true)
				})
			})
		})
	})
})