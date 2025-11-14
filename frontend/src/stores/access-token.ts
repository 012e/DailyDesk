import { atomWithStorage } from "jotai/utils";

export const accessTokenAtom = atomWithStorage<string>("auth0AcessToken", "");
