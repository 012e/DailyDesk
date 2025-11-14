import { atom } from "jotai";

export const getAccessTokenFnAtom = atom<(() => string) | undefined>();
export async function getAccessToken() {}
