import * as React from "react"
import { Button } from "@/components/ui/button"
import { ExternalLink } from "lucide-react"
import { cn } from "@/lib/utils"
import type { Source } from "@/lib/api"

interface SourcesProps extends React.HTMLAttributes<HTMLDivElement> {
  sources?: Source[]
}

const Sources = React.forwardRef<HTMLDivElement, SourcesProps>(
  ({ className, sources, ...props }, ref) => {
    const [isOpen, setIsOpen] = React.useState(false)

    if (!sources || sources.length === 0) return null

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
          {isOpen ? "Hide" : "Show"} {sources.length} source{sources.length !== 1 ? "s" : ""}
        </Button>
        {isOpen && (
          <div className="flex flex-col gap-2">
            {sources.map((source, index) => (
              <SourcesContent key={source.id || index} source={source} />
            ))}
          </div>
        )}
      </div>
    )
  }
)
Sources.displayName = "Sources"

const SourcesContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    source: Source
  }
>(({ className, source, ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={cn(
        "flex items-center gap-2 rounded-md border bg-muted/50 p-2 text-xs",
        className
      )}
      {...props}
    >
      <span className="flex-1 truncate">{source.title || source.snippet}</span>
      {source.url && (
        <a
          href={source.url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary hover:underline"
        >
          <ExternalLink className="h-3 w-3" />
        </a>
      )}
    </div>
  )
})
SourcesContent.displayName = "SourcesContent"

const SourcesTrigger = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement> & {
    count?: number
    isOpen?: boolean
    onToggle?: () => void
  }
>(({ className, count = 0, isOpen, onToggle, children, ...props }, ref) => {
  return (
    <Button
      ref={ref}
      variant="ghost"
      size="sm"
      onClick={onToggle}
      className={cn("h-auto p-0 text-xs", className)}
      {...props}
    >
      {children || `${isOpen ? "Hide" : "Show"} ${count} source${count !== 1 ? "s" : ""}`}
    </Button>
  )
})
SourcesTrigger.displayName = "SourcesTrigger"

export { Sources, SourcesContent, SourcesTrigger }

