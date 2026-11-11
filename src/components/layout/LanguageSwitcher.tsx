import React from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Languages } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTheme } from '@/hooks/use-theme';

export function LanguageSwitcher() {
  const { t, i18n } = useTranslation('common');
  const { isDark } = useTheme();

  const toggleLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
    localStorage.setItem('i18nextLng', lng);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="ghost" 
          size="icon" 
          aria-label={t('common:actions.switchLanguage', { defaultValue: 'Switch language' })}
          className={cn(
            "h-11 w-11 sm:h-9 sm:w-9 min-h-[44px] min-w-[44px] sm:min-h-0 sm:min-w-0",
            isDark 
              ? "text-slate-300 hover:text-white hover:bg-slate-800" 
              : "text-muted-foreground hover:text-foreground hover:bg-surface-container"
          )}
        >
          <Languages className="h-4 w-4" aria-hidden="true" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => toggleLanguage('en')} className={cn(i18n.language === 'en' && "bg-accent font-bold")}>
          English
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => toggleLanguage('id')} className={cn(i18n.language === 'id' && "bg-accent font-bold")}>
          Bahasa Indonesia
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
