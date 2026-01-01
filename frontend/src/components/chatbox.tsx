import { useState, useRef } from "react";
import { MessageCircle, MessageSquareIcon, X, CheckIcon } from "lucide-react";
import { useChat } from "@ai-sdk/react";
import {
  DefaultChatTransport,
  lastAssistantMessageIsCompleteWithApprovalResponses,
} from "ai";
import { useAtom, useAtomValue } from "jotai";
import { accessTokenAtom } from "@/stores/access-token";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  Conversation,
  ConversationContent,
  ConversationEmptyState,
  ConversationScrollButton,
} from "@/components/ai-elements/conversation";
import { Message, MessageContent } from "@/components/ai-elements/message";
import {
  PromptInput,
  PromptInputBody,
  PromptInputTextarea,
  PromptInputFooter,
  PromptInputSubmit,
  PromptInputTools,
  PromptInputButton,
} from "@/components/ai-elements/prompt-input";
import {
  ModelSelector,
  ModelSelectorContent,
  ModelSelectorEmpty,
  ModelSelectorGroup,
  ModelSelectorInput,
  ModelSelectorItem,
  ModelSelectorList,
  ModelSelectorLogo,
  ModelSelectorName,
  ModelSelectorTrigger,
} from "@/components/ai-elements/model-selector";
import {
  Confirmation,
  ConfirmationTitle,
  ConfirmationRequest,
  ConfirmationAccepted,
  ConfirmationRejected,
  ConfirmationActions,
  ConfirmationAction,
} from "@/components/ai-elements/confirmation";
import { Loader } from "@/components/ai-elements/loader";
import { CardPreview } from "@/components/card-preview";
import { useParams } from "react-router";
import { atomWithStorage } from "jotai/utils";

const chatGPTModels = [
  {
    id: "gpt-4o-mini",
    name: "GPT-4o Mini",
    chef: "OpenAI",
    chefSlug: "openai",
  },
  {
    id: "gpt-4o",
    name: "GPT-4o",
    chef: "OpenAI",
    chefSlug: "openai",
  },
  {
    id: "gpt-5.2",
    name: "GPT-5.2",
    chef: "OpenAI",
    chefSlug: "openai",
  },
];

const selectedModelAtom = atomWithStorage(
  "selectedChatModel",
  chatGPTModels[0].id,
);

