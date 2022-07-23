import { useSelector } from "react-redux";
import { useEffect, useState } from "react";
import allBonds from "src/helpers/AllBonds";
import { Bond } from "src/lib/Bond";
import { IBondDetails } from "src/slices/BondSlice";

interface IBondingStateView {
  account: {

  };
  bonding: {
    loading: Boolean;
    [key: string]: any;
  };
}

// Smash all the interfaces together to get the BondData Type
interface IAllBondData extends Bond, IBondDetails {}

const initialBondArray = allBonds;
// Slaps together bond data within the account & bonding states
function useBonds() {
  const bondLoading = useSelector((state: IBondingStateView) => !state.bonding.loading);
  const bondState = useSelector((state: IBondingStateView) => state.bonding);
  const [bonds, setBonds] = useState<Bond[] | IAllBondData[]>(initialBondArray);

  useEffect(() => {
    let bondDetails: IAllBondData[];
    bondDetails = allBonds
      .flatMap(bond => {
        if (bondState[bond.name] && bondState[bond.name].bondDiscount) {
          return Object.assign(bond, bondState[bond.name]); // Keeps the object type
        }
        return bond;
      })
      .flatMap(bond => {
        return bond;
      });

    const mostProfitableBonds = bondDetails.concat().sort((a, b) => {
      return a["bondDiscount"] > b["bondDiscount"] ? -1 : b["bondDiscount"] > a["bondDiscount"] ? 1 : 0;
    });

    setBonds(mostProfitableBonds);
  }, [bondState,  bondLoading]);

  return { bonds, loading: bondLoading };
}

export default useBonds;
