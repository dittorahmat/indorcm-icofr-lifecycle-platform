import React from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Languages } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { authClient } from '@/lib/auth-client';
import { toast } from 'sonner';

export function LanguageSwitcher() {
  const { i18n } = useTranslation();
  const { data: session } = authClient.useSession();

  const changeLanguage = async (lng: string) => {
    try {
      // 1. Update i18n locally for immediate feedback
      await i18n.changeLanguage(lng);
      
      // 2. Update database profile if logged in
      if (session?.user) {
        try {
          const response = await fetch('/api/user/profile', {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ language: lng }),
          });
          
          if (!response.ok) {
            throw new Error('Failed to update language profile');
          }

          // 3. Refresh session to sync with new language
          // We wrap this in another try-catch because if it fails (like the 405 error),
          // the DB is already updated and we can just reload the page as a fallback.
          try {
            await authClient.getSession({ force: true });
          } catch (sessionError) {
            console.warn('Session refresh failed, performing full reload as fallback', sessionError);
            window.location.reload();
            return;
          }
        } catch (dbError) {
          console.error('Error updating database language:', dbError);
          // If DB update fails, we still have local UI update, but we warn the user
          toast.error('Failed to save language preference to profile');
          return;
        }
      }
      
      toast.success(lng === 'id' ? 'Bahasa diubah ke Indonesia' : 'Language changed to English');
    } catch (error) {
      console.error('Error changing language:', error);
      toast.error('Failed to change language');
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="w-full justify-start gap-2 px-2">
          <Languages className="h-4 w-4" />
          <span>{i18n.language === 'id' ? 'Bahasa Indonesia' : 'English'}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => changeLanguage('en')}>
          English
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => changeLanguage('id')}>
          Bahasa Indonesia
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
