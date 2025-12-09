import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Trash2, Plus, X, ChevronLeft } from "lucide-react";
import { chatStorage, type ChatHistory } from "@/lib/chat-storage";
import { cn } from "@/lib/utils";

interface ChatSidebarProps {
  currentChatId: string | null;
  onSelectChat: (chatId: string) => void;
  onCreateNewChat: () => void;
  onChatDeleted: () => void;
  refreshTrigger?: number;
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function ChatSidebar({
  currentChatId,
  onSelectChat,
  onCreateNewChat,
  onChatDeleted,
  refreshTrigger,
  isOpen: controlledIsOpen,
  onOpenChange,
}: ChatSidebarProps) {
  const [internalIsOpen, setInternalIsOpen] = useState(true);
  const isOpen = controlledIsOpen !== undefined ? controlledIsOpen : internalIsOpen;
  const setIsOpen = onOpenChange || setInternalIsOpen;
  const [chats, setChats] = useState<ChatHistory[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadChats();
  }, [refreshTrigger]);

  const loadChats = async () => {
    try {
      setIsLoading(true);
      const allChats = await chatStorage.getAllChats();
      setChats(allChats);
    } catch (error) {
      console.error("Failed to load chats:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteChat = async (
    e: React.MouseEvent,
    chatId: string
  ) => {
    e.stopPropagation();
    try {
      await chatStorage.deleteChat(chatId);
      await loadChats();
      if (chatId === currentChatId) {
        onCreateNewChat();
      }
      onChatDeleted();
    } catch (error) {
      console.error("Failed to delete chat:", error);
    }
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

    if (diffInDays === 0) {
      return "Today";
    } else if (diffInDays === 1) {
      return "Yesterday";
    } else if (diffInDays < 7) {
      return `${diffInDays} days ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  return (
    <>

      {/* Sidebar */}
      <aside
        className={cn(
          "h-full border-r bg-background transition-all duration-300",
          // Mobile: fixed positioning, slides in/out
          "fixed left-0 top-0 z-40 w-64",
          isOpen ? "translate-x-0" : "-translate-x-full",
          // Desktop: relative positioning, adjust width
          "lg:relative lg:z-auto lg:translate-x-0",
          isOpen ? "lg:w-64" : "lg:w-0 lg:overflow-hidden lg:border-0"
        )}
      >
        <div className="flex h-full w-64 flex-col lg:w-full">
          {/* Header */}
          <div className="flex items-center justify-between border-b px-4 py-3">
            <h2 className="text-lg font-semibold">Chat History</h2>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsOpen(false)}
            >
              <ChevronLeft className="h-4 w-4 hidden lg:block" />
              <X className="h-4 w-4 lg:hidden" />
              <span className="sr-only">Close sidebar</span>
            </Button>
          </div>

          {/* Create New Chat Button */}
          <div className="border-b p-4">
            <Button
              onClick={onCreateNewChat}
              className="w-full"
              variant="default"
            >
              <Plus className="mr-2 h-4 w-4" />
              New Chat
            </Button>
          </div>

          {/* Chat List */}
          <ScrollArea className="flex-1">
            {isLoading ? (
              <div className="p-4 text-center text-sm text-muted-foreground">
                Loading...
              </div>
            ) : chats.length === 0 ? (
              <div className="p-4 text-center text-sm text-muted-foreground">
                No chat history
              </div>
            ) : (
              <div className="p-2">
                {chats.map((chat) => (
                  <div
                    key={chat.id}
                    className={cn(
                      "group relative mb-1 rounded-lg p-3 transition-colors hover:bg-accent cursor-pointer",
                      currentChatId === chat.id && "bg-accent"
                    )}
                    onClick={() => {
                      onSelectChat(chat.id);
                      setIsOpen(false);
                    }}
                  >
                    <div className="pr-8">
                      <p className="text-sm font-medium line-clamp-2">
                        {chat.title}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {formatDate(chat.updatedAt)}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute right-1 top-1 h-6 w-6 opacity-0 transition-opacity group-hover:opacity-100"
                      onClick={(e) => handleDeleteChat(e, chat.id)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </div>
      </aside>

    </>
  );
}

