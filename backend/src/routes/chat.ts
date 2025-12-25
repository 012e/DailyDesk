import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi";
import { authMiddleware } from "@/lib/auth";
import { defaultSecurityScheme, jsonBody, successJson } from "@/types/openapi";
import { getChatCompletion } from "@/services/llm";

const chatSchema = z.object({
  message: z.string().min(1).max(1000).openapi({
    example: "Xin chào, bạn là ai?",
  }),
});

const chatResponseSchema = z.object({
  response: z.string().openapi({
    example: "Xin chào! Tôi là trợ lý AI của DailyDesk. Tôi có thể giúp gì cho bạn?",
  }),
  timestamp: z.string().openapi({
    example: new Date().toISOString(),
  }),
});

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
        body: jsonBody(chatSchema, {
          description: "Chat message",
        }),
      },
      responses: {
        200: successJson(chatResponseSchema, {
          description: "Chatbot response",
        }),
      },
    }),
    async (c) => {
      const { message } = c.req.valid("json");

      try {
        // Sử dụng GPT-4o-mini để trả lời
        const response = await getChatCompletion(message);

        return c.json({
          response,
          timestamp: new Date().toISOString(),
        });
      } catch (error) {
        console.error("Chat error:", error);

        // Fallback response nếu API fails
        return c.json({
          response: "Xin lỗi, hiện tại tôi đang gặp vấn đề kỹ thuật. Vui lòng thử lại sau.",
          timestamp: new Date().toISOString(),
        }, 500);
      }
    }
  );

  return app;
}
