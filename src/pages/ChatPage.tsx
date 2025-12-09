import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { apiClient, type ChatMessage } from "@/lib/api";
import { chatStorage, type ChatHistory } from "@/lib/chat-storage";
import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
} from "@/components/ai/conversation";
import {
  Message,
  MessageAvatar,
  MessageContent,
} from "@/components/ai/message";
import {
  PromptInput,
  PromptInputTextarea,
  PromptInputSubmit,
} from "@/components/ai/prompt-input";
import { Reasoning } from "@/components/ai/reasoning";
import { Sources } from "@/components/ai/sources";
import { ChatSidebar } from "@/components/chat-sidebar";
import { Button } from "@/components/ui/button";
import { LogOut, Loader2, Menu } from "lucide-react";

export default function ChatPage() {
  const navigate = useNavigate();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  const currentChatIdRef = useRef<string | null>(null);
  const [isStorageReady, setIsStorageReady] = useState(false);
  const [sidebarRefreshTrigger, setSidebarRefreshTrigger] = useState(0);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // Keep ref in sync with state
  useEffect(() => {
    currentChatIdRef.current = currentChatId;
  }, [currentChatId]);

  useEffect(() => {
    if (!apiClient.isAuthenticated()) {
      navigate("/login");
      return;
    }

    // Initialize IndexedDB
    chatStorage
      .init()
      .then(async () => {
        setIsStorageReady(true);
        // Delete chats older than 24 hours
        try {
          await chatStorage.deleteOldChats(24);
          setSidebarRefreshTrigger((prev) => prev + 1);
        } catch (error) {
          console.error("Failed to delete old chats:", error);
        }
        // Create a new chat on mount
        handleCreateNewChat();
      })
      .catch((error) => {
        console.error("Failed to initialize chat storage:", error);
        setIsStorageReady(true);
        // Still allow using the app even if storage fails
        handleCreateNewChat();
      });

    // Set up periodic cleanup (every hour)
    const cleanupInterval = setInterval(async () => {
      try {
        const deletedCount = await chatStorage.deleteOldChats(24);
        if (deletedCount > 0) {
          setSidebarRefreshTrigger((prev) => prev + 1);
          // Check if current chat was deleted
          const currentId = currentChatIdRef.current;
          if (currentId) {
            const chat = await chatStorage.getChat(currentId);
            if (!chat) {
              // Current chat was deleted, create a new one
              const newChatId = Date.now().toString();
              setCurrentChatId(newChatId);
              setMessages([]);
              setInput("");
            }
          }
        }
      } catch (error) {
        console.error("Failed to delete old chats:", error);
      }
    }, 60 * 60 * 1000); // 1 hour

    return () => {
      clearInterval(cleanupInterval);
    };
  }, [navigate]);

  const handleCreateNewChat = useCallback(() => {
    const newChatId = Date.now().toString();
    setCurrentChatId(newChatId);
    setMessages([]);
    setInput("");
  }, []);

  const handleSelectChat = useCallback(async (chatId: string) => {
    try {
      const chat = await chatStorage.getChat(chatId);
      if (chat) {
        setCurrentChatId(chat.id);
        setMessages(chat.messages);
        setInput("");
      }
    } catch (error) {
      console.error("Failed to load chat:", error);
    }
  }, []);

  const saveChat = useCallback(
    async (chatMessages: ChatMessage[]) => {
      if (!isStorageReady || !currentChatId || chatMessages.length === 0) {
        return;
      }

      try {
        // Get first user message as title
        const firstUserMessage = chatMessages.find((msg) => msg.role === "user");
        const title = firstUserMessage?.content || "New Chat";

        const chat: ChatHistory = {
          id: currentChatId,
          title: title.length > 50 ? title.substring(0, 50) + "..." : title,
          messages: chatMessages.map((msg) => ({
            ...msg,
            timestamp: msg.timestamp,
          })),
          timestamp: parseInt(currentChatId),
          updatedAt: Date.now(),
        };

        await chatStorage.saveChat(chat);
        // Trigger sidebar refresh
        setSidebarRefreshTrigger((prev) => prev + 1);
      } catch (error) {
        console.error("Failed to save chat:", error);
      }
    },
    [currentChatId, isStorageReady]
  );

  useEffect(() => {
    if (messages.length > 0) {
      saveChat(messages);
    }
  }, [messages, saveChat]);

  const handleSubmit = async (value: string) => {
    if (!value.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      content: value,
      role: "user",
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    const assistantMessageId = (Date.now() + 1).toString();

    const assistantMessage: ChatMessage = {
      id: assistantMessageId,
      content: "",
      role: "assistant",
      timestamp: new Date(),
      isStreaming: true,
    };

    setMessages((prev) => [...prev, assistantMessage]);

    try {
      const response = await apiClient.chat(value);

      // Update the assistant message with the response
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === assistantMessageId
            ? {
                ...msg,
                content: response.answer,
                isStreaming: false,
              }
            : msg
        )
      );
    } catch (error) {
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === assistantMessageId
            ? {
                ...msg,
                content:
                  error instanceof Error ? error.message : "An error occurred",
                isStreaming: false,
              }
            : msg
        )
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    apiClient.logout();
    navigate("/login");
  };

  return (
    <div className="flex h-screen w-full">
      {/* Sidebar */}
      <ChatSidebar
        currentChatId={currentChatId}
        onSelectChat={(chatId) => {
          handleSelectChat(chatId);
          setIsSidebarOpen(false);
        }}
        onCreateNewChat={() => {
          handleCreateNewChat();
          setIsSidebarOpen(false);
        }}
        refreshTrigger={sidebarRefreshTrigger}
        isOpen={isSidebarOpen}
        onOpenChange={setIsSidebarOpen}
        onChatDeleted={() => {
          // Reload current chat or create new if deleted
          if (currentChatId) {
            handleSelectChat(currentChatId).catch(() => {
              handleCreateNewChat();
            });
          } else {
            handleCreateNewChat();
          }
        }}
      />

      {/* Main Content */}
      <div className="flex flex-1 flex-col min-w-0">
        {/* Header */}
        <header className="border-b bg-background px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsSidebarOpen(true)}
              >
                <Menu className="h-5 w-5" />
                <span className="sr-only">Open sidebar</span>
              </Button>
              <h1 className="text-lg font-semibold">Armonia</h1>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" onClick={handleLogout}>
                <LogOut className="h-4 w-4" />
                <span className="sr-only">Logout</span>
              </Button>
            </div>
          </div>
        </header>

        {/* Conversation */}
        <Conversation className="flex-1">
        <ConversationContent>
          {messages.length === 0 && (
            <div className="flex h-full items-center justify-center text-center text-muted-foreground">
              <div>
                <p className="text-lg font-medium">Start a conversation</p>
                <p className="text-sm">
                  Ask me anything
                </p>
              </div>
            </div>
          )}
          {messages.map((message) => (
            <Message key={message.id} from={message.role}>
              <MessageAvatar from={message.role} />
              <MessageContent from={message.role}>
                {message.content ||
                  (message.isStreaming && (
                    <div className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Thinking...</span>
                    </div>
                  ))}
                {message.reasoning && (
                  <Reasoning content={message.reasoning} defaultOpen={false} />
                )}
                {message.sources && message.sources.length > 0 && (
                  <Sources sources={message.sources} />
                )}
              </MessageContent>
            </Message>
          ))}
        </ConversationContent>
        <ConversationScrollButton />
      </Conversation>

      {/* Input */}
      <div className="border-t bg-background p-4">
        <div className="flex items-center justify-center">
          <PromptInput onSubmit={handleSubmit} disabled={isLoading} className="flex items-center gap-2">
            <PromptInputTextarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask me anything..."
              disabled={isLoading}
              className="w-[400px]"
            />
            <PromptInputSubmit disabled={!input.trim() || isLoading} />
          </PromptInput>
        </div>
      </div>
      </div>
    </div>
  );
}
