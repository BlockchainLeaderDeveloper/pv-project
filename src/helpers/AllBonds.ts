import { StableBond, LPBond, NetworkID, CustomBond, BondType } from "src/lib/Bond";
import { addresses } from "src/constants";

import { ReactComponent as USDCImg } from "src/assets/tokens/USDC.svg";
import { ReactComponent as BhdDaiImg } from "src/assets/tokens/BHD-DAI.svg";
import { ReactComponent as wETHImg } from "src/assets/tokens/wBNB.svg";
import { ReactComponent as MimImg } from "src/assets/tokens/MIM.svg";

import { abi as BondBhdDaiContract } from "src/abi/bonds/BhdDaiContract.json";
import { abi as DaiBondContract } from "src/abi/bonds/DaiContract.json";
import { abi as EthBondContract } from "src/abi/bonds/EthContract.json";

import { abi as ReserveBhdDaiContract } from "src/abi/reserves/BhdDai.json";

import { abi as ierc20Abi } from "src/abi/IERC20.json";
import { getBondCalculator } from "src/helpers/BondCalculator";

// TODO(zx): Further modularize by splitting up reserveAssets into vendor token definitions
//   and include that in the definition of a bond

export const dai = new StableBond({
  name: "dai",
  displayName: "DAI",
  bondToken: "DAI",
  bondIconSvg: "/images/tokens/DAI.png",
  bondContractABI: DaiBondContract,
  networkAddrs: {
    [NetworkID.Mainnet]: {
      bondAddress: "0xfC68E9EACf7e8ab3D3A79eE3E651e8861178e1c4",
      reserveAddress: "0x4938eea48b74e542dbc60e22be33722cbabd6a5b", 
    },
    [NetworkID.Testnet]: {
      bondAddress: "0x7b10a32d15FE1196a7f1590a855AC4ACcB6fe772",
      reserveAddress: "0x8a9424745056Eb399FD19a0EC26A14316684e274",
    },
  },
});

export const usdc = new StableBond({
  name: "usdc",
  displayName: "USDC",
  bondToken: "USDC",
  bondIconSvg: "/images/tokens/usdc.png",
  bondContractABI: DaiBondContract,
  networkAddrs: {
    [NetworkID.Mainnet]: {
      bondAddress: "0x32910D3CD9fec1c215cF238A7598590B8014f0cB",
      reserveAddress: "0x2791bca1f2de4661ed88a30c99a7a9449aa84174",
    },
    [NetworkID.Testnet]: {
      bondAddress: "0x7b10a32d15FE1196a7f1590a855AC4ACcB6fe772",
      reserveAddress: "0x8a9424745056Eb399FD19a0EC26A14316684e274",
    },
  },
});
export const wmatic = new StableBond({
  name: "wmatic",
  displayName: "WMATIC",
  bondToken: "WMATIC",
  bondIconSvg: "/images/tokens/matic.png",
  bondContractABI: DaiBondContract,
  networkAddrs: {
    [NetworkID.Mainnet]: {
      bondAddress: "0x898F987c59d029D9B9Ad0d91d9faE95E31F3A9cF",
      reserveAddress: "0x0d500b1d8e8ef31e21c99d1db9a6444d3adf1270",
    },
    [NetworkID.Testnet]: {
      bondAddress: "0x7b10a32d15FE1196a7f1590a855AC4ACcB6fe772",
      reserveAddress: "0x8a9424745056Eb399FD19a0EC26A14316684e274",
    },
  },
});



export const usdc_hom = new LPBond({
  name: "usdc_hom_lp",
  displayName: "USDC-HOM LP",
  bondToken: "USDC",
  bondIconSvg: "/images/tokens/USDC-HOM.png",
  bondContractABI: BondBhdDaiContract,
  reserveContract: ReserveBhdDaiContract,
  networkAddrs: {
    [NetworkID.Mainnet]: {
      bondAddress: "0xbbb71c3A583BD328434C434C6722e0F22A645e18",
      reserveAddress: "0xd0d03ee6b2ad7b7ca100d25f169b9548949f60cc",
    },
    [NetworkID.Testnet]: {
      bondAddress: "0x37346f0bdCd6B510aC3673007791C94f48CA0af4",
      reserveAddress: "0x6aCDe82dFbF8B25bf9fb9E7b0CCaF648c3f60b63",
    },
  },
  lpUrl:
    "https://quickswap.exchange/#/add/0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174/0x9fe19698aE613Ae626CC3670A92A105e1089D68E",
});


export const mim = new StableBond({
  name: "mim",
  displayName: "MIM",
  bondToken: "MIM",
  bondIconSvg: "/images/tokens/mim.png",
  bondContractABI: DaiBondContract,
  networkAddrs: {
    [NetworkID.Mainnet]: {
      bondAddress: "0xD65E7D7BC57b544e6F5541D99Ee23Aea7990EC9f",
      reserveAddress: "0x130966628846bfd36ff31a822705796e8cb8c18d",
    },
    [NetworkID.Testnet]: {
      bondAddress: "0x7b10a32d15FE1196a7f1590a855AC4ACcB6fe772",
      reserveAddress: "0x8a9424745056Eb399FD19a0EC26A14316684e274",
    },
  },
});

export const avax = new CustomBond({
  name: "avax",
  displayName: "wavax",
  lpUrl: "",
  bondType: BondType.StableAsset,
  bondToken: "WAVAX",
  bondIconSvg: wETHImg,
  bondContractABI: EthBondContract,
  reserveContract: ierc20Abi, // The Standard ierc20Abi since they're normal tokens
  networkAddrs: {
    [NetworkID.Mainnet]: {
      bondAddress: "0x72De9F0e51cA520379a341318870836FdCaf03B9",
      reserveAddress: "0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c",
    },
    [NetworkID.Testnet]: {
      bondAddress: "0xca7b90f8158A4FAA606952c023596EE6d322bcf0",
      reserveAddress: "0xc778417e063141139fce010982780140aa0cd5ab",
    },
  },
  customTreasuryBalanceFunc: async function (this: CustomBond, networkID, provider) {
    const ethBondContract = this.getContractForBond(networkID, provider);
    let ethPrice = await ethBondContract.assetPrice();
    ethPrice = ethPrice / Math.pow(10, 8);
    const token = this.getContractForReserve(networkID, provider);
    let ethAmount = await token.balanceOf(addresses[networkID].TREASURY_ADDRESS);
    ethAmount = ethAmount / Math.pow(10, 18);
    return ethAmount * ethPrice;
  },
});





export const allBonds = [usdc,wmatic];
export const allBondsMap = allBonds.reduce((prevVal, bond) => {
  return { ...prevVal, [bond.name]: bond };
}, {});

export default allBonds;
