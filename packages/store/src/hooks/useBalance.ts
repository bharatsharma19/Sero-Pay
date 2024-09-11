import { useRecoilValue } from "recoil";
import { balanceAtom } from "../atoms/balance";

export const useBalance = () => {
  const finalValue = useRecoilValue(balanceAtom);

  return finalValue;
};
