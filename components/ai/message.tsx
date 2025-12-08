"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { Bot, User } from "lucide-react"

interface MessageProps extends React.HTMLAttributes<HTMLDivElement> {
  from: "user" | "assistant"
}

const Message = React.forwardRef<HTMLDivElement, MessageProps>(
  ({ className, from, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "group relative flex w-full gap-4",
          from === "user" ? "justify-end" : "justify-start",
          className
        )}
        {...props}
      >
        {children}
      </div>
    )
  }
)
Message.displayName = "Message"

const MessageAvatar = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    src?: string
    name?: string
    from?: "user" | "assistant"
  }
>(({ className, src, name, from = "assistant", ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={cn(
        "flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
        from === "user"
          ? "bg-primary text-primary-foreground order-2"
          : "bg-muted",
        className
      )}
      {...props}
    >
      {src ? (
        <img src={src} alt={name || ""} className="h-full w-full rounded-full" />
      ) : from === "user" ? (
        <User className="h-4 w-4" />
      ) : (
        <Bot className="h-4 w-4" />
      )}
    </div>
  )
})
MessageAvatar.displayName = "MessageAvatar"

const MessageContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    from?: "user" | "assistant"
  }
>(({ className, from = "assistant", children, ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={cn(
        "flex flex-col gap-2 max-w-[80%]",
        from === "user" ? "items-end" : "items-start",
        className
      )}
      {...props}
    >
      <div
        className={cn(
          "rounded-lg px-4 py-2 text-sm",
          from === "user"
            ? "bg-primary text-primary-foreground"
            : "bg-muted",
          className
        )}
      >
        {children}
      </div>
    </div>
  )
})
MessageContent.displayName = "MessageContent"

export { Message, MessageAvatar, MessageContent }

