import { boardIdAtom } from "@/stores/board";
import { useSetAtom } from "jotai";
import { useEffect } from "react";
import { useParams } from "react-router";

export default function BoardIdProivder({
  children,
}: {
  children: React.ReactNode;
}) {
  const { boardId } = useParams();
  const boardIdAtomSetter = useSetAtom(boardIdAtom);
  useEffect(() => {
    boardIdAtomSetter(boardId);
  }, [boardId]);
  return children;
}
