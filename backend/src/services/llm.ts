import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

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

export async function getChatCompletion(
  userMessage: string,
  conversationHistory: ChatMessage[] = []
): Promise<string> {
  try {
    const messages: ChatMessage[] = [
      { role: "system", content: SYSTEM_PROMPT },
      ...conversationHistory,
      { role: "user", content: userMessage },
    ];

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: messages,
      temperature: 0.7,
      max_tokens: 500,
    });

    return completion.choices[0]?.message?.content || "Xin lỗi, tôi không thể trả lời lúc này.";
  } catch (error) {
    console.error("OpenAI API Error:", error);
    throw new Error("Không thể kết nối với AI service");
  }
}

export async function getChatCompletionStream(
  userMessage: string,
  conversationHistory: ChatMessage[] = []
): Promise<AsyncIterable<OpenAI.Chat.Completions.ChatCompletionChunk>> {
  const messages: ChatMessage[] = [
    { role: "system", content: SYSTEM_PROMPT },
    ...conversationHistory,
    { role: "user", content: userMessage },
  ];

  const stream = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: messages,
    temperature: 0.7,
    max_tokens: 500,
    stream: true,
  });

  return stream;
}
