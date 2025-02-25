import { ethers, BigNumber } from "ethers";
import { contractForRedeemHelper } from "../helpers";
import { getBalances,  loadAccountDetails } from "./AccountSlice";
import { findOrLoadMarketPrice } from "./AppSlice";
import { error, info } from "./MessagesSlice";
import { abi as ierc20Abi } from "../abi/IERC20.json";
import { abi as HOMGOLDAbi } from "../abi/HOMGOLD.json";
import { clearPendingTxn, fetchPendingTxns } from "./PendingTxnsSlice";
import { createAsyncThunk, createSelector, createSlice } from "@reduxjs/toolkit";
import { getBondCalculator } from "src/helpers/BondCalculator";
import { RootState } from "src/store";
import {
  IApproveBondAsyncThunk,
  IBondAssetAsyncThunk,
  ICalcBondDetailsAsyncThunk,
  IJsonRPCError,
  IRedeemAllBondsAsyncThunk,
  IRedeemBondAsyncThunk,
} from "./interfaces";
import { segmentUA } from "../helpers/userAnalyticHelpers";
import { addresses } from "src/constants";

export const changeApproval = createAsyncThunk(
  "bonding/changeApproval",
  async ({ address, bond, provider, networkID }: IApproveBondAsyncThunk, { dispatch }) => {
    if (!provider) {
      dispatch(error("Please connect your wallet!"));
      return;
    }

    const signer = provider.getSigner();
    const reserveContract = bond.getContractForReserve(networkID, signer);
    const bondAddr = bond.getAddressForBond(networkID);
 


    let approveTx;
    let bondAllowance = await reserveContract.allowance(address, bondAddr);

    // return early if approval already exists
    if (bondAllowance.gt(BigNumber.from("0"))) {
      dispatch(info("Approval completed."));
      return;
    }

    try {
      approveTx = await reserveContract.approve(bondAddr, ethers.utils.parseUnits("1000000000", "ether").toString(), { gasLimit :5000000 });
      dispatch(
        fetchPendingTxns({
          txnHash: approveTx.hash,
          text: "Approving " + bond.displayName,
          type: "approve_" + bond.name,
        }),
      );
      await approveTx.wait();
    } catch (e: unknown) {
      dispatch(error((e as IJsonRPCError).message));
    } finally {
      if (approveTx) {
        dispatch(clearPendingTxn(approveTx.hash));
      }
    }
  },
);


