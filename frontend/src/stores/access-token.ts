import { atomWithStorage } from "jotai/utils";

export const ACCESS_TOKEN_LOCAL_STORNAGE_KEY = "accessToken";
export const accessTokenAtom = atomWithStorage<string>("accessToken", "");
