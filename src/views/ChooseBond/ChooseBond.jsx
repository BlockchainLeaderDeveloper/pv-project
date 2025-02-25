import { useCallback } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useEffect } from "react";
import {
  Box,
  Grid,
  Paper,
  Table,
  TableBody,

  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  Zoom,
} from "@material-ui/core";


import { BondDataCard, BondTableData } from "./BondRow";
import useMediaQuery from "@material-ui/core/useMediaQuery";
import { formatCurrency } from "../../helpers";
import useBonds from "../../hooks/Bonds";
import "./choosebond.scss";
import { Skeleton } from "@material-ui/lab";
import ClaimBonds from "./ClaimBonds";
import _ from "lodash";
import { allBondsMap } from "src/helpers/AllBonds";


function ChooseBond() {
  const { bonds } = useBonds();
  const isSmallScreen = useMediaQuery("(max-width: 733px)"); // change to breakpoint query
  const isVerySmallScreen = useMediaQuery("(max-width: 420px)");

  const isAppLoading = useSelector(state => state.app.loading);
  const isAccountLoading = useSelector(state => state.account.loading);
  // const multiSignBalance = useSelector(state => {
  //   return state.bond.multiSignBalance;
  // });
  // const multiSignBalance = useSelector(state => state.account.balances.multiSignBalance);
  // console.log('debug multiSignBalance', multiSignBalance);

  const accountBonds = useSelector(state => {
    const withInterestDue = [];
    for (const bond in state.account.bonds) {
      if (state.account.bonds[bond].interestDue > 0) {
        withInterestDue.push(state.account.bonds[bond]);
      }
    }
    return withInterestDue;
  });
  //  console.log('bonds',bonds)

  const marketPrice = useSelector(state => {
    return state.app.marketPrice;
  });

  const treasuryBalance = useSelector(state => {
    if (state.bonding.loading == false) {
      let tokenBalances = 0;
      let i = 0;
      for (const bond in allBondsMap) {

        if (state.bonding[bond]) {
          tokenBalances += state.bonding[bond].purchased;
        }
        // if(i == 0){
        //   tokenBalances += state.bonding[bond].multiSignBalance;
        // }
        i++;
      }


      return tokenBalances;
    }
  });

  return (
    <div id="choose-bond-view">
      <div className="card-header-first" >
        <Typography variant="h2" style={{ 'font-size': '56px', 'padding': '30px' }}>Bond</Typography>
      </div>
      {!isAccountLoading && !_.isEmpty(accountBonds) && <ClaimBonds activeBonds={accountBonds} />}


      <Zoom in={true}>
        <Paper className="ohm-card">

          <Box className="card-header">
            <Typography variant="h5">Bond</Typography>
          </Box>

          <Grid container item xs={12} style={{ margin: "10px 0px 20px" }} className="bond-hero">
            <Grid item xs={6}>
              <Box textAlign={`${isVerySmallScreen ? "left" : "center"}`}>
                <Typography variant="h5" color="textSecondary">
                  Treasury Balance
                </Typography>
                <Typography variant="h4"  style={{'color':'black'}}>
                  {isAppLoading ? (
                    <Skeleton width="180px" />
                  ) : (
                    new Intl.NumberFormat("en-US", {
                      style: "currency",
                      currency: "USD",
                      maximumFractionDigits: 0,
                      minimumFractionDigits: 0,
                    }).format(treasuryBalance)
                  )}
                </Typography>
              </Box>
            </Grid>

            <Grid item xs={6} className={`ohm-price`}>
              <Box textAlign={`${isVerySmallScreen ? "right" : "center"}`}>
                <Typography variant="h5" color="textSecondary">
                  HOM Price
                </Typography>
                <Typography variant="h4" style={{'color':'black'}}>
                  {isAppLoading ? <Skeleton width="100px" /> : formatCurrency(marketPrice, 4)}
                </Typography>
              </Box>
            </Grid>
          </Grid>

          {!isSmallScreen && (
            <Grid container item>
              <TableContainer>
                <Table aria-label="Available bonds">
                  <TableHead>
                    <TableRow>
                      <TableCell align="center">Bond</TableCell>
                      <TableCell align="left">Price</TableCell>
                      <TableCell align="left">ROI</TableCell>
                      <TableCell align="right">Purchased</TableCell>
                      <TableCell align="right"></TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {bonds.map(bond => (
                      <BondTableData key={bond.name} bond={bond} />
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Grid>
          )}

        </Paper>


      </Zoom>


      {isSmallScreen && (
        <Box className="ohm-card-container">
          <Grid container item spacing={2}>
            {bonds.map(bond => (
              <Grid item xs={12} key={bond.name}>
                <BondDataCard key={bond.name} bond={bond} />
              </Grid>
            ))}
          </Grid>
        </Box>
      )}

    </div>
  );
}

export default ChooseBond;
