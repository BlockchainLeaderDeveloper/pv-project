import { ethers } from "ethers";
import { addresses } from "../constants";
import { abi as ierc20Abi } from "../abi/IERC20.json";
import { abi as sBHD } from "../abi/sBHD.json";
import { abi as pBHD } from "../abi/pBHD.json";
import { abi as presaleAbi} from "../abi/Presale.json"
import { setAll } from "../helpers";

import { createAsyncThunk, createSelector, createSlice } from "@reduxjs/toolkit";
import { Bond, NetworkID } from "src/lib/Bond"; // TODO: this type definition needs to move out of BOND.
import { RootState } from "src/store";
import { IBaseAddressAsyncThunk, ICalcUserBondDetailsAsyncThunk } from "./interfaces";

import { abi as stakingAbi } from '../abi/PVdaoStaking.json'



export const getBalances = createAsyncThunk(
  "account/getBalances",
  async ({ address, networkID, provider }: IBaseAddressAsyncThunk) => {
  
    const XPVContract = new ethers.Contract(addresses[networkID].XPV_ADDRESS as string, ierc20Abi, provider);
    const XPVBalance = await XPVContract.balanceOf(address);
    const sXPVContract = new ethers.Contract(addresses[networkID].SXPV_ADDRESS as string, sBHD, provider);
    const sXPVBalance = await sXPVContract.balanceOf(address);
   // let poolBalance = 0;
    //const poolTokenContract = new ethers.Contract(addresses[networkID].PT_TOKEN_ADDRESS as string, ierc20Abi, provider);
    //poolBalance = await poolTokenContract.balanceOf(address);



    return {
      balances: {
        XPV: ethers.utils.formatUnits(XPVBalance, "gwei"),
        sXPV: ethers.utils.formatUnits(sXPVBalance, "gwei"),
        // pool: ethers.utils.formatUnits(poolBalance, "gwei"),
      },
    };
  },
);

export const loadAccountDetails = createAsyncThunk(
  "account/loadAccountDetails",
  async ({ networkID, provider, address }: IBaseAddressAsyncThunk) => {
    let XPVBalance = 0;
    let sXPVBalance = 0;
    let mimBalance = 0;
    let presaleAllowance = 0;
    let claimAllowance = 0;
    let stakeAllowance = 0;
    let unstakeAllowance = 0;
    let daiBondAllowance = 0;

    
  

    
    const USDC_ADDRESS = new ethers.Contract(addresses[networkID].USDC_ADDRESS as string, ierc20Abi, provider);
    const usdcBalance = await USDC_ADDRESS.balanceOf(address);
    
    const mimContract = new ethers.Contract(addresses[networkID].MIM_ADDRESS as string, ierc20Abi, provider);
    mimBalance = await mimContract.balanceOf(address);


    const XPVContract = new ethers.Contract(addresses[networkID].XPV_ADDRESS as string, pBHD, provider);
    XPVBalance = await XPVContract.balanceOf(address);




    stakeAllowance = await XPVContract.allowance(address, addresses[networkID].STAKING_HELPER_ADDRESS);

    const sXPVContract = new ethers.Contract(addresses[networkID].SXPV_ADDRESS as string, sBHD, provider);

    sXPVBalance = await sXPVContract.balanceOf(address);
    unstakeAllowance = await sXPVContract.allowance(address, addresses[networkID].STAKING_ADDRESS);
 
   // poolAllowance = await sHOMContract.allowance(address, addresses[networkID].PT_PRIZE_POOL_ADDRESS);


    const StakingContract =  new ethers.Contract(addresses[networkID].STAKING_ADDRESS as string, stakingAbi, provider);
    const warmupInfo = await StakingContract.warmupInfo(address);
    const epoch =  await StakingContract.epoch();
    const expiry =warmupInfo.expiry;
    const epochnumber =  epoch.number;
    const depositamount = warmupInfo.deposit;

    
    

    

    return {
      balances: {
        busd: ethers.utils.formatUnits(usdcBalance, 6),
        XPV: ethers.utils.formatUnits(XPVBalance, "gwei"),
        sXPV: ethers.utils.formatUnits(sXPVBalance, "gwei"),
      },
      claim: {
        claimAllowance: +claimAllowance,
      },
      staking: {
        XPVStake: +stakeAllowance,
        XPVUnstake: +unstakeAllowance,
        expiry :  ethers.utils.formatUnits(expiry, 0),
        epochnumber : ethers.utils.formatUnits(epochnumber,0),
        depositamount : ethers.utils.formatUnits(depositamount, 0),
        
      },
      bonding: {
        daiAllowance: daiBondAllowance,
      },
      pooling: {
      },
    };
  },
);



interface IAccountSlice {
  balances: {
    bhd: string;
    sbhd: string;
    pbhd: string;
    dai: string;
    busd: string;
  };
  loading: boolean;
}
const initialState: IAccountSlice = {
  loading: false,
  balances: { bhd: "", sbhd: "", pbhd: "", dai: "", busd: "" },

};



const accountSlice = createSlice({
  name: "account",
  initialState,
  reducers: {
    fetchAccountSuccess(state, action) {
      setAll(state, action.payload);
    },
  },
  extraReducers: builder => {
    builder
      .addCase(loadAccountDetails.pending, state => {
        state.loading = true;
      })
      .addCase(loadAccountDetails.fulfilled, (state, action) => {
        setAll(state, action.payload);
        state.loading = false;
      })
      .addCase(loadAccountDetails.rejected, (state, { error }) => {
        state.loading = false;
        console.log(error);
      })
      .addCase(getBalances.pending, state => {
        state.loading = true;
      })
      .addCase(getBalances.fulfilled, (state, action) => {
        setAll(state, action.payload);
        state.loading = false;
      })
      .addCase(getBalances.rejected, (state, { error }) => {
        state.loading = false;
        console.log(error);
      })
  }
});

export default accountSlice.reducer;

export const { fetchAccountSuccess } = accountSlice.actions;

const baseInfo = (state: RootState) => state.account;

export const getAccountState = createSelector(baseInfo, account => account);
