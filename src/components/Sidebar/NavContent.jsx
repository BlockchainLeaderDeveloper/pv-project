import { useCallback, useState } from "react";
import { NavLink } from "react-router-dom";
import styled from 'styled-components'
import Social from "./Social";
import externalUrls from "./externalUrls";

import { useAddress, useWeb3Context } from "src/hooks/web3Context";
import { Paper, Link, Box, Typography, SvgIcon } from "@material-ui/core";

import "./sidebar.scss";
import { makeStyles } from "@material-ui/core/styles";

import { ReactComponent as PVnet } from "../../assets/icons/PVnet.svg";

function NavContent() {
  const [isActive] = useState();
  const address = useAddress();
  const { chainID } = useWeb3Context();

  const checkPage = useCallback((match, location, page) => {
    const currentPath = location.pathname.replace("/", "");
    if (currentPath.indexOf("dashboard") >= 0 && page === "dashboard") {
      return true;
    }
    if (currentPath.indexOf("stake") >= 0 && page === "stake") {
      return true;
    }
    if (currentPath.indexOf("presale") >= 0 && page === "presale") {
      return true;
    }
    if (currentPath.indexOf("claim") >= 0 && page === "claim") {
      return true;
    }
    if (currentPath.indexOf("calculator") >= 0 && page === "calculator") {
      return true;
    }
    if ((currentPath.indexOf("bonds") >= 0 || currentPath.indexOf("choose_bond") >= 0) && page === "bonds") {
      return true;
    }
    return false;
  }, []);


  const CustomePaper = styled(Paper)`
  `;

  const drawerWidth = 280;
  const useStyles = makeStyles(theme => ({
    drawer: {
      [theme.breakpoints.up("md")]: {
        width: drawerWidth,
        flexShrink: 0,
      },
    },
    drawerPaper: {
      [theme.breakpoints.up("lg")]: {
        display: 'flex',
        minheight: 'max-content',
        marginBottom: '150%',
        width: '100%',
        position: 'absolute',
        flexDirection: 'column'

      },
    },
    drawnav: {
      [theme.breakpoints.up("lg")]: {
        display: 'flex',

        flexDirection: 'column',
        minheight: 'max-content',
        marginTop: '20px',
        marginBottom: '55%'
      },
    },
  }));

  const classes = useStyles();

  return (
    <CustomePaper className="dapp-sidebar" style={{ "widht": "100%", "height": "100%","background":"white" }}>
      <Box className="dapp-sidebar-inner" display="flex" flexDirection="column">
        <div className={classes.drawerPaper} >
          <Box className="branding-header" >
            <Link href="/" target="_blank">
              {/* <p style={{"fontSize":"35px"}}>PVnet finance</p> */}
              <SvgIcon
                color="primary"
                component={PVnet}
                viewBox="0 0 1024 1024"
                style={{  minWdth: "205px", minHeight: "205px", width: "205px" }}
              />
            </Link>
          </Box>

          <div className="dapp-menu-links" style={{paddingTop:"30px",paddingBottom:"100%", "background":"black", borderRadius:"0 20px 0 0" }}>
            <div className={classes.drawnav} id="navbarNav" style={{ "width": "-webkit-fill-available", marginTop: '5px', paddingBottom:"inherit" }}>
              <Link
                component={NavLink}
                id="dash-nav"
                to="/dashboard"
                isActive={(match, location) => {
                  return checkPage(match, location, "dashboard");
                }}
                className={`button-dapp-menu bg-color-sidebar-btn ${isActive ? "active" : ""}`}
              >
                <Typography variant="h6" style={{ "width": "130px", "color":"white" , }}>
                  DASHBOARD
                </Typography>
              </Link>

              <Link
                component={NavLink}
                id="stake-nav"
                to="/stake"
                isActive={(match, location) => {
                  return checkPage(match, location, "stake");
                }}
                className={`button-dapp-menu  bg-color-sidebar-btn ${isActive ? "active" : ""}`}
              >
                <Typography variant="h6" style={{ "width": "130px", 'font-family': '"Raleway",sans-serif' , "color":"white"}} >

                  STAKE
                </Typography>
              </Link>

              <Link
                component={NavLink}
                id="stake-nav"
                to="/calculator"
                isActive={(match, location) => {
                  return checkPage(match, location, "calculator");
                }}
                className={`button-dapp-menu  bg-color-sidebar-btn ${isActive ? "active" : ""}`}
              >
                <Typography variant="h6" style={{ "width": "130px", 'font-family': '"Raleway",sans-serif', "color":"white" }} >
                  CALCULATOR
                </Typography>
              </Link>
            </div>
            <div className="dapp-menu-social">
            <Social />
          </div>
          </div>
 
        </div>
        <Box className="dapp-menu-bottom" display="flex" flexDirection="row" paddingRight="0px" marginTop="10px" width="0px">
          <div className="dapp-menu-external-links">
            {externalUrls.map(({ url, icon, title, label }, i) => {
              return (
                <Link key={i} href={url} target="_blank" component={url ? "a" : "span"} className="button-dapp-menu bg-color-sidebar-btn">

                  <Typography variant="h6">{icon}</Typography>
                  <Typography variant="h6">{title}</Typography>
                  {label ? (
                    <Typography variant="caption" style={{ marginLeft: "8px" }}>
                      {label}
                    </Typography>
                  ) : null}
                </Link>
              );
            })}
          </div>

 
        </Box>
      </Box>
    </CustomePaper>
  );
}

export default NavContent;
