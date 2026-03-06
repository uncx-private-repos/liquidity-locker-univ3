// 

import hre from "hardhat"
import SETTINGS from '../settings.js'

async function main() {

  const [deployer] = await hre.ethers.getSigners();
  console.log(`deployer address: ${deployer.address}`);

  // Be sure to set these
  const nonFungiblePositionManagers = [
    "0xc32623ED46cc9d45DBf4a5462a8629835de1520d",
    // "0x3d79EdAaBC0EaB6F08ED885C05Fc0B014290D95A",
    // "0x7b8A01B39D58278b5DE7e48c8449c9f4F5170613"
  ]

  const metamaskOwner = '0xD45dD91DF475bFD944335160f538C1A14888DC1C'
  const signerAddress = '0xD45dD91DF475bFD944335160f538C1A14888DC1C'

  const autoCollector = '0xD45dD91DF475bFD944335160f538C1A14888DC1C'
  const lpFeeReceiver = '0xD45dD91DF475bFD944335160f538C1A14888DC1C'
  const collectFeeReceiver = '0xD45dD91DF475bFD944335160f538C1A14888DC1C'

  const UniV3Locker = await hre.ethers.getContractFactory("UNCX_LiquidityLocker_UniV3")
  const univ3locker = await UniV3Locker.deploy(SETTINGS.contracts.CountryList, autoCollector, lpFeeReceiver, collectFeeReceiver)
  await univ3locker.waitForDeployment()
  await new Promise(resolve => setTimeout(resolve, 10000));
  for (var nonFungiblePositionManager of nonFungiblePositionManagers) {
    await univ3locker.allowNftPositionManager(nonFungiblePositionManager)
  }
  await univ3locker.transferOwnership(metamaskOwner)

  // ReAdd this when you connect it to univ3locker
  const FeeResolver = await hre.ethers.getContractFactory("FeeResolver");
  const feeResolver = await FeeResolver.deploy(univ3locker.target, signerAddress, signerAddress)
  await feeResolver.waitForDeployment()
  await feeResolver.transferOwnership(metamaskOwner)

  // var NftPositionManager = new hre.ethers.Contract(SETTINGS.contracts.NonfungiblePositionManager, INonfungiblePositionManagerABI.abi, hre.ethers.provider)

  // console.log('NftPositionManager', NftPositionManager.target)
  console.log('univ3locker', univ3locker.target)
  console.log('feeResolver', feeResolver.target)
  console.log('CountryList', SETTINGS.contracts.CountryList)

  // var secondsToSleep = 12
  // for (var i = 0; i < secondsToSleep; i++) {
  //   console.log(`Sleeping for ${secondsToSleep - i} seconds`)
  //   await new Promise(resolve => setTimeout(resolve, 1000));
  // }

  // await hre.run("verify:verify", {
  //   address: univ3locker.target,
  //   constructorArguments: [
  //     SETTINGS.contracts.CountryList,
  //     autoCollector,
  //     lpFeeReceiver,
  //     collectFeeReceiver
  //   ],
  // });

  // Or manual verification -- This line below worked to verify
  // npx hardhat verify --contract contracts/UNCX_LiquidityLocker_UniV3.sol:UNCX_LiquidityLocker_UniV3 --network sepolia --constructor-args scripts/arguments.cjs 0x0a188696d962F975250818BA028FB07F7b7EB41A
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
