import React from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { FileText, LayoutDashboard, Printer, ChevronLeft, ChevronDown, UserCheck, RefreshCw } from 'lucide-react';

interface CSAFormFooterProps {
  isReadOnly: boolean;
  isPending: boolean;
  isAuthenticating: boolean;
  hasSamples: boolean;
  hideLine2Actions?: boolean;
  onBackToList: () => void;
  onPrint: (layout: 'detailed' | 'summary') => void;
  onSaveDraft: () => void;
}

export function CSAFormFooter({
  isReadOnly,
  isPending,
  isAuthenticating,
  hasSamples,
  hideLine2Actions = false,
  onBackToList,
  onPrint,
  onSaveDraft,
}: CSAFormFooterProps) {
  const { t } = useTranslation();
  return (
    <div className="sticky bottom-[calc(3.5rem+env(safe-area-inset-bottom,0px))] md:bottom-0 z-10 flex flex-col-reverse sm:flex-row sm:justify-end flex-wrap gap-2 border-t border-slate-100 bg-white p-4 sm:p-0 py-3 pb-[calc(0.75rem+env(safe-area-inset-bottom,0px))] sm:pb-0 md:static md:z-auto md:gap-3 md:border-0 md:bg-transparent md:py-0 md:pb-0">
      <Button variant="outline" type="button" onClick={onBackToList} className="px-8 font-bold w-full sm:w-auto h-11 sm:h-10 min-h-[44px]">
        {isReadOnly ? <ChevronLeft className="h-4 w-4 mr-2" /> : null}
        {isReadOnly ? t('csa_hub:form.table.backToList') : t('common:actions.cancel')}
      </Button>

      {!hideLine2Actions && (isReadOnly || hasSamples) && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              type="button"
              className="bg-mancity-pattern hover:opacity-90 text-primary-foreground font-black px-8 h-11 sm:h-12 min-h-[44px] w-full sm:w-auto gap-2 shadow-xl uppercase tracking-widest"
            >
              <Printer className="h-5 w-5" /> {t('csa_hub:actions.exportApp7a')} <ChevronDown className="h-4 w-4 ml-1" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuItem className="text-xs font-bold gap-2 py-3 cursor-pointer" onClick={() => onPrint('detailed')}>
              <FileText className="h-4 w-4 text-primary" /> {t('csa_hub:actions.layoutDetailed')}
            </DropdownMenuItem>
            <DropdownMenuItem className="text-xs font-bold gap-2 py-3 cursor-pointer" onClick={() => onPrint('summary')}>
              <LayoutDashboard className="h-4 w-4 text-primary" /> {t('csa_hub:actions.layoutSummary')}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}

      {!isReadOnly && (
        <>
          <Button
            type="button"
            disabled={isPending || isAuthenticating}
            onClick={onSaveDraft}
            className="bg-mancity-pattern hover:opacity-90 text-primary-foreground font-black px-8 h-11 sm:h-12 min-h-[44px] w-full sm:w-auto gap-2 shadow-xl shadow-blue-100 uppercase tracking-widest"
          >
            {isPending ? <RefreshCw className="h-5 w-5 animate-spin" /> : <FileText className="h-5 w-5" />}
            {t('csa_hub:actions.saveDraft')}
          </Button>
          <Button
            disabled={isPending || isAuthenticating}
            type="submit"
            className="bg-mancity-pattern hover:opacity-90 text-primary-foreground font-black px-12 h-11 sm:h-12 min-h-[44px] w-full sm:w-auto gap-2 shadow-md uppercase tracking-widest"
          >
            {isAuthenticating ? <RefreshCw className="h-5 w-5 animate-spin" /> : <UserCheck className="h-5 w-5" />}
            {t('csa_hub:actions.save')}
          </Button>
        </>
      )}
    </div>
  );
}