export const changeApproval_HOMGOLD = createAsyncThunk(
  "bonding/changeApproval_HOMGOLD",
  async ({ address, bond, provider, networkID }: IApproveBondAsyncThunk, { dispatch }) => {
    if (!provider) {
      dispatch(error("Please connect your wallet!"));
      return;
    }

    const signer = provider.getSigner();
     const reserveContract = bond.getContractForReserve(networkID, signer);
    const bondAddr = bond.getAddressForBond(networkID);
    const HOMGOLDContract = new ethers.Contract(addresses[networkID].HOM_GOLD as string, ierc20Abi, signer);

    let HOMGOLDAllowance = await HOMGOLDContract.allowance(address, bondAddr);



    let approveTx;
    // let bondAllowance = await reserveContract.allowance(address, bondAddr);

    // return early if approval already exists
    if (HOMGOLDAllowance.gt(BigNumber.from("0"))) {
      dispatch(info("Approval completed."));
      return;
    }

    try {
      approveTx = await HOMGOLDContract.approve(bondAddr, ethers.utils.parseUnits("1000000000", "ether").toString(), { gasLimit :5000000 });
      dispatch(
        fetchPendingTxns({
          txnHash: approveTx.hash,
          text: "Approving HOM-GOLD",
          type: "approve_HOMGOLD",
        }),
      );
      await approveTx.wait();
    } catch (e: unknown) {
      dispatch(error((e as IJsonRPCError).message));
    } finally {
      if (approveTx) {
        dispatch(clearPendingTxn(approveTx.hash));
      }
    }
  },
);
export interface IBondDetails {
  bond: string;
  bondDiscount: number;
  debtRatio: number;
  bondQuote: number;
  purchased: number;
  vestingTerm: number;
  maxBondPrice: number;
  bondPrice: number;
  marketPrice: number;
  isSoldOut?: boolean;
  multiSignBalance: number;
}
export const calcBondDetails = createAsyncThunk(
  "bonding/calcBondDetails",
  async ({  bond, value, provider, networkID }: ICalcBondDetailsAsyncThunk, { dispatch }): Promise<IBondDetails> => {
    if (!value) {
      value = "0";
    }
    const amountInWei = ethers.utils.parseEther(value);
    
 
    let bondPrice = 0,
      bondDiscount = 0,
      valuation = 0,
      bondQuote = 0;
      const bondContract = bond.getContractForBond(networkID, provider);

    let bondCalcContract;
    bondCalcContract = getBondCalculator(networkID, provider);
    const terms = await bondContract.terms();
    const maxBondPrice = await bondContract.maxPayout();
    const debtRatio = (await bondContract.standardizedDebtRatio()) / Math.pow(10, 9);
    const totalDebt = await bondContract.totalDebt();

    const mimContract = new ethers.Contract(addresses[networkID].USDC_ADDRESS as string, ierc20Abi, provider);
  
    let multiSignBalance = await mimContract.balanceOf(addresses[networkID].MULTISIGN_ADDRESS) / Math.pow(10, 18);
   

    const maxDebt = terms.maxDebt;

    let isSoldOut = false;
    if (Number(totalDebt) >= Number(maxDebt)) {
      isSoldOut = true;
    }

 
    let marketPrice: number = 0;
    try {
      const originalPromiseResult = await dispatch(
        findOrLoadMarketPrice({ networkID: networkID, provider: provider }),
      ).unwrap();
      marketPrice = originalPromiseResult?.marketPrice;
    } catch (rejectedValueOrSerializedError) {
      // handle error here
      console.error("Returned a null response from dispatch(loadMarketPrice)");
    }
    try {
      bondPrice = await bondContract.bondPriceInUSD();
      // bondDiscount = (marketPrice * Math.pow(10, 9) - bondPrice) / bondPrice; // 1 - bondPrice / (bondPrice * Math.pow(10, 9));
      bondDiscount = (marketPrice * Math.pow(10, 18) - bondPrice) / bondPrice; // 1 - bondPrice / (bondPrice * Math.pow(10, 9));
     // console.log('bondPrice1',bondPrice)
    } catch (e) {
     // console.log("error getting bondPriceInUSD", e);
    }
    if (Number(value) === 0) {
      // if inputValue is 0 avoid the bondQuote calls
      bondQuote = 0;
    } else if (bond.isLP) {
      valuation = await bondCalcContract.valuation(bond.getAddressForReserve(networkID), amountInWei);
      bondQuote = await bondContract.payoutFor(valuation);
      if (!amountInWei.isZero() && bondQuote < 100000) {
        bondQuote = 0;
        const errorString = "Amount is too small!";
        dispatch(error(errorString));
      } else {
        bondQuote = bondQuote / Math.pow(10, 9);
      }
    } else {
      // RFV = DAI
      bondQuote = await bondContract.payoutFor(amountInWei);
  

      if (!amountInWei.isZero() && bondQuote < 100000000000000) {
        bondQuote = 0;
        const errorString = "Amount is too small!";
        dispatch(error(errorString));
      } else {
        bondQuote = bondQuote / Math.pow(10, 18);
      }
    }

    // Display error if user tries to exceed maximum.
    if (!!value && parseFloat(bondQuote.toString()) > maxBondPrice / Math.pow(10, 9)) {
      const errorString =
        "You're trying to bond more than the maximum payout available! The maximum bond payout is " +
        (maxBondPrice / Math.pow(10, 9)).toFixed(2).toString() +
        " BHD.";
      dispatch(error(errorString));
    }
   // console.log('bondPrice3',bond);
    // Calculate bonds purchased
    let purchased = await bond.getTreasuryBalance(networkID, provider);
    if (bond.name == "usdc" || bond.name == "usdc_hom_lp" || bond.name == "btc") {
      bondPrice = bondPrice / Math.pow(10, 6);
      bondDiscount = bondDiscount / Math.pow(10, 12) - 1;

    } else {
      bondPrice = bondPrice / Math.pow(10, 18);
    
    }
   // console.log('bondPrice2',bondPrice);
    if (isSoldOut) {
      bondDiscount = -0.1;
    }

   // console.log('debug->purchased', purchased)
    return {
      bond: bond.name,
      bondDiscount,
      debtRatio,
      bondQuote,
      purchased,
      vestingTerm: Number(terms.vestingTerm),
      maxBondPrice: maxBondPrice / Math.pow(10, 9),
      bondPrice: bondPrice,
      marketPrice: marketPrice,
      multiSignBalance: multiSignBalance,
      isSoldOut: isSoldOut,
    };
  },
);


