import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi";
import { createOpenAI } from "@ai-sdk/openai";
import { convertToModelMessages, streamText, UIMessage } from "ai";
import { authMiddleware } from "@/lib/auth";
import { defaultSecurityScheme } from "@/types/openapi";
import getConfig from "@/lib/config";

const config = getConfig();
const openai = createOpenAI({
  apiKey: config.openai,
});

const TAGS = ["Chat"];

const RequestSchema = z.object({
  messages: z.array(z.any()),
  model: z.string().optional().default(config.defaultModel),
  boardId: z.string().optional(),
});

const allowedModels = ["gpt-4o", "gpt-4o-mini"];

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
              schema: RequestSchema,
            },
          },
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
      const request = await c.req.json();
      const messages = await convertToModelMessages(
        request.messages as UIMessage[]
      );
      const modelId = request.model || config.defaultModel;

      // Validate that only ChatGPT models are allowed
      if (!allowedModels.includes(modelId)) {
        return c.json(
          {
            error: "Model không được hỗ trợ. Vui lòng chọn model ChatGPT.",
          },
          400
        );
      }

      try {
        const result = streamText({
          model: openai(modelId),
          system: config.systemPrompt,
          messages,
          temperature: 0.7,
          maxOutputTokens: 500,
        });

        return result.toUIMessageStreamResponse();
      } catch (error) {
        console.error("Chat error:", error);
        return c.json(
          {
            error:
              "Xin lỗi, hiện tại tôi đang gặp vấn đề kỹ thuật. Vui lòng thử lại sau.",
          },
          500
        );
      }
    }
  );

  return app;
}
