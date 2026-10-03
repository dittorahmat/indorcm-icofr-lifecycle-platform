import React from 'react';
import { Trash2, MessageSquare, Bot } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { ChatMessage, ChatMessageList } from './ChatMessageList';
import { ChatInput } from './ChatInput';
import { api } from '@/lib/api-client';
import { toast } from 'sonner';
import { useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useOrganizationBranding } from '@/hooks/use-organization-branding';

interface AIChatDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

const STORAGE_KEY = 'icofr_ai_chat_history';

interface ChatHistory {
  conversations: Array<{
    id: string;
    createdAt: number;
    updatedAt: number;
    messages: ChatMessage[];
  }>;
  currentConversationId: string | null;
}

export function AIChatDrawer({ isOpen, onClose }: AIChatDrawerProps) {
  const { t } = useTranslation('ai');
  const [messages, setMessages] = React.useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);
  const [conversationId, setConversationId] = React.useState<string | null>(null);
  const [pendingAction, setPendingAction] = React.useState<any | null>(null);
  const location = useLocation();
  const { companyName } = useOrganizationBranding();

  // Load chat history from localStorage on mount
  React.useEffect(() => {
    if (isOpen) {
      loadChatHistory();
    }
  }, [isOpen]);

  const loadChatHistory = () => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const history: ChatHistory = JSON.parse(stored);
        if (history.currentConversationId && history.conversations.length > 0) {
          const currentConv = history.conversations.find(
            c => c.id === history.currentConversationId
          );
          if (currentConv) {
            setMessages(currentConv.messages);
            setConversationId(currentConv.id);
            return;
          }
        }
      }
      // No existing conversation, start fresh
      setMessages([]);
      setConversationId(null);
    } catch (error) {
      console.error('Failed to load chat history:', error);
      setMessages([]);
      setConversationId(null);
    }
  };

  const saveToHistory = (newMessages: ChatMessage[]) => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      let history: ChatHistory = stored
        ? JSON.parse(stored)
        : { conversations: [], currentConversationId: null };

      const now = Date.now();

      if (conversationId) {
        // Update existing conversation
        history.conversations = history.conversations.map(conv =>
          conv.id === conversationId
            ? { ...conv, messages: newMessages, updatedAt: now }
            : conv
        );
      } else {
        // Create new conversation
        const newConvId = crypto.randomUUID();
        history.conversations.push({
          id: newConvId,
          createdAt: now,
          updatedAt: now,
          messages: newMessages,
        });
        history.currentConversationId = newConvId;
        setConversationId(newConvId);
      }

      localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
    } catch (error) {
      console.error('Failed to save chat history:', error);
    }
  };

  const handleSend = async (content: string, actionConfirmation?: any) => {
    if (!content.trim() && !actionConfirmation) return;

    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: content || (actionConfirmation ? "Konfirmasi aksi" : ""),
      timestamp: Date.now(),
    };

    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setIsLoading(true);
    setPendingAction(null); // Clear pending action when sending a new message

    try {
      // Get conversation history for context (last 10 messages)
      const conversationHistory = messages.slice(-10).map(msg => ({
        role: msg.role,
        content: msg.content,
      }));

      const response = await api<{ response: string; pendingAction?: any }>('/api/ai/chat', {
        method: 'POST',
        body: JSON.stringify({
          message: content,
          conversationHistory,
          context: {
            path: location.pathname,
            timestamp: new Date().toISOString(),
            organization: companyName,
            sector: 'Financial/Banking'
          },
          actionConfirmation
        }),
      });

      const aiMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: response.response,
        timestamp: Date.now(),
      };

      if (response.pendingAction) {
        setPendingAction(response.pendingAction);
      }

      const finalMessages = [...newMessages, aiMessage];
      setMessages(finalMessages);
      saveToHistory(finalMessages);
    } catch (error: any) {
      console.error('Chat error:', error);
      const errorMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: error.message || t('defaultErrorMessage'),
        timestamp: Date.now(),
      };
      setMessages([...newMessages, errorMessage]);
      toast.error(t('sendError'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirmAction = () => {
    if (!pendingAction) return;
    handleSend("Ya, setuju. Lanjutkan.", pendingAction);
  };

  const handleClearHistory = () => {
    try {
      localStorage.removeItem(STORAGE_KEY);
      setMessages([]);
      setConversationId(null);
      toast.success(t('clearHistorySuccess'));
    } catch (error) {
      console.error('Failed to clear history:', error);
      toast.error(t('clearHistoryError'));
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={(open) => {
      if (!open) onClose();
    }}>
      <SheetContent 
        side="right" 
        className="w-full sm:max-w-[500px] flex flex-col p-0 gap-0 border-l"
      >
        <SheetHeader className="px-6 py-4 border-b flex-shrink-0">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                <Bot className="h-5 w-5 text-primary" />
              </div>
              <div>
                <SheetTitle className="text-left">{t('drawerTitle')}</SheetTitle>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleClearHistory}
              disabled={messages.length === 0}
              title={t('clearHistory')}
              className="h-8 w-8 text-muted-foreground hover:text-destructive"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </SheetHeader>
        
        <div className="flex-1 overflow-hidden flex flex-col relative">
          <ChatMessageList messages={messages} isLoading={isLoading} />
          
          {pendingAction && (
            <div className="absolute bottom-4 left-0 right-0 px-4 animate-in fade-in slide-in-from-bottom-2">
              <div className="bg-primary/5 border border-primary/20 rounded-lg p-3 flex flex-col gap-3 shadow-lg">
                <p className="text-sm font-medium text-primary flex items-center gap-2">
                  <Bot className="h-4 w-4" /> Konfirmasi Aksi
                </p>
                <div className="flex gap-2">
                  <Button 
                    size="sm" 
                    className="flex-1" 
                    onClick={handleConfirmAction}
                  >
                    Setuju & Jalankan
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="flex-1" 
                    onClick={() => setPendingAction(null)}
                  >
                    Batal
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="p-4 border-t bg-background">
          <ChatInput
            onSend={handleSend}
            disabled={isLoading}
            placeholder={t('inputPlaceholder')}
          />
          <p className="mt-2 text-xs text-center text-muted-foreground">
            {t('disclaimer')}
          </p>
        </div>
      </SheetContent>
    </Sheet>
  );
}
