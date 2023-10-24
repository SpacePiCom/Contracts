import { ethers } from 'hardhat'
import { expect } from 'chai'
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers'
import { time, mine } from '@nomicfoundation/hardhat-network-helpers'
import { StakeLPEarnMultiToken, TestERC20 } from '../typechain-types'
import { BigNumber } from 'ethers'

describe('StakeLPEarnMultiToken', () => {
  let contract: StakeLPEarnMultiToken
  let LP: TestERC20
  let token1: TestERC20
  let token2: TestERC20
  let token3: TestERC20
  let token4: TestERC20
  let deployerAccount: SignerWithAddress
  let firstAccount: SignerWithAddress
  let secondAccount: SignerWithAddress
  let thirdAccount: SignerWithAddress
  let fourthAccount: SignerWithAddress
  let accounts: SignerWithAddress[]
  const depositAmount = ethers.utils.parseEther('1000000')

  beforeEach(async () => {
    accounts = await ethers.getSigners()
    ;[deployerAccount, firstAccount, secondAccount, thirdAccount, fourthAccount] = accounts
    const tokenFactory = await ethers.getContractFactory('TestERC20', deployerAccount)
    LP = (await tokenFactory
      .connect(deployerAccount)
      .deploy('Token', 'TKN', depositAmount)) as TestERC20
    token1 = (await tokenFactory
      .connect(deployerAccount)
      .deploy('Token', 'TKN', depositAmount)) as TestERC20
    token2 = (await tokenFactory
      .connect(deployerAccount)
      .deploy('Token', 'TKN', depositAmount)) as TestERC20
    token3 = (await tokenFactory
      .connect(deployerAccount)
      .deploy('Token', 'TKN', depositAmount)) as TestERC20
    token4 = (await tokenFactory
      .connect(deployerAccount)
      .deploy('Token', 'TKN', depositAmount)) as TestERC20
    const contractFactory = await ethers.getContractFactory(
      'StakeLPEarnMultiToken',
      deployerAccount
    )
    contract = (await contractFactory
      .connect(deployerAccount)
      .deploy(LP.address)) as StakeLPEarnMultiToken

    await LP.setBalance(firstAccount.address, depositAmount)
    await LP.setBalance(secondAccount.address, depositAmount)
    await LP.setBalance(thirdAccount.address, depositAmount)
    await LP.setBalance(fourthAccount.address, depositAmount)
    // const tx1 = await contract
    //   .connect(deployerAccount)
    //   .addToken(token1.address, ethers.utils.parseEther('1'), false)
    // await tx1.wait()
    // const tx2 = await contract
    //   .connect(deployerAccount)
    //   .addToken(token2.address, ethers.utils.parseEther('2'), false)
    // await tx2.wait()
    // const tx3 = await contract
    //   .connect(deployerAccount)
    //   .addToken(token3.address, ethers.utils.parseEther('3'), false)
    // await tx3.wait()
    // const tx4 = await contract
    //   .connect(deployerAccount)
    //   .addToken(token4.address, ethers.utils.parseEther('4'), false)
    // await tx4.wait()
  })

  it('deposit', async () => {
    await LP.connect(firstAccount).approve(contract.address, depositAmount)
    await contract.connect(firstAccount).deposit(depositAmount, secondAccount.address)
    expect(await LP.balanceOf(contract.address)).to.equal(depositAmount)
  })

  it('multi deposit', async () => {
    await LP.connect(firstAccount).approve(contract.address, depositAmount)
    await LP.connect(secondAccount).approve(contract.address, depositAmount)
    await LP.connect(thirdAccount).approve(contract.address, depositAmount)
    await LP.connect(fourthAccount).approve(contract.address, depositAmount)
    await contract.connect(secondAccount).deposit(depositAmount, firstAccount.address)
    await contract.connect(thirdAccount).deposit(depositAmount, firstAccount.address)
    await contract.connect(fourthAccount).deposit(depositAmount, firstAccount.address)
    expect(await LP.balanceOf(contract.address)).to.equal(depositAmount.mul(3))
  })

  it('claim correct', async () => {
    // console.log(await contract.rewards(2))
    await LP.connect(secondAccount).approve(contract.address, depositAmount)
    await LP.connect(thirdAccount).approve(contract.address, depositAmount)
    await LP.connect(fourthAccount).approve(contract.address, depositAmount)
    // await token2.setBalance(contract.address, depositAmount.mul(1000000))
    await contract.connect(secondAccount).deposit(depositAmount, firstAccount.address)
    await contract.connect(thirdAccount).deposit(depositAmount, firstAccount.address)
    await contract.connect(fourthAccount).deposit(depositAmount, firstAccount.address)
    await time.increase(7 * 86400)
    // await contract.connect(deployerAccount).open(1)
    const pendingReward = await contract.pending(secondAccount.address)
    // const rewardDept = await contract.rewardDept(secondAccount.address, 1)
    // await contract.connect(secondAccount).claim()
    const pool = await contract.pool()
    const user = await contract.users(secondAccount.address)
    // const userInfo = await contract.users(secondAccount.address)
    // const secondAccountReward = await token2.balanceOf(secondAccount.address)
    // const firstAccountReward = await token2.balanceOf(firstAccount.address)
    // console.log(userInfo.timestamp)
    // const blocktime = await time.latest()

    // time pass * reward per second * amount / total supply
    // console.log('calc reward        ', reward.toString())
    // console.log('secondAccountReward', secondAccountReward.toString())
    // console.log('firstAccountReward  ', firstAccountReward.toString())
    // console.log('pendingReward      ', pendingReward.toString())
    // console.log('first+secondAccount', firstAccountReward.add(secondAccountReward).toString())
    // expect(reward).to.equal(secondAccountReward)
    // expect(firstAccountReward.add(secondAccountReward)).to.equal(pendingReward)
    // console.log(
    //   'estimate claim',
    //   (await contract.connect(secondAccount).estimateGas.claim()).toString()
    // )
    const beforeClaim = await contract.pending(secondAccount.address)
    console.log('before claim', beforeClaim.toString())
    // await contract.connect(secondAccount).claim()
    // await contract.connect(thirdAccount).claim()
    // await contract.connect(fourthAccount).claim()
    const afterClaim = await contract.pending(secondAccount.address)
    console.log('after claim', afterClaim.toString())
    const timestamp = await time.latest()
    // console.log(timestamp, 7*86400)
    // console.log('time scope', BigNumber.from(timestamp).sub(pool.lastRewardTime).toString())
    const reward = depositAmount
      .mul(
        pool.accPerShare.add(
          BigNumber.from(timestamp)
            .sub(pool.lastRewardTime)
            .mul(pool.perSecond)
            .mul(1e12)
            .div(pool.amount)
        )
      )
      .div(1e12)
      .sub(user.rewardDebt)
      .mul(80)
      .div(100)

    console.log('pending ', pendingReward.mul(80).div(100).toString())
    const secondAmount = await contract.balanceOf(secondAccount.address)
    const thirdAmount = await contract.balanceOf(thirdAccount.address)
    const fourthAmount = await contract.balanceOf(fourthAccount.address)
    console.log('amount ', secondAmount.toString())
    console.log('calc reward', reward.toString())
    // expect(secondAmount).to.be.eq(reward)
    console.log(secondAmount.div(BigNumber.from(10).pow(18)).toString())
    // expect(
    //   BigNumber.from(timestamp)
    //     .sub(pool.lastRewardTime)
    //     .mul(BigNumber.from(10).pow(18))
    //     .mul(80)
    //     .div(100)
    // ).to.be.eq(secondAmount.add(thirdAmount).add(fourthAmount))
    // expect(pendingReward.mul(80).div(100)).to.be.eq(
    //   await contract.balanceOf(secondAccount.address)
    // )
    // console.log(
    //   'length',
    //   await contract.depl(secondAccount.address),
    //   await contract.setl(secondAccount.address),
    //   await contract.length()
    // )
    // for (let i = 0; i < 4; ++i) {
    //   const reward = await contract.pending(secondAccount.address, i)
    // const dept = await contract.rewardDept(secondAccount.address, i)
    // const settled = await contract.rewardSettled(secondAccount.address, i)
    // console.log('index reward', i, reward, dept, settled)
    // }
    // console.log(
    // 'after claim',
    // await contract.connect(secondAccount).pending(secondAccount.address)
    // await contract.connect(secondAccount).rewardDept(secondAccount.address, 1),
    // await contract.connect(secondAccount).rewardSettled(secondAccount.address, 1)
    // )
    // await time.increase(20)
    // const tx = await contract.connect(secondAccount).withdraw(depositAmount)
    // const receipt = await tx.wait()
    // console.log('receipt', receipt.transactionHash)
    // console.log(
    //   'few ago'
    //   // await contract.connect(secondAccount).pending(secondAccount.address, 1)
    //   // await contract.connect(secondAccount).rewardDept(secondAccount.address, 1),
    //   // await contract.connect(secondAccount).rewardSettled(secondAccount.address, 1)
    // )
    // console.log(await contract.connect(secondAccount.address).rewards(2))
    // console.log(await contract.connect(secondAccount.address).rewardDept(secondAccount.address, 2))
    // await LP.connect(secondAccount).approve(contract.address, depositAmount)
    // await token2.setBalance(contract.address, depositAmount.mul(1000000))
    // await token1.setBalance(secondAccount.address, depositAmount)
    // console.log(
    //   'estimate deposit',
    //   (
    //     await contract
    //       .connect(secondAccount)
    //       .estimateGas.deposit(depositAmount, firstAccount.address)
    //   ).toString()
    // )
    // console.log('second', await token2.balanceOf(secondAccount.address))
  })
  it('multi deposit', async () => {
    await LP.connect(secondAccount).setBalance(secondAccount.address, depositAmount.mul(2))
    await LP.connect(thirdAccount).setBalance(thirdAccount.address, depositAmount.mul(2))
    await LP.connect(fourthAccount).setBalance(fourthAccount.address, depositAmount.mul(2))

    await LP.connect(secondAccount).approve(contract.address, depositAmount.mul(2))
    await LP.connect(thirdAccount).approve(contract.address, depositAmount.mul(2))
    await LP.connect(fourthAccount).approve(contract.address, depositAmount.mul(2))
    const pool = await contract.pool()

    // await token1.setBalance(contract.address, depositAmount.mul('1000000000000000000000000'))
    // await token2.setBalance(contract.address, depositAmount.mul('20000000000000000000000000000'))
    // await token3.setBalance(contract.address, depositAmount.mul('3000000000000000000000000'))
    // await token4.setBalance(contract.address, depositAmount.mul('4000000000000000000000000'))
    // await contract.connect(deployerAccount).open(1)
    // init account balance
    const initialSecondBalance = await LP.balanceOf(secondAccount.address)
    const initialThirdBalance = await LP.balanceOf(thirdAccount.address)
    const initialFourthBalance = await LP.balanceOf(fourthAccount.address)
    console.log(
      'init balance',
      initialSecondBalance.toString(),
      initialThirdBalance.toString(),
      initialFourthBalance.toString()
    )
    // console.log('first deposit before')
    // await fn()
    await contract.connect(secondAccount).deposit(depositAmount, firstAccount.address)
    await contract.connect(thirdAccount).deposit(depositAmount, firstAccount.address)
    // console.log('first deposit after')
    // await fn()
    // after 1 day later
    await time.increase(86400)
    // console.log('second deposit before')
    // await fn()
    await contract.connect(secondAccount).deposit(depositAmount, firstAccount.address)
    await contract.connect(fourthAccount).deposit(depositAmount, firstAccount.address)
    // console.log('second deposit after')
    // await fn()
    // const tx9 = await contract.connect(fourthAccount).deposit('1', firstAccount.address)
    // const receipt2 = await tx9.wait()
    // console.log(tx9.data)
    // after 30 day later
    await time.increase(30 * 86400)

    // claims
    // await contract.connect(secondAccount).claim(1)
    // await contract.connect(thirdAccount).claim(1)
    // const beforeClaim = await contract.pending(secondAccount.address)
    // const beforeBalance = await contract.balanceOf(secondAccount.address)
    // console.log('before claim', beforeClaim.toString(), beforeBalance.toString())
    // const tx7 = await contract.connect(secondAccount).claim()
    // await tx7.wait()

    // const afterClaim = await contract.pending(secondAccount.address)
    // const afterBalance = await contract.balanceOf(secondAccount.address)
    // console.log('after claim', afterClaim.toString(), afterBalance.toString())

    const tx6 = await contract.connect(secondAccount).withdraw(depositAmount)
    await tx6.wait()
    const tx4 = await contract.connect(thirdAccount).withdraw(depositAmount)
    const tx5 = await contract.connect(fourthAccount).withdraw(depositAmount)
    await tx5.wait()
    await tx4.wait()

    // expect(receipt.logs.length).to.be.eq(14)

    // console.log(await contract.rewards(0), token1, token2, token3, token4)
    const pendingSecondAmount = await contract.balanceOf(secondAccount.address)
    const pendingThirdAmount = await contract.balanceOf(thirdAccount.address)
    const pendingFourthAmount = await contract.balanceOf(fourthAccount.address)
    console.log(`second = third + fourth`)
    console.log(
      `(${pendingFourthAmount.toString()}) + (${pendingThirdAmount.toString()}) = (${pendingFourthAmount.add(
        pendingThirdAmount
      )})`
    )
    console.log(
      pendingSecondAmount.toString(),
      pendingSecondAmount.div(BigNumber.from(10).pow(18)).toString()
    )
    // console.log(await contract.rewardLen(secondAccount.address))
  })
  it('multi deposit', async () => {
    for (const account of accounts.slice(1)) {
      await LP.connect(account).setBalance(account.address, depositAmount.mul(3))
      await LP.connect(account).approve(contract.address, depositAmount.mul(10))
      await contract.connect(account).deposit(depositAmount, LP.address)
      await mine(1000)
      const pendingAmount = await contract.pending(account.address)
      console.log(account.address, '1st pending', pendingAmount.toString())
      await contract.connect(account).deposit(depositAmount, LP.address)
      await mine(1000)
      const pendingAmount2 = await contract.pending(account.address)
      console.log(account.address, '2nd pending', pendingAmount2.toString())
      await contract.connect(account).withdraw(depositAmount.mul(2))
      console.log(account.address, 'withdraw 1st')
      await contract.connect(account).deposit(depositAmount, LP.address)
      await mine(1000)
      const pendingAmount3 = await contract.pending(account.address)
      console.log(account.address, '3rd pending', pendingAmount3.toString())
      await contract.connect(account).withdraw(depositAmount)
      console.log(account.address, 'withdraw 2nd')
      await contract.connect(account).deposit(depositAmount, LP.address)
      await mine(1000)
      const pendingAmount4 = await contract.pending(account.address)
      console.log(account.address, '4th pending', pendingAmount4.toString())
    }
    for (const account of accounts.slice(1)) {
      const pending = await contract.connect(account).pending(account.address)
      await contract.connect(account).withdraw(depositAmount)
      const withdraw = await contract.balanceOf(account.address)
      console.log(account.address, 'pending', pending.toString(), withdraw.toString())
    }
  })
})
