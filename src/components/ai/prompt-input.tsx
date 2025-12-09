import * as React from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send } from "lucide-react";
import { cn } from "@/lib/utils";

interface PromptInputContextValue {
  onSubmit: (value: string) => void;
  disabled?: boolean;
}

const PromptInputContext = React.createContext<
  PromptInputContextValue | undefined
>(undefined);

const usePromptInput = () => {
  const context = React.useContext(PromptInputContext);
  if (!context) {
    throw new Error("PromptInput components must be used within PromptInput");
  }
  return context;
};

interface PromptInputProps
  extends Omit<React.FormHTMLAttributes<HTMLFormElement>, "onSubmit"> {
  onSubmit: (value: string) => void;
  disabled?: boolean;
}

const PromptInput = React.forwardRef<HTMLFormElement, PromptInputProps>(
  ({ className, onSubmit, disabled, children, ...props }, ref) => {
    const handleSubmit = React.useCallback(
      (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        const value = formData.get("prompt") as string;
        if (value?.trim() && !disabled) {
          onSubmit(value.trim());
          e.currentTarget.reset();
        }
      },
      [onSubmit, disabled]
    );

    return (
      <PromptInputContext.Provider value={{ onSubmit, disabled }}>
        <form
          ref={ref}
          onSubmit={handleSubmit}
          className={cn("flex w-full flex-col gap-2", className)}
          {...props}
        >
          {children}
        </form>
      </PromptInputContext.Provider>
    );
  }
);
PromptInput.displayName = "PromptInput";

const PromptInputTextarea = React.forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(({ className, onKeyDown, ...props }, ref) => {
  const { disabled } = usePromptInput();

  const handleKeyDown = React.useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        const form = e.currentTarget.form;
        if (form && !disabled) {
          form.requestSubmit();
        }
      }
      onKeyDown?.(e);
    },
    [onKeyDown, disabled]
  );

  return (
    <Textarea
      ref={ref}
      name="prompt"
      className={cn("min-h-[60px] resize-none", className)}
      onKeyDown={handleKeyDown}
      disabled={disabled}
      {...props}
    />
  );
});
PromptInputTextarea.displayName = "PromptInputTextarea";

const PromptInputToolbar = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={cn("flex items-center justify-between", className)}
      {...props}
    />
  );
});
PromptInputToolbar.displayName = "PromptInputToolbar";

const PromptInputSubmit = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement>
>(({ className, ...props }, ref) => {
  const { disabled } = usePromptInput();

  return (
    <Button
      ref={ref}
      type="submit"
      size="icon"
      disabled={disabled}
      className={cn("h-9 w-9", className)}
      {...props}
    >
      <Send className="h-4 w-4" />
      <span className="sr-only">Send message</span>
    </Button>
  );
});
PromptInputSubmit.displayName = "PromptInputSubmit";

export {
  PromptInput,
  PromptInputTextarea,
  PromptInputToolbar,
  PromptInputSubmit,
};
