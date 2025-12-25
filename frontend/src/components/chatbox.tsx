import { useState } from 'react';
import { MessageCircle, X } from 'lucide-react';
import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport } from 'ai';
import { useAtomValue } from 'jotai';
import { accessTokenAtom } from '@/stores/access-token';
import { 
  Conversation, 
  ConversationContent, 
  ConversationEmptyState,
  ConversationScrollButton 
} from './ai-elements/conversation';
import { Message, MessageContent } from './ai-elements/message';
import { 
  PromptInput, 
  PromptInputBody, 
  PromptInputTextarea, 
  PromptInputFooter, 
  PromptInputSubmit 
} from './ai-elements/prompt-input';
import { Loader } from './ai-elements/loader';

export function Chatbox() {
  const [isOpen, setIsOpen] = useState(false);
  const accessToken = useAtomValue(accessTokenAtom);
  
  const { messages, sendMessage, status } = useChat({
    transport: new DefaultChatTransport({
      api: 'http://localhost:3000/chat',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }),
  });

  const handleSubmit = (message: { text: string }) => {
    if (!message.text.trim()) return;

    sendMessage({
      role: 'user',
      parts: [{ type: 'text', text: message.text }],
    });
  };

  return (
    <>
      {/* Floating Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-blue-600 text-white shadow-lg transition-all hover:bg-blue-700 hover:shadow-xl"
          aria-label="Open chat"
        >
          <MessageCircle className="h-6 w-6" />
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 z-50 flex h-[600px] w-[400px] flex-col rounded-lg border border-border bg-background shadow-2xl">
          {/* Header */}
          <div className="flex items-center justify-between rounded-t-lg bg-blue-600 p-4 text-white">
            <div className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5" />
              <h3 className="font-semibold">Chat Assistant</h3>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="rounded-full p-1 transition-colors hover:bg-blue-700"
              aria-label="Close chat"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Messages */}
          <Conversation className="flex-1">
            <ConversationContent>
              {messages.length === 0 ? (
                <ConversationEmptyState
                  title="Xin chào! 👋"
                  description="Tôi có thể giúp gì cho bạn?"
                />
              ) : (
                messages.map((message) => (
                  <Message key={message.id} from={message.role}>
                    <MessageContent>
                      {message.parts.map((part, i) => {
                        if (part.type === 'text') {
                          return (
                            <p key={`${message.id}-${i}`} className="whitespace-pre-wrap">
                              {part.text}
                            </p>
                          );
                        }
                        return null;
                      })}
                    </MessageContent>
                  </Message>
                ))
              )}
              {status === 'streaming' && (
                <Message from="assistant">
                  <MessageContent>
                    <Loader size={16} />
                  </MessageContent>
                </Message>
              )}
            </ConversationContent>
            <ConversationScrollButton />
          </Conversation>

          {/* Input */}
          <div className="border-t border-border p-4">
            <PromptInput onSubmit={handleSubmit}>
              <PromptInputBody>
                <PromptInputTextarea 
                  placeholder="Nhập tin nhắn..."
                  className="min-h-[60px]"
                />
              </PromptInputBody>
              <PromptInputFooter>
                <div className="flex-1" />
                <PromptInputSubmit status={status} />
              </PromptInputFooter>
            </PromptInput>
          </div>
        </div>
      )}
    </>
  );
}
