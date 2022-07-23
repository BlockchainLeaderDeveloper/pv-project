import { useCallback, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  Box,
  Button,
  FormControl,
  Grid,
  InputAdornment,
  InputLabel,
  Link,
  OutlinedInput,
  Paper,
  Tab,
  Tabs,
  Typography,
  Zoom,
} from "@material-ui/core";
import NewReleases from "@material-ui/icons/NewReleases";
import RebaseTimer from "../../components/RebaseTimer/RebaseTimer";
import ClaimTimer from "../../components/RebaseTimer/ClaimTimer";
import TabPanel from "../../components/TabPanel";
import { getBhdTokenImage, getTokenImage, trim } from "../../helpers";
import { changeApproval, changeStake } from "../../slices/StakeThunk";
import useMediaQuery from "@material-ui/core/useMediaQuery";
import "./stake.scss";
import { useWeb3Context } from "src/hooks/web3Context";
import { isPendingTxn, txnButtonText } from "src/slices/PendingTxnsSlice";
import { Skeleton } from "@material-ui/lab";
import ExternalStakePool from "./ExternalStakePool";
import { error, info, notice } from "../../slices/MessagesSlice";
import { ethers, BigNumber } from "ethers";
import { fetchAccountSuccess } from "src/slices/AccountSlice";

function a11yProps(index) {
  return {
    id: `simple-tab-${index}`,
    "aria-controls": `simple-tabpanel-${index}`,
  };
}


