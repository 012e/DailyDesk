export { getBoardInfoTool } from "./get-board-info";
export { getBoardSummaryTool } from "./get-board-summary";
export { getListCardsTool } from "./get-list-cards";
export { getCardDetailsTool } from "./get-card-details";
export { createCardTool } from "./create-card";

// Export all tools as a collection
import { getBoardInfoTool } from "./get-board-info";
import { getBoardSummaryTool } from "./get-board-summary";
import { getListCardsTool } from "./get-list-cards";
import { getCardDetailsTool } from "./get-card-details";
import { createCardTool } from "./create-card";

export const createBoardTools = (boardId: string, userId: string) => ({
  getBoardInfo: getBoardInfoTool(boardId),
  getBoardSummary: getBoardSummaryTool(boardId),
  getListCards: getListCardsTool,
  getCardDetails: getCardDetailsTool,
  createCard: createCardTool(boardId, userId),
});
