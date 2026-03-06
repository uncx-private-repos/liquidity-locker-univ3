// 

import hre from "hardhat"
import SETTINGS from '../settings.js'

async function main() {

  const [deployer] = await hre.ethers.getSigners();
  console.log(`deployer address: ${deployer.address}`);

  const feeResolverAddress = "0xc86aE62117aB4668C7b9E4ce8d66D48DdcA79FA7";
  const feeResolver = await hre.ethers.getContractAt("FeeResolver", feeResolverAddress);

  // Check if feeResolver is a valid contract
  const lp_min = await feeResolver.LP_MIN();
  console.log(lp_min);

  const univ3locker = await hre.ethers.getContractAt("UNCX_LiquidityLocker_UniV3", "0x51Cb42708b0E4E9aA31703FDfa9beFB9f6bB7A10");
  await univ3locker.setFeeResolver(feeResolverAddress);

  await univ3locker.addOrEditFee("DEFAULT", 0, 0, 0, hre.ethers.ZeroAddress);
  await univ3locker.addOrEditFee("LVP", 0, 0, 0, hre.ethers.ZeroAddress);
  await univ3locker.addOrEditFee("LLP", 0, 0, 0, hre.ethers.ZeroAddress);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
