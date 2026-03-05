// 

import hre from "hardhat"

async function main() {

  const [deployer] = await hre.ethers.getSigners();
  console.log(`deployer address: ${deployer.address}`);

  const CountryList = await hre.ethers.getContractFactory("CountryList")
  const countryList = await CountryList.deploy();
  await countryList.waitForDeployment();

  console.log('country list address: ', await countryList.getAddress())

}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