export function Chatbox() {
  const [isOpen, setIsOpen] = useState(false);
  const [model, setModel] = useAtom(selectedModelAtom);
  const [modelSelectorOpen, setModelSelectorOpen] = useState(false);
  const accessToken = useAtomValue(accessTokenAtom);
  const modelRef = useRef<string>(model);
  const { boardId } = useParams<{ boardId?: string }>();

  // A dirty fix, dirty as hell
  // Keep ref in sync with state
  modelRef.current = model;

  const selectedModelData = chatGPTModels.find((m) => m.id === model);

  const { messages, sendMessage, status, addToolApprovalResponse } = useChat({
    transport: new DefaultChatTransport({
      api: "http://localhost:3000/chat",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      body: () => {
        return { model: modelRef.current, boardId };
      },
    }),
    sendAutomaticallyWhen: lastAssistantMessageIsCompleteWithApprovalResponses,
  });

  const handleSubmit = (message: { text: string }) => {
    if (!message.text.trim()) return;

    sendMessage({
      role: "user",
      parts: [{ type: "text", text: message.text }],
    });
  };

  return (
    <>
      {/* Floating Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="flex fixed right-6 bottom-6 z-50 justify-center items-center w-14 h-14 text-white bg-blue-600 rounded-full shadow-lg transition-all hover:bg-blue-700 hover:shadow-xl"
          aria-label="Open chat"
        >
          <MessageCircle className="w-6 h-6" />
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div className="flex fixed right-6 bottom-6 z-50 flex-col rounded-lg border shadow-2xl h-[600px] w-[400px] border-border bg-background">
          {/* Header */}
          <div className="flex justify-between items-center p-4 text-white bg-blue-600 rounded-t-lg">
            <div className="flex gap-2 items-center">
              <MessageCircle className="w-5 h-5" />
              <h3 className="font-semibold">Chat Assistant</h3>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1 rounded-full transition-colors hover:bg-blue-700"
              aria-label="Close chat"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Messages */}
          <Conversation className="flex-1">
            <ConversationContent>
              {messages.length === 0 ? (
                <ConversationEmptyState
                  description="What can I do for you?"
                  icon={<MessageSquareIcon className="size-6" />}
                  title="Hello! 👋"
                />
              ) : (
                messages.map((message) => (
                  <Message from={message.role} key={message.id}>
                    <MessageContent>
                      {message.parts.map((part, i) => {
                        if (part.type === "text") {
                          return message.role === "assistant" ? (
                            <div
                              key={i}
                              className="max-w-none prose prose-sm dark:prose-invert"
                            >
                              <ReactMarkdown
                                remarkPlugins={[remarkGfm]}
                                components={{
                                  code: ({ className, children, ...props }) => {
                                    const isInline = !className;
                                    return isInline ? (
                                      <code
                                        className="py-0.5 px-1.5 font-mono text-sm rounded bg-muted"
                                        {...props}
                                      >
                                        {children}
                                      </code>
                                    ) : (
                                      <code
                                        className={`block rounded-lg bg-muted p-4 font-mono text-sm overflow-x-auto ${className || ""}`}
                                        {...props}
                                      >
                                        {children}
                                      </code>
                                    );
                                  },
                                }}
                              >
                                {part.text}
                              </ReactMarkdown>
                            </div>
                          ) : (
                            <p key={i} className="whitespace-pre-wrap">
                              {part.text}
                            </p>
                          );
                        }

                        // Handle tool parts with approval (createCard tool)
                        if (part.type === "tool-createCard") {
                          const input = part.input as {
                            listId: string;
                            name: string;
                            startDate?: string;
                            deadline?: string;
                            latitude?: number;
                            longitude?: number;
                          };

                          return (
                            <Confirmation
                              key={i}
                              approval={part.approval}
                              state={part.state}
                            >
                              <ConfirmationTitle>
                                <ConfirmationRequest>
                                  <div className="space-y-3">
                                    <p>Create this card?</p>
                                    {/* <CardPreview */}
                                    {/*   name={input.name} */}
                                    {/*   startDate={input.startDate} */}
                                    {/*   deadline={input.deadline} */}
                                    {/*   latitude={input.latitude} */}
                                    {/*   longitude={input.longitude} */}
                                    {/* /> */}
                                  </div>
                                </ConfirmationRequest>
                                <ConfirmationAccepted>
                                  <CheckIcon className="text-green-600 dark:text-green-400 size-4" />
                                  <span>You approved creating this card</span>
                                </ConfirmationAccepted>
                                <ConfirmationRejected>
                                  <X className="size-4 text-destructive" />
                                  <span>You rejected creating this card</span>
                                </ConfirmationRejected>
                              </ConfirmationTitle>
                              <ConfirmationActions>
                                <ConfirmationAction
                                  variant="outline"
                                  onClick={() => {
                                    addToolApprovalResponse({
                                      id: part.approval!.id,
                                      approved: false,
                                      reason: "User rejected the card creation",
                                    });
                                  }}
                                >
                                  Reject
                                </ConfirmationAction>
                                <ConfirmationAction
                                  variant="default"
                                  onClick={() => {
                                    addToolApprovalResponse({
                                      id: part.approval!.id,
                                      approved: true,
                                      reason: "User approved the card creation",
                                    });
                                  }}
                                >
                                  Approve
                                </ConfirmationAction>
                              </ConfirmationActions>
                            </Confirmation>
                          );
                        }

                        return null;
                      })}
                    </MessageContent>
                  </Message>
                ))
              )}
              {status === "streaming" && (
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
          <div className="p-4 border-t border-border">
            <PromptInput onSubmit={handleSubmit}>
              <PromptInputBody>
                <PromptInputTextarea
                  className="min-h-[60px]"
                  placeholder="Enter your message..."
                />
              </PromptInputBody>
              <PromptInputFooter>
                <PromptInputTools>
                  <ModelSelector
                    onOpenChange={setModelSelectorOpen}
                    open={modelSelectorOpen}
                  >
                    <ModelSelectorTrigger asChild>
                      <PromptInputButton>
                        {selectedModelData?.chefSlug && (
                          <ModelSelectorLogo
                            provider={selectedModelData.chefSlug}
                          />
                        )}
                        {selectedModelData?.name && (
                          <ModelSelectorName>
                            {selectedModelData.name}
                          </ModelSelectorName>
                        )}
                      </PromptInputButton>
                    </ModelSelectorTrigger>
                    <ModelSelectorContent>
                      <ModelSelectorInput placeholder="Select model..." />
                      <ModelSelectorList>
                        <ModelSelectorEmpty>
                          Không tìm thấy model.
                        </ModelSelectorEmpty>
                        <ModelSelectorGroup heading="OpenAI">
                          {chatGPTModels.map((m) => (
                            <ModelSelectorItem
                              key={m.id}
                              onSelect={() => {
                                setModel(m.id);
                                setModelSelectorOpen(false);
                              }}
                              value={m.id}
                            >
                              <ModelSelectorLogo provider={m.chefSlug} />
                              <ModelSelectorName>{m.name}</ModelSelectorName>
                              {model === m.id ? (
                                <CheckIcon className="ml-auto size-4" />
                              ) : (
                                <div className="ml-auto size-4" />
                              )}
                            </ModelSelectorItem>
                          ))}
                        </ModelSelectorGroup>
                      </ModelSelectorList>
                    </ModelSelectorContent>
                  </ModelSelector>
                </PromptInputTools>
                <PromptInputSubmit status={status} />
              </PromptInputFooter>
            </PromptInput>
          </div>
        </div>
      )}
    </>
  );
}