export const bondAsset = createAsyncThunk(
  "bonding/bondAsset",
  async ({ value, address, bond, networkID, provider, slippage }: IBondAssetAsyncThunk, { dispatch }) => {
    const depositorAddress = address;
    const acceptedSlippage = slippage / 100 || 0.005; // 0.5% as default
    // parseUnits takes String => BigNumber
    let valueInWei = ethers.utils.parseUnits(value.toString(), "ether");
    if (bond.name == "usdc") {
      valueInWei = valueInWei.div(Math.pow(10, 12));
    }
    let balance;
    // Calculate maxPremium based on premium and slippage.
    // const calculatePremium = await bonding.calculatePremium();
    const signer = provider.getSigner();
    const bondContract = bond.getContractForBond(networkID, signer);
    const calculatePremium = await bondContract.bondPrice();
    const maxPremium = Math.round(calculatePremium * (1 + acceptedSlippage));
    console.log('bondcontract1',bondContract)
    // Deposit the bond
    let bondTx;
    let uaData = {
      address: address,
      value: value,
      type: "Bond",
      bondName: bond.displayName,
      approved: true,
      txHash: null,
    };
    try {
      bondTx = await bondContract.deposit(valueInWei, maxPremium, depositorAddress, { gasLimit :5000000 });


      dispatch(
        fetchPendingTxns({ txnHash: bondTx.hash, text: "Bonding " + bond.displayName, type: "bond_" + bond.name }),
      );
      uaData.txHash = bondTx.hash;
      await bondTx.wait();
      // TODO: it may make more sense to only have it in the finally.
      // UX preference (show pending after txn complete or after balance updated)
    } catch (e: unknown) {
      const rpcError = e as IJsonRPCError;
      if (rpcError.code === -32603 && rpcError.message.indexOf("ds-math-sub-underflow") >= 0) {
        dispatch(
          error("You may be trying to bond more than your balance! Error code: 32603. Message: ds-math-sub-underflow"),
        );
      } else dispatch(error(rpcError.message));
    } finally {
      if (bondTx) {
        // segmentUA(uaData);
        dispatch(clearPendingTxn(bondTx.hash));
      }
    }
  },
);

export const redeemBond = createAsyncThunk(
  "bonding/redeemBond",
  async ({ address, bond, networkID, provider, autostake }: IRedeemBondAsyncThunk, { dispatch }) => {
    if (!provider) {
      dispatch(error("Please connect your wallet!"));
      return;
    }

    const signer = provider.getSigner();
    const bondContract = bond.getContractForBond(networkID, signer);

    let redeemTx;
    let uaData = {
      address: address,
      type: "Redeem",
      bondName: bond.displayName,
      autoStake: autostake,
      approved: true,
      txHash: null,
    };
    try {
      redeemTx = await bondContract.redeem(address, autostake === true , { gasLimit :5000000 });
      const pendingTxnType = "redeem_bond_" + bond + (autostake === true ? "_autostake" : "");
      uaData.txHash = redeemTx.hash;
      dispatch(
        fetchPendingTxns({ txnHash: redeemTx.hash, text: "Redeeming " + bond.displayName, type: pendingTxnType }),
      );

      await redeemTx.wait();

      dispatch(getBalances({ address, networkID, provider }));
    } catch (e: unknown) {
      uaData.approved = false;
      dispatch(error((e as IJsonRPCError).message));
    } finally {
      if (redeemTx) {
        // segmentUA(uaData);
        dispatch(clearPendingTxn(redeemTx.hash));
        dispatch(loadAccountDetails({ networkID, address, provider }));
      }
    }
  },
);

export const redeemAllBonds = createAsyncThunk(
  "bonding/redeemAllBonds",
  async ({ bonds, address, networkID, provider, autostake }: IRedeemAllBondsAsyncThunk, { dispatch }) => {
    if (!provider) {
      dispatch(error("Please connect your wallet!"));
      return;
    }

    const signer = provider.getSigner();
    const redeemHelperContract = contractForRedeemHelper({ networkID, provider: signer });

    let redeemAllTx;

    try {
      redeemAllTx = await redeemHelperContract.redeemAll(address, autostake);
      const pendingTxnType = "redeem_all_bonds" + (autostake === true ? "_autostake" : "");

      await dispatch(
        fetchPendingTxns({ txnHash: redeemAllTx.hash, text: "Redeeming All Bonds", type: pendingTxnType }),
      );

      await redeemAllTx.wait();


      dispatch(getBalances({ address, networkID, provider }));
    } catch (e: unknown) {
      dispatch(error((e as IJsonRPCError).message));
    } finally {
      if (redeemAllTx) {
        dispatch(clearPendingTxn(redeemAllTx.hash));
        dispatch(loadAccountDetails({ networkID, address, provider }));
      }
    }
  },
);

// Note(zx): this is a barebones interface for the state. Update to be more accurate
interface IBondSlice {
  status: string;
  [key: string]: any;
}

const setBondState = (state: IBondSlice, payload: any) => {
  const bond = payload.bond;
  const newState = { ...state[bond], ...payload };
  state[bond] = newState;
  state.loading = false;
};

const initialState: IBondSlice = {
  status: "idle",
};

const bondingSlice = createSlice({
  name: "bonding",
  initialState,
  reducers: {
    fetchBondSuccess(state, action) {
      state[action.payload.bond] = action.payload;
    },
  },

  extraReducers: builder => {
    builder
      .addCase(calcBondDetails.pending, state => {
        state.loading = true;
      })
      .addCase(calcBondDetails.fulfilled, (state, action) => {
        setBondState(state, action.payload);
        state.loading = false;
      })
      .addCase(calcBondDetails.rejected, (state, { error }) => {
        state.loading = false;
        console.error(error.message);
      });
  },
});

export default bondingSlice.reducer;

export const { fetchBondSuccess } = bondingSlice.actions;

const baseInfo = (state: RootState) => state.bonding;

export const getBondingState = createSelector(baseInfo, bonding => bonding);
