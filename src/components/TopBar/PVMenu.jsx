import { useState, useEffect } from "react";
import { addresses, TOKEN_DECIMALS } from "../../constants";
import { getTokenImage } from "../../helpers";
import { useSelector } from "react-redux";
import { Link, SvgIcon, Popper, Button, Paper, Typography, Divider, Box, Fade, Slide } from "@material-ui/core";
import { ReactComponent as ArrowUpIcon } from "../../assets/icons/arrow-up.svg";
import { ReactComponent as PVnetTokenImg } from "../../assets/tokens/token_pv.svg";
import { ReactComponent as sPVnetTokenImg } from "../../assets/tokens/token_spv.svg";

import "./ohmmenu.scss";
import { dai } from "src/helpers/AllBonds";
import { useWeb3Context } from "../../hooks/web3Context";

import PVnetImg from "src/assets/tokens/PVnet.svg";
import SPVnetImg from "src/assets/tokens/PVnet.svg";
import token33tImg from "src/assets/tokens/token_33T.svg";

const addTokenToWallet = (tokenSymbol, tokenAddress) => async () => {
  if (window.ethereum) {
    const host = window.location.origin;
    // NOTE (appleseed): 33T token defaults to sBHD logo since we don't have a 33T logo yet
    let tokenPath;
    // if (tokenSymbol === "BHD") {

    // } ? BhdImg : SBhdImg;
    switch (tokenSymbol) {
      case "XPV":
        tokenPath = PVnetImg;
        break;
      case "33T":
        tokenPath = token33tImg;
        break;
      default:
        tokenPath = SPVnetImg;
    }
    const imageURL = `${host}/${tokenPath}`;

    try {
      await window.ethereum.request({
        method: "wallet_watchAsset",
        params: {
          type: "ERC20",
          options: {
            address: tokenAddress,
            symbol: tokenSymbol,
            decimals: TOKEN_DECIMALS,
            image: imageURL,
          },
        },
      });
    } catch (error) {
      console.log(error);
    }
  }
};

function PVMenu() {
  const [anchorEl, setAnchorEl] = useState(null);
  const isEthereumAPIAvailable = window.ethereum;
  const { chainID } = useWeb3Context();

  const networkID = chainID;

  const XPV_ADDRESS = addresses[networkID].XPV_ADDRESS;
  const SXPV_ADDRESS = addresses[networkID].SXPV_ADDRESS;

  const handleClick = event => {
    setAnchorEl(anchorEl ? null : event.currentTarget);
  };

  const open = Boolean(anchorEl);
  const id = "ohm-popper";
  const daiAddress = dai.getAddressForReserve(networkID);
  return (
    <Box
      component="div"
      onMouseEnter={e => handleClick(e)}
      onMouseLeave={e => handleClick(e)}
      id="ohm-menu-button-hover"
    >
      <Button id="ohm-menu-button" size="large" variant="contained" color="secondary" title="PVnet" aria-describedby={id}>
        <Typography style={{'color':'white'}}>PVnet</Typography>
      </Button>

      <Popper id={id} open={open} anchorEl={anchorEl} placement="bottom-start" transition>
        {({ TransitionProps }) => {
          return (
            <Fade {...TransitionProps} timeout={100}>
              <Paper className="ohm-menu" elevation={1}>
                <Box component="div" className="buy-tokens">
                  <Link
                    href={`https://traderjoexyz.com/trade?inputCurrency=0xd586e7f844cea2f87f50152665bcbc2c279d8d70&outputCurrency=${XPV_ADDRESS}`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    <Button size="large" variant="contained" color="black" fullWidth>
                      <Typography align="left">
                        Buy on Traderjoe <SvgIcon component={ArrowUpIcon} htmlColor="#A3A3A3" />
                      </Typography>
                    </Button>
                  </Link>

                </Box>


                {isEthereumAPIAvailable ? (
                  <Box className="add-tokens">
                    <Divider color="black" />
                    <p style={{'fontWeight':'600', 'color':'black'}} >ADD TOKEN TO WALLET</p>
                    <Box display="flex" flexDirection="row" justifyContent="space-between">
                      <Button variant="contained" color="black" onClick={addTokenToWallet("XPV", XPV_ADDRESS)}>
                        <SvgIcon
                          component={PVnetTokenImg}
                          viewBox="0 0 110 110"
                          style={{ height: "50px", width: "50px" }}
                        />
                        <Typography variant="body1">XPV</Typography>
                      </Button>
                      <Button variant="contained" color="black" onClick={addTokenToWallet("sXPV", SXPV_ADDRESS)}>
                        <SvgIcon
                          component={sPVnetTokenImg}
                          viewBox="0 0 110 110"
                          style={{ height: "50px", width: "50px" }}
                        />
                        <Typography variant="body1">sXPV</Typography>
                      </Button>
                    
                    </Box>
                  </Box>
                ) : null}
              </Paper>
            </Fade>
          );
        }}
      </Popper>
    </Box>
  );
}

export default PVMenu;
