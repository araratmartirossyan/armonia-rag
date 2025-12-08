import * as React from "react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Button } from "@/components/ui/button"
import { ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"

interface ConversationContextValue {
  scrollToBottom: () => void
  isAtBottom: boolean
  setIsAtBottom: (value: boolean) => void
}

const ConversationContext = React.createContext<ConversationContextValue | undefined>(undefined)

const useConversation = () => {
  const context = React.useContext(ConversationContext)
  if (!context) {
    throw new Error("Conversation components must be used within Conversation")
  }
  return context
}

interface ConversationProps extends React.HTMLAttributes<HTMLDivElement> {}

const Conversation = React.forwardRef<HTMLDivElement, ConversationProps>(
  ({ className, children, ...props }, ref) => {
    const [isAtBottom, setIsAtBottom] = React.useState(true)
    const viewportRef = React.useRef<HTMLDivElement>(null)

    const scrollToBottom = React.useCallback(() => {
      if (viewportRef.current) {
        viewportRef.current.scrollTo({
          top: viewportRef.current.scrollHeight,
          behavior: "smooth",
        })
      }
    }, [])

    const handleScroll = React.useCallback(() => {
      if (viewportRef.current) {
        const { scrollTop, scrollHeight, clientHeight } = viewportRef.current
        const isNearBottom = scrollHeight - scrollTop - clientHeight < 100
        setIsAtBottom(isNearBottom)
      }
    }, [])

    React.useEffect(() => {
      const viewport = viewportRef.current
      if (viewport) {
        viewport.addEventListener("scroll", handleScroll)
        return () => viewport.removeEventListener("scroll", handleScroll)
      }
    }, [handleScroll])


    const contextValue = React.useMemo(
      () => ({
        scrollToBottom,
        isAtBottom,
        setIsAtBottom,
      }),
      [scrollToBottom, isAtBottom]
    )

    return (
      <ConversationContext.Provider value={contextValue}>
        <div
          ref={ref}
          className={cn("relative flex h-full w-full flex-col overflow-hidden", className)}
          {...props}
        >
          <div
            ref={viewportRef}
            className="h-full w-full overflow-y-auto"
            onScroll={handleScroll}
          >
            {children}
          </div>
        </div>
      </ConversationContext.Provider>
    )
  }
)
Conversation.displayName = "Conversation"

const ConversationContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={cn("flex flex-col gap-4 p-4", className)}
      {...props}
    />
  )
})
ConversationContent.displayName = "ConversationContent"

const ConversationScrollButton = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement>
>(({ className, ...props }, ref) => {
  const { scrollToBottom, isAtBottom } = useConversation()

  if (isAtBottom) return null

  return (
    <Button
      ref={ref}
      variant="outline"
      size="icon"
      className={cn(
        "absolute bottom-20 right-4 z-10 h-8 w-8 rounded-full shadow-md",
        className
      )}
      onClick={scrollToBottom}
      {...props}
    >
      <ChevronDown className="h-4 w-4" />
      <span className="sr-only">Scroll to bottom</span>
    </Button>
  )
})
ConversationScrollButton.displayName = "ConversationScrollButton"

export { Conversation, ConversationContent, ConversationScrollButton }