function Stake() {
  const dispatch = useDispatch();

  const { provider, address, connected, connect, chainID } = useWeb3Context();

  const [zoomed, setZoomed] = useState(false);
  const [view, setView] = useState(0);
  const view1 = 0;
  const [quantity, setQuantity] = useState("");
  const [oldquantity, setOldQuantity] = useState("");

  const isAppLoading = useSelector(state => state.app.loading);
  const currentIndex = useSelector(state => {
    return state.app.currentIndex;
  });
  const fiveDayRate = useSelector(state => {
    return state.app.fiveDayRate;
  });
  const oldfiveDayRate = useSelector(state => {
    return state.app.old_fiveDayRate;
  });
  const XPVBalance = useSelector(state => {
    return state.account.balances && state.account.balances.XPV;
  });

  const sXPVBalance = useSelector(state => {
    return state.account.balances && state.account.balances.sXPV;
  });
  const oldsXPVBalance = useSelector(state => {
    return state.account.balances && state.account.balances.oldsXPV;
  });
  const wsXPVBalance = useSelector(state => {
    return state.account.balances && state.account.balances.wsXPV;
  });
  const stakeAllowance = useSelector(state => {
    return state.account.staking && state.account.staking.XPVStake;
  });
  const unstakeAllowance = useSelector(state => {
    return state.account.staking && state.account.staking.XPVUnstake;
  });
  // const oldunstakeAllowance = useSelector(state => {
  //   return state.account.staking && state.account.staking.oldhecUnstake;
  // });

  const expiry = useSelector(state => {
    return state.account.staking && state.account.staking.expiry;
  })

  const epochnumber = useSelector(state => {
    return state.account.staking && state.account.staking.epochnumber;
  })
  const depositamount = useSelector(state => {
    return state.account.staking && state.account.staking.depositamount;
  })

  const stakingRebase = useSelector(state => {
    return state.app.stakingRebase;
  });
  const oldstakingRebase = useSelector(state => {
    return state.app.old_stakingRebase;
  });
  const stakingAPY = useSelector(state => {
    return state.app.stakingAPY;
  });
  const stakingTVL = useSelector(state => {
    return state.app.stakingTVL;
  });
  const pendingTransactions = useSelector(state => {
    return state.pendingTransactions;
  });

  const maxamount = ((((100 - (depositamount) / 1000000000 - sXPVBalance) * 100).toFixed(0)) / 100).toString();

  const setMax = () => {
    if (view === 0) {
      setQuantity(XPVBalance);
    } else {
      setQuantity(sXPVBalance);
    }
  };
  const setOldMax = () => {
    setOldQuantity(oldsXPVBalance);
  };

  const onSeekApproval = async token => {
    await dispatch(changeApproval({ address, token, provider, networkID: chainID }));
  };
  const consoletime = <ClaimTimer />;
  //"You will be able to unstake your "+(depositamount * 10) / 10000000000+" amount of tokens in next rebase" 
  const onClaim = async token => {

    if (parseInt(expiry) > parseInt(epochnumber) && depositamount > 0) {
      return dispatch(notice(consoletime));

    }
    await dispatch(claimspXPV({ address, token, provider, networkID: chainID }));
  };

  const onChangeStake = async (action, isOld) => {
    // eslint-disable-next-line no-restricted-globals
    let value, unstakedVal;
    value = quantity;
    unstakedVal = sXPVBalance;
    if (isNaN(value) || value === 0 || value === "") {
      // eslint-disable-next-line no-alert
      return dispatch(error("Please enter a value!"));
    }

    // 1st catch if quantity > balance
    let gweiValue = ethers.utils.parseUnits(value, "gwei");
    if (action === "stake" && gweiValue.gt(ethers.utils.parseUnits(XPVBalance, "gwei"))) {
      return dispatch(error("You cannot stake more than your XPV balance."));
    }
    if (action === "unstake" && gweiValue.gt(ethers.utils.parseUnits(unstakedVal, "gwei"))) {
      return dispatch(error("You cannot unstake more than your sXPV balance."));
    }

    await dispatch(
      changeStake({
        address,
        action,
        value: value.toString(),
        provider,
        networkID: chainID,
        callback: () => setQuantity(""),
      }),
    );
  };

  const hasAllowance = useCallback(
    token => {
      if (token === "XPV") return stakeAllowance > 0;
      if (token === "sXPV") return unstakeAllowance > 0;
      if (token === "oldsXPV") return oldunstakeAllowance > 0;
      return 0;
    },
    [stakeAllowance, unstakeAllowance],
  );

  const isAllowanceDataLoading = (stakeAllowance == null && view === 0) || (unstakeAllowance == null && view === 1);

  let modalButton = [];

  modalButton.push(
    <Button variant="contained" color="primary" className="connect-button" onClick={connect} key={1}>
      Connect Wallet
    </Button>,
  );

  const changeView = (event, newView) => {
    setView(newView);
  };

  const trimmedBalance = Number(
    [sXPVBalance, wsXPVBalance]
      .filter(Boolean)
      .map(balance => Number(balance))
      .reduce((a, b) => a + b, 0)
      .toFixed(4),
  );
  const oldtrimmedBalance = Number(
    [oldsXPVBalance, wsXPVBalance]
      .filter(Boolean)
      .map(balance => Number(balance))
      .reduce((a, b) => a + b, 0)
      .toFixed(4),
  );
  const trimmedStakingAPY =
    stakingAPY > 100000000 ? parseFloat(stakingAPY * 100).toExponential(1) : trim(stakingAPY * 100, 1);
  const stakingRebasePercentage = trim(stakingRebase * 100, 4);
  const oldstakingRebasePercentage = trim(oldstakingRebase * 100, 4);
  const nextRewardValue = trim((stakingRebasePercentage / 100) * trimmedBalance, 4);
  const oldnextRewardValue = trim((oldstakingRebasePercentage / 100) * oldtrimmedBalance, 4);
  return (
    <>
      <div id="stake-view" container='true'>

        <Zoom in={true} onEntered={() => setZoomed(true)}>
          <>

            <Paper className={`ohm-card`}>
              <Grid container='true' direction="column" spacing={2}>
                <Grid item style={{ "display": "flex", "margin": "auto"}}>
                  <div className="card-header" style={{ "margin-top": "10px" }}>
                    <Typography variant="h5" style={{ 'font-size': '36px' }}>Staking Dashboard</Typography>
                    <RebaseTimer />

                    {address && oldsXPVBalance > 0.01 && (
                      <Link
                        className="migrate-sohm-button"
                        style={{ textDecoration: "none" }}
                        href="FIXME"
                        aria-label="migrate-sohm"
                        target="_blank"
                      >
                        <NewReleases viewBox="0 0 24 24" />
                        <Typography>Migrate sXPV!</Typography>
                      </Link>
                    )}
                  </div>
                </Grid>

                <Grid item>
                  <div className="stake-top-metrics">
                    <Grid container='true' spacing={2} alignItems="flex-end">
                      <Grid item xs={12} sm={4} md={4} lg={4}>
                        <div className="stake-apy">
                          <Typography variant="h4" color="textSecondary">
                            APY
                          </Typography>
                          <Typography variant="h4" style={{ 'color': 'white' }}>

                            {stakingAPY ? (new Intl.NumberFormat().format(Math.floor(trimmedStakingAPY)) + '%') : <Skeleton width="150px" />}
                          </Typography>
                        </div>
                      </Grid>

                      <Grid item xs={12} sm={4} md={4} lg={4}>
                        <div className="stake-tvl">
                          <Typography variant="h4" color="textSecondary">
                            Total Value Deposited
                          </Typography>
                          <Typography variant="h4" style={{ "color": "white" }}>
                            {stakingTVL ? (
                              new Intl.NumberFormat("en-US", {
                                style: "currency",
                                currency: "USD",
                                maximumFractionDigits: 0,
                                minimumFractionDigits: 0,
                              }).format(stakingTVL)
                            ) : (
                              <Skeleton width="150px" />
                            )}
                          </Typography>
                        </div>
                      </Grid>

                      <Grid item xs={12} sm={4} md={4} lg={4}>
                        <div className="stake-index">
                          <Typography variant="h4" color="textSecondary">
                            Current Index
                          </Typography>
                          <Typography variant="h4" style={{ "color": "white" }}>
                            {currentIndex ? <>{trim(currentIndex, 1)} XPV</> : <Skeleton width="150px" />}
                          </Typography>
                        </div>
                      </Grid>
                    </Grid>
                  </div>
                </Grid>

                <div className="staking-area">
                  {!address ? (
                    <div className="stake-wallet-notification">
                      <div className="wallet-menu" id="wallet-menu">
                        {modalButton}
                      </div>
                      <Typography variant="h6">Connect your wallet to stake XPV</Typography>
                    </div>
                  ) : (
                    <>
                      <Box className="stake-action-area">
                        <Tabs
                          key={String(zoomed)}
                          centered
                          value={view}
                          textColor="primary"
                          indicatorColor="primary"
                          className="stake-tab-buttons"
                          onChange={changeView}
                          aria-label="stake tabs"
                        >
                          <Tab label="Stake" {...a11yProps(0)} />
                          <Tab label="Unstake" {...a11yProps(1)} />
                        </Tabs>

                        <Box container="true" className="stake-action-row " display="flex" alignItems="center">
                          {address && !isAllowanceDataLoading ? (
                            (!hasAllowance("XPV") && view === 0) || (!hasAllowance("sXPV") && view === 1) ? (
                              <Box className="help-text">
                                <Typography variant="body1" className="stake-note" color="textSecondary">
                                  {view === 0 ? (
                                    <>
                                      First time staking <b>XPV</b>?
                                      <br />
                                      Please approve XPV to use your <b>XPV</b> for staking.
                                    </>
                                  ) : (
                                    <>
                                      First time unstaking <b>sXPV</b>?
                                      <br />
                                      Please approve XPV to use your <b>sXPV</b> for unstaking.
                                    </>
                                  )}
                                </Typography>
                              </Box>
                            ) : (
                              <FormControl className="ohm-input" variant="outlined" color="primary" style={{ backgroundColor: 'white', paddingTop: '0.2px', borderRadius:'4px' }}>
                                <InputLabel htmlFor="amount-input" ></InputLabel>
                                <OutlinedInput
                                  style={{ 'margin': '1px', 'border': '1px solid', borderColor: 'black', 'color': 'black'}}
                                  id="amount-input"
                                  type="number"
                                  placeholder="Enter an amount"
                                  className="stake-input"
                                  value={quantity}
                                  onChange={e => setQuantity(e.target.value)}
                                  labelWidth={0}
                                  endAdornment={
                                    <InputAdornment position="end">
                                      <Button variant="text" onClick={setMax} color="default" style={{ 'color': 'black', 'font-weight': '900' }}>
                                        Max
                                      </Button>
                                    </InputAdornment>
                                  }
                                />
                              </FormControl>
                            )
                          ) : (
                            <Skeleton width="150px" />
                          )}

                          <TabPanel value={view} index={0} className="stake-tab-panel">
                            {isAllowanceDataLoading ? (
                              <Skeleton />
                            ) : address && hasAllowance("XPV") ? (
                              <Button
                                className="stake-button"
                                variant="contained"
                                color="primary"
                                style={{'border':'1px solid white'}}
                                disabled={isPendingTxn(pendingTransactions, "staking")}
                                onClick={() => {
                                  onChangeStake("stake", false);
                                }}
                              >
                                {txnButtonText(pendingTransactions, "staking", "Stake XPV")}
                              </Button>
                            ) : (
                              <Button
                                className="stake-button"
                                variant="contained"
                                color="primary"
                                style={{'border':'1px solid white'}}
                                disabled={isPendingTxn(pendingTransactions, "approve_staking")}
                                onClick={() => {
                                  onSeekApproval("XPV");
                                }}
                              >
                                {txnButtonText(pendingTransactions, "approve_staking", "Approve")}
                              </Button>
                            )}
                          </TabPanel>
                          <TabPanel value={view} index={1} className="stake-tab-panel">
                            {isAllowanceDataLoading ? (
                              <Skeleton />
                            ) : address && hasAllowance("sXPV") ? (
                              <Button
                                className="stake-button"
                                variant="contained"
                                color="primary"
                                style={{'border':'1px solid white', 'backgroundColor':'#008000'}}
                                disabled={isPendingTxn(pendingTransactions, "unstaking")}
                                onClick={() => {
                                  onChangeStake("unstake", false);
                                }}
                              >
                                {txnButtonText(pendingTransactions, "unstaking", "Unstake XPV")}
                              </Button>
                            ) : (
                              <Button
                                className="stake-button"
                                variant="contained"
                                color="primary"
                                style={{'border':'1px solid white', 'backgroundColor':'#008000',}}
                                disabled={isPendingTxn(pendingTransactions, "approve_unstaking")}
                                onClick={() => {
                                  onSeekApproval("sXPV");
                                }}
                              >
                                {txnButtonText(pendingTransactions, "approve_unstaking", "Approve")}
                              </Button>
                            )}
                          </TabPanel>
                        </Box>
                      </Box>

                      <div className={`stake-user-data`}>
                        <div className="data-row">
                          <Typography variant="body1">Your Balance</Typography>
                          <Typography variant="body1" style={{ "color": "white", "font-size": "24px" }}>
                            {isAppLoading ? <Skeleton width="80px" /> : <>{trim(XPVBalance, 4)} XPV</>}
                          </Typography>
                        </div>

                        <div className="data-row">
                          <Typography variant="body1">Your Staked Balance</Typography>
                          <Typography variant="body1" style={{ "color": "white", "font-size": "24px" }}>
                            {isAppLoading ? <Skeleton width="80px" /> : <>{trimmedBalance} sXPV</>}
                          </Typography>
                        </div>

                        <div className="data-row">
                          <Typography variant="body1">Next Reward Amount</Typography>
                          <Typography variant="body1" style={{ "color": "white", "font-size": "24px" }}>
                            {isAppLoading ? <Skeleton width="80px" /> : <>{nextRewardValue} sXPV</>}
                          </Typography>
                        </div>

                        <div className="data-row">
                          <Typography variant="body1">Next Reward Yield</Typography>
                          <Typography variant="body1" style={{ "color": "white", "font-size": "24px" }}>
                            {isAppLoading ? <Skeleton width="80px" /> : <>{stakingRebasePercentage}%</>}
                          </Typography>
                        </div>

                        <div className="data-row">
                          <Typography variant="body1">ROI (5-Day Rate)</Typography>
                          <Typography variant="body1" style={{ "color": "white", "font-size": "24px" }}>
                            {isAppLoading ? <Skeleton width="80px" /> : <>{trim(fiveDayRate * 100, 4)}%</>}
                          </Typography>
                        </div>
                      </div>
                      
                    </>
                  )}
                </div>
              </Grid>
            </Paper>
          </>
        </Zoom>
      </div>
    </>
  );
}

export default Stake;
