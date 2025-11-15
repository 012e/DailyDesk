import { atom } from "jotai";

export const getAccessTokenFnAtom = atom<(() => Promise<string>) | undefined>();
export async function getAccessToken() {}
