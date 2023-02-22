import { BigNumber, constants } from "ethers";
import { ChainIds } from "../connectors/connectors";

export const ZERO = BigNumber.from("0");

export const MAX_UINT256 = constants.MaxUint256;

export const GLOW_COLOR_SWAP = "rgba(255, 181, 227, 0.45)";
export const GLOW_COLOR_POOL = "#bae0bd";
export const GLOW_COLOR_CREDIT = "rgba(255, 181, 227, 0.45)";
export const GLOW_COLOR_DASHBOARD = "#ffffff";

export const CURRENT_EPOCH_CODE = "BRIBE-REWARDS-EPOCH-1676505600";
export const CURRENT_EPOCH_DISPLAY = "02/16/2023";

export const chainIds = [ChainIds.ARBITRUM, ChainIds.ARBITRUM_GOERLI];

export const merkleClaimAddress = {
  [ChainIds.ARBITRUM]: "",
  [ChainIds.ARBITRUM_GOERLI]: "0xaBFEB602B4CD25bBAd093409D6AE4518f9a9fC0C",
};
