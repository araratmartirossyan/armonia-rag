import { useState, useEffect, useRef } from "react"
import { useNavigate } from "react-router-dom"
import { apiClient, type ChatMessage, type Source } from "@/lib/api"
import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
} from "@/components/ai/conversation"
import { Message, MessageAvatar, MessageContent } from "@/components/ai/message"
import {
  PromptInput,
  PromptInputTextarea,
  PromptInputToolbar,
  PromptInputSubmit,
} from "@/components/ai/prompt-input"
import { Reasoning } from "@/components/ai/reasoning"
import { Sources } from "@/components/ai/sources"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { LogOut, Upload, Loader2 } from "lucide-react"

export default function ChatPage() {
  const navigate = useNavigate()
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState("")
  const [isStreaming, setIsStreaming] = useState(false)
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false)
  const [uploadFile, setUploadFile] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const streamingMessageRef = useRef<string>("")
  const currentMessageIdRef = useRef<string | null>(null)

  useEffect(() => {
    if (!apiClient.isAuthenticated()) {
      navigate("/login")
    }
  }, [navigate])

  const handleSubmit = async (value: string) => {
    if (!value.trim() || isStreaming) return

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      content: value,
      role: "user",
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInput("")
    setIsStreaming(true)

    const assistantMessageId = (Date.now() + 1).toString()
    currentMessageIdRef.current = assistantMessageId
    streamingMessageRef.current = ""

    const assistantMessage: ChatMessage = {
      id: assistantMessageId,
      content: "",
      role: "assistant",
      timestamp: new Date(),
      isStreaming: true,
    }

    setMessages((prev) => [...prev, assistantMessage])

    try {
      await apiClient.chat(value, undefined, (chunk) => {
        streamingMessageRef.current += chunk
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === assistantMessageId
              ? { ...msg, content: streamingMessageRef.current, isStreaming: true }
              : msg
          )
        )
      })

      // Finalize the message
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === assistantMessageId
            ? {
                ...msg,
                content: streamingMessageRef.current,
                isStreaming: false,
              }
            : msg
        )
      )
    } catch (error) {
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === assistantMessageId
            ? {
                ...msg,
                content: error instanceof Error ? error.message : "An error occurred",
                isStreaming: false,
              }
            : msg
        )
      )
    } finally {
      setIsStreaming(false)
      currentMessageIdRef.current = null
      streamingMessageRef.current = ""
    }
  }

  const handleLogout = () => {
    apiClient.logout()
    navigate("/login")
  }

  const handleFileUpload = async () => {
    if (!uploadFile) return

    setIsUploading(true)
    try {
      await apiClient.uploadDocument(uploadFile)
      setIsUploadDialogOpen(false)
      setUploadFile(null)
      // You could show a success message here
    } catch (error) {
      alert(error instanceof Error ? error.message : "Upload failed")
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <div className="flex h-screen w-full flex-col">
      {/* Header */}
      <header className="border-b bg-background px-4 py-3">
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-semibold">AI Chatbot</h1>
          <div className="flex items-center gap-2">
            <Dialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="icon">
                  <Upload className="h-4 w-4" />
                  <span className="sr-only">Upload document</span>
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Upload Document</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <Input
                    type="file"
                    accept=".pdf"
                    onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                    disabled={isUploading}
                  />
                  <Button
                    onClick={handleFileUpload}
                    disabled={!uploadFile || isUploading}
                    className="w-full"
                  >
                    {isUploading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Uploading...
                      </>
                    ) : (
                      "Upload"
                    )}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
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
                <p className="text-sm">Ask me anything or upload a document for context</p>
              </div>
            </div>
          )}
          {messages.map((message) => (
            <Message key={message.id} from={message.role}>
              <MessageAvatar from={message.role} />
              <MessageContent from={message.role}>
                {message.content || (message.isStreaming && (
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
        <PromptInput onSubmit={handleSubmit} disabled={isStreaming}>
          <PromptInputTextarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask me anything..."
            disabled={isStreaming}
          />
          <PromptInputToolbar>
            <PromptInputSubmit disabled={!input.trim() || isStreaming} />
          </PromptInputToolbar>
        </PromptInput>
      </div>
    </div>
  )
}

