import { z } from "zod";
import path from "path";
import * as fs from "fs";
import dotenv from "dotenv";
dotenv.config({ path: [".env", ".env.local"], override: true });

const SYSTEM_PROMPT = `Bạn là trợ lý AI thông minh của DailyDesk - một ứng dụng quản lý công việc (task management) giống Trello.

Thông tin về DailyDesk:
- DailyDesk giúp người dùng tổ chức công việc bằng Board, List và Card
- Board: Không gian làm việc cho từng dự án/nhóm
- List: Các cột trong board (ví dụ: "To Do", "In Progress", "Done")
- Card: Đơn vị công việc nhỏ nhất, có thể có tiêu đề, mô tả, nhãn, người thực hiện, hạn hoàn thành

Nhiệm vụ của bạn:
- Trả lời câu hỏi về cách sử dụng DailyDesk
- Hướng dẫn người dùng tạo board, list, card
- Giải thích các tính năng
- Gợi ý cách tổ chức công việc hiệu quả
- Trả lời bằng tiếng Việt thân thiện, ngắn gọn, dễ hiểu

Lưu ý:
- Không trả lời các câu hỏi không liên quan đến quản lý công việc
- Giữ câu trả lời ngắn gọn (2-4 câu), trừ khi cần giải thích chi tiết
- Sử dụng bullet points khi liệt kê nhiều thông tin`;

export const configSchema = z.object({
  databaseUrl: z.url().default("file:./tmp/database"),
  isProduction: z.boolean().default(false),
  authIssuerUrl: z.url().nonempty(), // Required, non-empty URL
  authAudience: z.string().nonempty(),
  openai: z.string().nonempty().optional(),
  defaultModel: z.string().default("gpt-4o-mini"),
  systemPrompt: z.string().default(SYSTEM_PROMPT),
});

/**
 * Ensures that a folder exists synchronously. If the folder does not exist, it is created,
 * including any necessary parent directories.
 *
 * @param relativeFolderPath The path to the folder, relative to the current working directory.
 */
function ensureFolderExistsSync(relativeFolderPath: string): void {
  // Resolve the relative path to an absolute path.
  const absolutePath = path.resolve(relativeFolderPath);

  try {
    // The recursive option ensures that parent directories are created if they don't exist.
    // It also doesn't throw an error if the directory already exists.
    fs.mkdirSync(absolutePath, { recursive: true });
  } catch (error) {
    // Primarily catches permission issues or other non-existence/already-exists related errors.
    throw new Error(
      `Failed to create folder synchronously at path: ${absolutePath}. Error: ${error}`,
    );
  }
}

export type Config = z.infer<typeof configSchema>;

export default function getConfig(): Config {
  ensureFolderExistsSync("tmp");
  const rawConfig: Partial<Config> = {
    databaseUrl: process.env.DATABASE_URL!,
    isProduction: process.env.NODE_ENV === "production",
    authIssuerUrl: "https://" + process.env.AUTH0_DOMAIN! + "/",
    authAudience: process.env.AUTH0_API_AUDIENCE!,
    openai: process.env.OPENAI_API_KEY || undefined,
  };

  return configSchema.parse(rawConfig);
}
