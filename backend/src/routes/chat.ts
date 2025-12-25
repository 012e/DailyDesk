import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi";
import { openai } from "@ai-sdk/openai";
import { streamText } from "ai";
import { authMiddleware } from "@/lib/auth";
import { defaultSecurityScheme } from "@/types/openapi";

const chatSchema = z.object({
  messages: z.array(
    z.object({
      role: z.enum(["user", "assistant", "system"]).openapi({
        example: "user",
      }),
      content: z.string().openapi({
        example: "Xin chào, bạn là ai?",
      }),
    })
  ).openapi({
    example: [
      {
        role: "user",
        content: "Xin chào, bạn là ai?",
      },
    ],
  }),
});

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

const TAGS = ["Chat"];

export default function createChatRoutes() {
  const app = new OpenAPIHono();
  app.use("*", authMiddleware());

  app.openapi(
    createRoute({
      method: "post",
      tags: TAGS,
      path: "/",
      security: defaultSecurityScheme(),
      request: {
        body: {
          content: {
            "application/json": {
              schema: chatSchema,
            },
          },
          description: "Chat messages array",
        },
      },
      responses: {
        200: {
          description: "Streaming chatbot response",
          content: {
            "text/event-stream": {
              schema: {
                type: "string",
              },
            },
          },
        },
      },
    }),
    async (c) => {
      const { messages } = c.req.valid("json");

      try {
        const result = streamText({
          model: openai("gpt-4o-mini"),
          system: SYSTEM_PROMPT,
          messages,
          temperature: 0.7,
          maxOutputTokens: 500,
        });

        return result.toUIMessageStreamResponse();
      } catch (error) {
        console.error("Chat error:", error);
        return c.json(
          {
            error: "Xin lỗi, hiện tại tôi đang gặp vấn đề kỹ thuật. Vui lòng thử lại sau.",
          },
          500
        );
      }
    }
  );

  return app;
}
