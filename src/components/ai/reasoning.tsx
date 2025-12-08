import * as React from "react"
import { Button } from "@/components/ui/button"
import { ChevronDown, ChevronUp } from "lucide-react"
import { cn } from "@/lib/utils"

interface ReasoningProps extends React.HTMLAttributes<HTMLDivElement> {
  content?: string
  defaultOpen?: boolean
}

const Reasoning = React.forwardRef<HTMLDivElement, ReasoningProps>(
  ({ className, content, defaultOpen = false, ...props }, ref) => {
    const [isOpen, setIsOpen] = React.useState(defaultOpen)

    if (!content) return null

    return (
      <div
        ref={ref}
        className={cn("flex flex-col gap-2", className)}
        {...props}
      >
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsOpen(!isOpen)}
          className="h-auto p-0 text-xs text-muted-foreground hover:text-foreground"
        >
          {isOpen ? (
            <>
              <ChevronUp className="mr-1 h-3 w-3" />
              Hide reasoning
            </>
          ) : (
            <>
              <ChevronDown className="mr-1 h-3 w-3" />
              Show reasoning
            </>
          )}
        </Button>
        {isOpen && (
          <div className="rounded-md border bg-muted/50 p-3 text-xs text-muted-foreground">
            {content}
          </div>
        )}
      </div>
    )
  }
)
Reasoning.displayName = "Reasoning"

const ReasoningTrigger = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement> & {
    isOpen?: boolean
    onToggle?: () => void
  }
>(({ className, isOpen, onToggle, children, ...props }, ref) => {
  return (
    <Button
      ref={ref}
      variant="ghost"
      size="sm"
      onClick={onToggle}
      className={cn("h-auto p-0 text-xs", className)}
      {...props}
    >
      {children}
    </Button>
  )
})
ReasoningTrigger.displayName = "ReasoningTrigger"

const ReasoningContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={cn("rounded-md border bg-muted/50 p-3 text-xs", className)}
      {...props}
    />
  )
})
ReasoningContent.displayName = "ReasoningContent"

export { Reasoning, ReasoningTrigger, ReasoningContent }

