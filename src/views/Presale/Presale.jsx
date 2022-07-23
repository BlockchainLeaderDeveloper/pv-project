import { useCallback, useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import TabPanel from "../../components/TabPanel";
import { changeApproval, changeDeposit } from "../../slices/PresaleThunk";
import { useWeb3Context } from "src/hooks/web3Context";
import { formatCurrency } from "../../helpers";
import { isPendingTxn, txnButtonText } from "src/slices/PendingTxnsSlice";
import {
  Paper,
  Grid,
  Typography,
  Box,
  Zoom,
  Button,
  FormControl,
  InputLabel,
  OutlinedInput,
  InputAdornment,
} from "@material-ui/core";
import { trim } from "../../helpers";
import "./presale.scss";
import { Skeleton } from "@material-ui/lab";
import { error } from "../../slices/MessagesSlice";
import { ethers, BigNumber } from "ethers";


function Presale() {
  const dispatch = useDispatch();
  const { provider, address, connected, connect, chainID } = useWeb3Context();
  const [quantity, setQuantity] = useState("");
  const pendingTransactions = useSelector(state => {
    return state.pendingTransactions;
  });

  const mimBalance = useSelector(state => {
    return state.account.balances && state.account.balances.busd;
  });





  const onSeekApproval = async token => {
    await dispatch(changeApproval({ address, token, provider, networkID: chainID }));
  };


  const presaleAllowance = useSelector(state => {
    return state.account.presale && state.account.presale.presaleAllowance;
  });

  const tokenPrice = useSelector(state => {
    return state.account.presale && state.account.presale.tokenPrice;
  });

  const statusPresale = useSelector(state => {
    return state.account.presale && state.account.presale.presaleStatus;
  });

  const minCap = useSelector(state => {
    return state.account.presale && state.account.presale.minCap;
  });

  const cap = useSelector(state => {
    return state.account.presale && state.account.presale.cap;
  });

  const whitelist = useSelector(state => {
    return state.account.presale && state.account.presale.whitelistAddress;
  });


  const remainingAmount = useSelector(state => {
    return state.account.presale && state.account.presale.remainingAmount;
  });

  const setMax = () => {

    if (parseFloat(mimBalance) > parseFloat(remainingAmount)) {
      setQuantity(remainingAmount)
    }
    else {
      setQuantity(mimBalance);
    }
  };

  const onChangeDeposit = async action => {
    // eslint-disable-next-line no-restricted-globals
    if (isNaN(quantity) || quantity === 0 || quantity === "") {
      // eslint-disable-next-line no-alert
      return dispatch(error("Please enter a value!"));
    }


    // 1st catch if quantity > balance
    let usdcquantity = ethers.utils.formatUnits(quantity * 1000000, 18);
    let gweiValue = ethers.utils.parseUnits(usdcquantity, "ether");



    if (action === "presale" && gweiValue.gt(ethers.utils.parseUnits(mimBalance, "ether"))) {
      return dispatch(error("You cannot deposit more than your USDC balance."));
    }
    await dispatch(changeDeposit({ address, action, value: usdcquantity.toString(), provider, networkID: chainID }));
  };
  const hasAllowance = useCallback(
    token => {
      if (token === "mim") return presaleAllowance > 0;
      return 0;
    },
    [presaleAllowance],
  );
  const isAllowanceDataLoading = presaleAllowance == null;




  return (
    <div id="dashboard-view">
      <div className="card-header-first" >
        <Typography variant="h2" style={{ 'font-size': '56px', 'padding': '30px' }}>Contribution</Typography>
      </div>
      {whitelist ? (
        <>
          <Paper className={`ohm-card`} style={{ 'margin-top': '10px' }} >
            <Grid container direction="column" spacing={2} >
              <Grid item style={{ "display": "flex", "margin": "auto", "padding-right": "100px" }}>
                <img src="/images/presale-token.png" style={{ "width": "80px", "margin-right": "30px" }}></img>
                <div className="card-header" style={{ "margin-top": "10px" }}>

                  <Typography variant="h5" >To Make a Contribution</Typography>
                  {statusPresale}
                </div>
              </Grid>
              <Grid item>
                <div className="stake-top-metrics">
                  <Grid container spacing={2} alignItems="flex-end">
                    <Grid item xs={12} sm={6} md={6} lg={6}>
                      <div className="stake-apy">
                        <Typography variant="h5" color="textSecondary">
                          Min Amount
                        </Typography>
                        {minCap ? (
                          <Typography variant="h4" color="textSecondary">
                            {formatCurrency(minCap, 0)}
                          </Typography>
                        ) : (
                          <Skeleton width="80%" />
                        )
                        }
                      </div>
                    </Grid>
                    <Grid item xs={12} sm={6} md={6} lg={6}>
                      <div className="stake-apy">
                        <Typography variant="h5" color="textSecondary">
                          Limit per User
                        </Typography>
                        {cap ? (
                          <Typography variant="h4" color="textSecondary">
                            {formatCurrency(cap, 0)}
                          </Typography>
                        ) : (
                          <Skeleton width="80%" />
                        )
                        }
                      </div>
                    </Grid>
                    <Grid item xs={12} sm={6} md={6} lg={6}>
                      <div className="stake-apy">
                        <Typography variant="h5" color="textSecondary">
                          Remaining amount
                        </Typography>
                        {remainingAmount ? (
                          <Typography variant="h4" color="textSecondary">
                            {formatCurrency(remainingAmount, 0)}
                          </Typography>
                        ) : (
                          <Skeleton width="80%" />
                        )
                        }
                      </div>
                    </Grid>
                    <Grid item xs={12} sm={6} md={6} lg={6}>
                      <div className="stake-apy">
                        <Typography variant="h5" color="textSecondary">
                          pHOM Price
                        </Typography>
                        {tokenPrice ? (
                          <Typography variant="h4" color="textSecondary">
                            {tokenPrice === 0 ? "0" : formatCurrency(tokenPrice, 3)}
                          </Typography>
                        ) : (
                          <Skeleton width="80%" />
                        )
                        }
                        {/* <Typography variant="h4" color="textSecondary">
                         {tokenPrice === 0 ? "N/A" : tokenPrice}
                       </Typography> */}
                      </div>
                    </Grid>
                  </Grid>
                </div>
              </Grid>
              <Grid item>
                <div className="stake-top-metrics" style={{ whiteSpace: "normal" }}>
                  <Grid container spacing={1} alignItems="center" justifyContent="center">
                    {address && !isAllowanceDataLoading ? (
                      !hasAllowance("mim") ? (
                        <Box className="help-text">
                          <Typography variant="body1" className="stake-note" color="textSecondary">
                            <>
                              First time deposit <b>USDC</b>?
                              <br />
                              Please approve HOM DAO to use your <b>USDC</b> for contribute.
                            </>
                          </Typography>
                        </Box>
                      ) : (
                        <>
                          <Grid item xs={12} sm={4} md={4} lg={8} style={{ 'border': 'solid 1px', 'background-color': 'white', 'border-radius': '5px', 'max-width': '50%', 'flex-basis': '66%', 'padding': '1px' }}>
                            <FormControl className="ohm-input" variant="outlined" color="black" style={{ "border": "2px solid black", 'border-color': 'black', 'borderRadius': '3px' }} >
                              <InputLabel htmlFor="amount-input" ></InputLabel>
                              <OutlinedInput style={{ 'color': 'black' }}
                                id="amount-input"
                                type="number"
                                placeholder="Enter an amount"
                                className="stake-input"
                                value={quantity}
                                width="100%"
                                onChange={e => setQuantity(e.target.value)}
                                labelWidth={0}
                                endAdornment={
                                  <InputAdornment position="end" >
                                    <Button variant="text" onClick={setMax} color="#6b03ff" style={{ 'color': 'black', 'font-size': '1rem', 'font-weight': '900' }}>
                                      CONTRIBUTION AMOUNT
                                    </Button>
                                  </InputAdornment>
                                }
                              />
                            </FormControl>
                          </Grid>
                        </>
                      )
                    ) : (
                      <Button
                        className="stake-button"
                        variant="contained"
                        color="primary"
                        disabled={address}
                        onClick={connect}
                      >
                        {address ? "Loading..." : "Connect Wallet"}
                      </Button>
                    )}

                    {isAllowanceDataLoading ? (
                      <></>
                    ) : address && hasAllowance("mim") ? (
                      <>
                        <Grid item xs={12} sm={4} md={4} lg={3}>
                          <Button
                            style={{ 'margin-left': '10px' }}
                            className="stake-button"
                            variant="contained"
                            color="primary"
                            disabled={false}
                            onClick={() => {
                              onChangeDeposit("presale");
                            }}
                          >
                            {txnButtonText(pendingTransactions, "deposit", "Deposit USDC")}
                          </Button>
                        </Grid>
                      </>
                    ) : (
                      <Grid item xs={12} sm={6} md={6} lg={6}>

                        <Button
                          className="stake-button"
                          variant="contained"
                          color="primary"
                          disabled={isPendingTxn(pendingTransactions, "approve_deposit")}
                          onClick={() => {
                            onSeekApproval("mim");
                          }}
                        >

                          {txnButtonText(pendingTransactions, "approve_deposit", "Approve")}
                        </Button>

                      </Grid>
                    )}
                    <Box className="help-text">
                      <Typography variant="body1" className="stake-note" color="textSecondary">
                        <p style={{ 'font-size': '20px' }}>
                          If you are having challenges sending your USDC please email us at <b style={{ 'color': 'rgb(0, 0, 238)' }}>dionysus@homdao.io</b>
                        </p>
                      </Typography>
                    </Box>
                  </Grid>
                </div>
              </Grid>
            </Grid>
          </Paper>
          <Grid item>
            <Grid container spacing={1} alignItems="center" justifyContent="left" style={{ 'margin': 'auto', 'margin-top': '40px', 'width': '80%', 'margin-bottom': '90px' }}>


              <Grid alignItems="center" justifyContent="center" style={{ 'margin': 'auto', 'padding-left': '10px' }}>
                <Typography style={{ 'margin': 'auto', 'font-size': '24px' }} variant="h5"><p>Be sure to have some POLYGON in your Metamask account on the Polygon/MATIC network. The gas fee for this will be about $0.0001 USD</p></Typography>
                <Typography style={{ 'margin': 'auto', }} variant="h6">{"To make a contribution"}</Typography>
                <Typography style={{ 'margin': 'auto', }} variant="h6">{"1 - In the Contribution dashboard, please click on the  CONTRIBUTION AMOUNT field and enter the amount you want to contribute (minimum is $1,000 and maximum is $300,000) and DEPOSIT USDC"}</Typography>
                <Typography style={{ 'margin': 'auto', }} variant="h6">{"2 - You will see a note in MetaMask to approve the transaction"}</Typography>
                <Typography style={{ 'margin': 'auto', }} variant="h6">{"3 - You will see your confirmation in MetaMask Pop-up. Press CONFIRM."}</Typography>

                <Typography style={{ 'margin': 'auto', }} variant="h6">{"4 - Click on the HOM button at the top right corner of the CONTRIBUTE page and then select the Black pHOM token."}</Typography>

                <Typography style={{ 'margin': 'auto', }} variant="h6">{"5 - In your MetaMask wallet Click ADD TOKEN."}</Typography>
                <Typography style={{ 'margin': 'auto', 'margin-left': '20px' }} variant="h6">{"A - You will see your confirmation in MetaMask Pop-up."}</Typography>
                <Typography style={{ 'margin': 'auto', 'margin-left': '20px' }} variant="h6">{"B - Press CONFIRM"}</Typography>

                <Typography style={{ 'margin': 'auto', }} variant="h6">{"6 - Now you should see the pHOM tokens in your MetaMask Wallet under ASSETS."}</Typography>
              </Grid>
              <Grid alignItems="center" justifyContent="center" style={{ 'padding-left': '10px' }}>
                <Typography style={{ 'margin': 'auto', }} variant="h5"><b>Congratulations!</b></Typography>
                <Typography style={{ 'margin': 'auto', }} variant="h6">If you have any questions, please reach out on the Telegram chat line or email <b style={{ 'color': 'rgb(0, 0, 238)' }}>dionysus@homdao.io.</b> We are a volunteer community and will try and respond as soon as we can.</Typography>



              </Grid>
            </Grid>
          </Grid>
        </>

      ) : (
        <Grid container spacing={1} alignItems="center" justifyContent="center" style={{ 'flexDirection': 'column' }}>
          {isAllowanceDataLoading ? (
            <>

              <Paper className={`ohm-card`} style={{ 'margin-top': '10px', 'margin-bottom': '15px', 'width': '100%' }}>

                <Grid item>

                  <Grid container spacing={1} alignItems="center" justifyContent="center">

                    <Typography variant="h6" style={{ 'font-size': '30px', 'font-weight': '200' }}>{"Please connect your wallet"}</Typography>
                    <Grid container spacing={1} alignItems="center" justifyContent="center">
                      <Button
                        className="stake-button"
                        variant="contained"
                        color="primary"
                        disabled={address}
                        onClick={connect}
                        style={{ 'width': '100%', 'margin-top': '30px', 'border-radius': '60px' }}
                      >
                        {address ? "Loading..." : "Connect Wallet"}
                      </Button>
                    </Grid>

                  </Grid>
                </Grid>
              </Paper>
            </>)
            : (
              <>
                <Paper className={`ohm-card`} style={{ 'margin-top': '10px' }}>
                  <Grid item>
                    <Grid container spacing={1} alignItems="center" justifyContent="center" style={{ 'display': 'initial' }}>
                      <Typography variant="h4">{"Your wallet address is not registered in the whitelist address."}</Typography>
                      <Typography variant="h6">{"(If you have already sent an email, please contact us via chat.)"}</Typography>
                      <Grid alignItems="center" justifyContent="center">
                        <a href="https://forms.gle/PFURFMmFHME3FCeN8" target="_blank" style={{ 'color': 'transparent' }}>
                          <Button
                            className="stake-button"
                            variant="contained"
                            color="primary"
                            disabled={false}
                            onClick={connect}
                            style={{ 'margin': '10px', 'width': '60%' }}
                          >
                            {"Register for the Whitelist"}
                          </Button>
                        </a>
                        <a href="https://discord.gg/NccSDMuDxq" target="_blank" style={{ 'color': 'transparent' }}>
                          <Button
                            className="stake-button"
                            variant="contained"
                            color="primary"
                            disabled={false}
                            onClick={connect}
                            style={{ 'margin': '40px', 'width': '10%' }}
                          >
                            {"Chat with us!"}
                          </Button>
                        </a>
                      </Grid>
                    </Grid>
                  </Grid>
                </Paper>

                <Grid alignItems="center" justifyContent="center" style={{ 'margin': 'auto', 'width': '55%', 'margin-bottom': '90px' }}>
                  <Typography style={{ 'margin': 'auto', 'margin-top': '50px' }} variant="h6">{"1 - Before you start, please make sure you that have a MetaMask wallet running on the Polygon/MATIC Network with enough USDC to fund your contribution. The minimum contribution is $100 USDC. You will have a small gas fee so also be sure you have at least $1 USDC worth of Polygon (MATIC) in your wallet."}</Typography>
                  <Typography style={{ 'margin': 'auto' }} variant="h6">{"2 - If you have not already, please register on the Whitelist or you will be blocked from contributing."}</Typography>

                </Grid>
              </>
            )}
        </Grid>
      )
      }
      <div className="card-header-last">
        <div style={{ 'padding-top': '120px' }}>
          <div style={{ "padding": "56.25% 0 0 0", "position": "relative", "width": "80%", "margin": "auto" }}><iframe src="https://player.vimeo.com/video/688781225?h=7f8913d9d6&amp;badge=0&amp;autopause=0&amp;player_id=0&amp;app_id=58479" frameborder="0" allow="autoplay; fullscreen; picture-in-picture" allowfullscreen style={{ "position": "absolute", "top": "0", "left": "0", "width": "100%", "height": "100%" }} title="HOM DAO HD 09-3-2022 (1).mp4"></iframe></div>
        </div>
      </div>
    </div>
  )
}

export default Presale;
