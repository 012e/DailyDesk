import { atom } from "jotai";
import type { Card as CardType } from "@/types/card";

// Card dialog state
export const selectedCardAtom = atom<CardType | null>(null);
export const isCardDialogOpenAtom = atom(false);

// List editing state
export const editingListIdAtom = atom<string | null>(null);
export const editingListTitleAtom = atom("");

// Adding card state
export const addingCardColumnIdAtom = atom<string | null>(null);
export const newCardTitleAtom = atom("");

// Adding list state
export const isAddingListAtom = atom(false);
export const newListTitleAtom = atom("");

// Board ID atom
export const boardIdAtom = atom<string | undefined>(undefined);
