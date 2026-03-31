import React from 'react';
import { X, Trash2, MessageSquare } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ChatMessage, ChatMessageList } from './ChatMessageList';
import { ChatInput } from './ChatInput';
import { api } from '@/lib/api-client';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface AIChatModalProps {
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

export function AIChatModal({ isOpen, onClose }: AIChatModalProps) {
  const [messages, setMessages] = React.useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);
  const [conversationId, setConversationId] = React.useState<string | null>(null);

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

  const handleSend = async (content: string) => {
    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content,
      timestamp: Date.now(),
    };

    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setIsLoading(true);

    try {
      // Get conversation history for context (last 10 messages)
      const conversationHistory = messages.slice(-10).map(msg => ({
        role: msg.role,
        content: msg.content,
      }));

      const response = await api<{ response: string }>('/api/ai/chat', {
        method: 'POST',
        body: JSON.stringify({
          message: content,
          conversationHistory,
        }),
      });

      const aiMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: response.response,
        timestamp: Date.now(),
      };

      const finalMessages = [...newMessages, aiMessage];
      setMessages(finalMessages);
      saveToHistory(finalMessages);
    } catch (error: any) {
      console.error('Chat error:', error);
      const errorMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: error.message || 'Maaf, terjadi kesalahan. Silakan coba lagi.',
        timestamp: Date.now(),
      };
      setMessages([...newMessages, errorMessage]);
      toast.error('Gagal mengirim pesan');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearHistory = () => {
    try {
      localStorage.removeItem(STORAGE_KEY);
      setMessages([]);
      setConversationId(null);
      toast.success('Riwayat chat dihapus');
    } catch (error) {
      console.error('Failed to clear history:', error);
      toast.error('Gagal menghapus riwayat');
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      if (!open) onClose();
    }}>
      <DialogContent className="sm:max-w-[600px] h-[70vh] flex flex-col p-0 gap-0" aria-describedby="chat-modal-description">
        <DialogHeader className="px-6 py-4 border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-primary" />
              <DialogTitle>Asisten AI ICOFR</DialogTitle>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={handleClearHistory}
                disabled={messages.length === 0}
                title="Hapus riwayat chat"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" onClick={onClose}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </DialogHeader>
        
        <div id="chat-modal-description" className="sr-only">
          Chat dengan AI asisten ICOFR untuk pertanyaan tentang SK-5/DKU.MBU/11/2024
        </div>

        <ChatMessageList messages={messages} isLoading={isLoading} />

        <ChatInput
          onSend={handleSend}
          disabled={isLoading}
          placeholder="Tanyakan tentang SK-5/DKU.MBU/11/2024..."
        />
      </DialogContent>
    </Dialog>
  );
}
