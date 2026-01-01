export { getBoardInfoTool } from "./get-board-info";
export { getBoardSummaryTool } from "./get-board-summary";
export { getListCardsTool } from "./get-list-cards";
export { getCardDetailsTool } from "./get-card-details";

// Export all tools as a collection
import { getBoardInfoTool } from "./get-board-info";
import { getBoardSummaryTool } from "./get-board-summary";
import { getListCardsTool } from "./get-list-cards";
import { getCardDetailsTool } from "./get-card-details";

export const createBoardTools = (boardId: string) => ({
  getBoardInfo: getBoardInfoTool(boardId),
  getBoardSummary: getBoardSummaryTool(boardId),
  getListCards: getListCardsTool,
  getCardDetails: getCardDetailsTool,
});
