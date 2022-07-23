import { useSelector, useDispatch } from "react-redux";
import { getRebaseBlock, secondsUntilBlock, prettifySeconds } from "../../helpers";
import { Box, Typography } from "@material-ui/core";
import "./rebasetimer.scss";
import { Skeleton } from "@material-ui/lab";
import { useEffect, useMemo, useState } from "react";
import { loadAppDetails } from "../../slices/AppSlice";
import { useWeb3Context } from "../../hooks/web3Context";

function RebaseTimer() {
    const dispatch = useDispatch();
    const { provider, chainID } = useWeb3Context();

    const SECONDS_TO_REFRESH = 60;
    const [secondsToRebase, setSecondsToRebase] = useState(0);
    const [rebaseString, setRebaseString] = useState("");
    const [secondsToRefresh, setSecondsToRefresh] = useState(SECONDS_TO_REFRESH);

    const currentTime = useSelector(state => {
        return state.app.currentTime;
    });

    const endTime = useSelector(state => {
        return state.app.endTime;
    });

    function initializeTimer() {
        const rebaseTime = endTime;
        const seconds = secondsUntilBlock(currentTime, rebaseTime);
        // const seconds = currentTime - rebaseTime;
        setSecondsToRebase(seconds);
        const prettified = prettifySeconds(seconds);
        setRebaseString(prettified !== "" ? prettified : "Less than a minute");
    }

    // This initializes secondsToRebase as soon as currentTime becomes available
    useMemo(() => {
        if (currentTime) {
            initializeTimer();
        }
    }, [currentTime]);

    // After every period SECONDS_TO_REFRESH, decrement secondsToRebase by SECONDS_TO_REFRESH,
    // keeping the display up to date without requiring an on chain request to update currentTime.
    useEffect(() => {
        let interval = null;
        if (secondsToRefresh > 0) {
            interval = setInterval(() => {
                setSecondsToRefresh(secondsToRefresh => secondsToRefresh - 1);
            }, 1000);
        } else {
            // When the countdown goes negative, reload the app details and reinitialize the timer
            if (secondsToRebase < 0) {
                async function reload() {
                    await dispatch(loadAppDetails({ networkID: chainID, provider: provider }));
                }
                reload();
                setRebaseString("");
            } else {
                clearInterval(interval);
                setSecondsToRebase(secondsToRebase => secondsToRebase - SECONDS_TO_REFRESH);
                setSecondsToRefresh(SECONDS_TO_REFRESH);
                const prettified = prettifySeconds(secondsToRebase);
                setRebaseString(prettified !== "" ? prettified : "Less than a minute");
            }
        }
        return () => clearInterval(interval);
    }, [secondsToRebase, secondsToRefresh]);

    const expiry = useSelector(state => {
        return state.account.staking && state.account.staking.expiry;
    })

    const epochnumber = useSelector(state => {
        return state.account.staking && state.account.staking.epochnumber;
    })
    const depositamount = useSelector(state => {
        return state.account.staking && state.account.staking.depositamount;
    })

    return (
        <>
            {currentTime ? (
                secondsToRebase > 0 ? (
                    parseInt(expiry) > parseInt(epochnumber) && depositamount > 0 ?
                    <strong>You will be able to unstake your {(depositamount * 10) / 10000000000} amount of tokens in {rebaseString}</strong>
                    :

                    <strong></strong>

                ) : (
                    <strong>Please wait next rebasing</strong>
                )
            ) : (
                <Skeleton width="155px" />
            )}

        </>
    );
}

export default RebaseTimer;
