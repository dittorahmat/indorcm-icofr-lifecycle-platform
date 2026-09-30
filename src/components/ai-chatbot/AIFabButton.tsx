import React from 'react';
import { Bot, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';

interface AIFabButtonProps {
  isOpen: boolean;
  onToggle: () => void;
}

export function AIFabButton({ isOpen, onToggle }: AIFabButtonProps) {
  const { t } = useTranslation('ai');

  const label = isOpen 
    ? t('fab.close', { defaultValue: 'Close chat' }) 
    : t('fab.open', { defaultValue: 'Ask ICOFR AI' });

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <motion.div
            className="fixed bottom-[calc(4.5rem+env(safe-area-inset-bottom,0px))] md:bottom-6 right-4 md:right-6 z-[1050]"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.3 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Button
              onClick={onToggle}
              size="lg"
              aria-label={label}
              aria-expanded={isOpen}
              className="h-14 w-14 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 bg-primary hover:bg-primary/90"
            >
              <AnimatePresence mode="wait">
                {isOpen ? (
                  <motion.div
                    key="close"
                    initial={{ rotate: -90, opacity: 0 }}
                    animate={{ rotate: 0, opacity: 1 }}
                    exit={{ rotate: 90, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <X className="h-6 w-6" aria-hidden="true" />
                  </motion.div>
                ) : (
                  <motion.div
                    key="bot"
                    initial={{ rotate: 90, opacity: 0 }}
                    animate={{ rotate: 0, opacity: 1 }}
                    exit={{ rotate: -90, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Bot className="h-6 w-6" aria-hidden="true" />
                  </motion.div>
                )}
              </AnimatePresence>
            </Button>
          </motion.div>
        </TooltipTrigger>
        <TooltipContent side="left" className="text-sm font-medium">
          {label}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
