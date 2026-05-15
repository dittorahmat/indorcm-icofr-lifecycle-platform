import React from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import ReactMarkdown from 'react-markdown';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

interface ChatMessageListProps {
  messages: ChatMessage[];
  isLoading?: boolean;
}

export function ChatMessageList({ messages, isLoading }: ChatMessageListProps) {
  const { t } = useTranslation('ai');
  const scrollRef = React.useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  React.useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  return (
    <ScrollArea className="flex-1 px-4">
      <div className="space-y-4 py-4">
        {messages.length === 0 ? (
          <div className="text-center text-muted-foreground py-8">
            <p className="text-sm font-medium">
              {t('welcomeMessage')}
            </p>
            <p className="text-xs mt-2 opacity-70">
              {t('welcomeSubtitle')}
            </p>
          </div>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className={cn(
                "flex",
                message.role === 'user' ? 'justify-end' : 'justify-start'
              )}
            >
              <div
                className={cn(
                  "max-w-[85%] rounded-2xl px-4 py-2 text-sm",
                  message.role === 'user'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-foreground'
                )}
              >
                <div className="prose prose-sm dark:prose-invert max-w-none break-words">
                  <ReactMarkdown
                    components={{
                      a: ({ node, href, ...props }) => {
                        const isInternal = href?.startsWith('/');
                        if (isInternal) {
                          return (
                            <Link 
                              to={href!} 
                              className="text-primary underline hover:opacity-80 font-medium"
                            >
                              {props.children}
                            </Link>
                          );
                        }
                        return (
                          <a 
                            href={href}
                            {...props} 
                            className="text-primary underline hover:opacity-80 font-medium" 
                            target="_blank" 
                            rel="noopener noreferrer" 
                          />
                        );
                      },
                      p: ({ node, ...props }) => <p {...props} className="mb-2 last:mb-0" />,
                      ul: ({ node, ...props }) => <ul {...props} className="list-disc pl-4 mb-2" />,
                      ol: ({ node, ...props }) => <ol {...props} className="list-decimal pl-4 mb-2" />,
                      li: ({ node, ...props }) => <li {...props} className="mb-1" />,
                    }}
                  >
                    {message.content}
                  </ReactMarkdown>
                </div>
                <div
                  className={cn(
                    "text-[10px] mt-1 opacity-70",
                    message.role === 'user' ? 'text-primary-foreground' : 'text-muted-foreground'
                  )}
                >
                  {new Date(message.timestamp).toLocaleTimeString('id-ID', {
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </div>
              </div>
            </div>
          ))
        )}

        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-muted rounded-2xl px-4 py-3 text-sm">
              <div className="flex items-center gap-2">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce [animation-delay:-0.3s]" />
                  <div className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce [animation-delay:-0.15s]" />
                  <div className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce" />
                </div>
                <span className="text-muted-foreground">{t('thinking')}</span>
              </div>
            </div>
          </div>
        )}

        <div ref={scrollRef} />
      </div>
    </ScrollArea>
  );
}
