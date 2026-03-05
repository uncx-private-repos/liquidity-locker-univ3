import hre from "hardhat";

async function main() {
  const [deployer] = await hre.ethers.getSigners();

  // Addresses
  const FACTORY_ADDRESS = "0xd8aeb65afB238cb98ce9Ae92237C2dd0A52fc7eD";
  const POSITION_MANAGER_ADDRESS = "0xBC2e7d0e0CdB97E6fBDA162bA438A72333C41a54";


  // const TOKEN_A = "0x9D6a016f69873777739AD14405421Ee7F80b8cC5";
  // const TOKEN_B = "0x0029C8dA78557190336445b9CC4D6F44b6747d94";

  const TokenERC20 = await hre.ethers.getContractFactory("Erc20Simple");
  const tokenA = await TokenERC20.deploy("Token K", "tknk");
  await tokenA.waitForDeployment();

  const tokenB = await TokenERC20.deploy("Token R", "tknr");
  await tokenB.waitForDeployment();

  const TOKEN_A = await tokenA.getAddress();
  const TOKEN_B = await tokenB.getAddress();

  const FEE = 3000; // 0.3%

  const factoryAbi = [
    "function createPool(address tokenA, address tokenB, uint24 fee) external returns (address pool)",
    "function getPool(address tokenA, address tokenB, uint24 fee) external view returns (address pool)",
    "function owner() external view returns (address)",
    "function feeAmountTickSpacing(uint24 fee) external view returns (int24)",
  ];

  const poolAbi = [
    "function initialize(uint160 sqrtPriceX96) external",
    "function slot0() external view returns (uint160 sqrtPriceX96, int24 tick, uint16, uint16, uint16, uint8, bool)",
  ];

  const positionManagerAbi = [
    "function mint((address token0, address token1, uint24 fee, int24 tickLower, int24 tickUpper, uint256 amount0Desired, uint256 amount1Desired, uint256 amount0Min, uint256 amount1Min, address recipient, uint256 deadline)) external returns (uint256 tokenId, uint128 liquidity, uint256 amount0, uint256 amount1)",
  ];

  const erc20Abi = [
    "function approve(address spender, uint256 amount) external returns (bool)",
    "function balanceOf(address account) external view returns (uint256)",
  ];

  // Check if the contract is present at the address
  const code = await ethers.provider.getCode(FACTORY_ADDRESS);
  
  if (code === "0x") {
    console.log("No contract found!");
  } else {
    console.log("Contrat found !");
    console.log("Code length:", code.length);
  }

  const factory = await ethers.getContractAt(factoryAbi, FACTORY_ADDRESS);
  const positionManager = await ethers.getContractAt(positionManagerAbi, POSITION_MANAGER_ADDRESS);

  // Infos générales
  try {
    const owner = await factory.owner();
    console.log("✅ Factory owner:", owner);
  } catch (e) {
    console.log("❌ Error owner:", e.message);
  }

  // Vérifier les fees disponibles
  for (const fee of [100, 500, 3000, 10000]) {
    try {
      const ts = await factory.feeAmountTickSpacing(fee);
      console.log(`✅ Fee ${fee} => tickSpacing: ${ts.toString()}`);
    } catch (e) {
      console.log(`❌ Fee ${fee} => Erreur: ${e.message}`);
    }
  }

  const balanceA = await tokenA.balanceOf(deployer.address);
  const balanceB = await tokenB.balanceOf(deployer.address);
  console.log("Balance Token A:", ethers.formatEther(balanceA));
  console.log("Balance Token B:", ethers.formatEther(balanceB));

  const existingPool = await factory.getPool(TOKEN_A, TOKEN_B, FEE);
  console.log("Existing pool:", existingPool);

  if (existingPool !== "0x0000000000000000000000000000000000000000") {
    console.log("Pool exists, skipping !");
  } else {
    console.log("Create a new pool...");
    const tx = await factory.createPool(TOKEN_A, TOKEN_B, FEE);
    await tx.wait();
    console.log("Pool created!");
  }

  const poolAddress = await factory.getPool(TOKEN_A, TOKEN_B, FEE);
  console.log("Pool address:", poolAddress);

  const pool = await ethers.getContractAt(poolAbi, poolAddress);
  const sqrtPriceX96 = BigInt("79228162514264337593543950336");

  console.log("Pool initialization...");
  const initTx = await pool.initialize(sqrtPriceX96);
  await initTx.wait();
  console.log("Pool created!");

  const amount = ethers.parseEther("1000");
  await (await tokenA.approve(POSITION_MANAGER_ADDRESS, amount)).wait();
  await (await tokenB.approve(POSITION_MANAGER_ADDRESS, amount)).wait();
  console.log("Tokens approved !");

  const [token0, token1] = TOKEN_A.toLowerCase() < TOKEN_B.toLowerCase()
    ? [TOKEN_A, TOKEN_B]
    : [TOKEN_B, TOKEN_A];

  console.log("Token0:", token0);
  console.log("Token1:", token1);

  console.log("Adding liquidity...");
  const mintTx = await positionManager.mint({
    token0: token0,
    token1: token1,
    fee: FEE,
    tickLower: -887220,
    tickUpper: 887220,
    amount0Desired: ethers.parseEther("100"),
    amount1Desired: ethers.parseEther("100"),
    amount0Min: BigInt(0),
    amount1Min: BigInt(0),
    recipient: deployer.address,
    deadline: Math.floor(Date.now() / 1000) + 60 * 20,
  });

  const receipt = await mintTx.wait();
  console.log("Liquidity added! Tx:", receipt.hash);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
