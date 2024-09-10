import { useRecoilValue } from "recoil";
import { balanceAtom } from "../atoms/balance";

export const useBalance = () => {
  return useRecoilValue(balanceAtom);
};
