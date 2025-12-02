import { useMutation } from '@tanstack/react-query';
import httpClient from '@/lib/client';

interface ChatRequest {
  message: string;
}

interface ChatResponse {
  response: string;
  timestamp: string;
}

export function useChat() {
  return useMutation({
    mutationFn: async (request: ChatRequest): Promise<ChatResponse> => {
      const { data } = await httpClient.post<ChatResponse>('/chat', request);
      return data;
    },
  });
}
