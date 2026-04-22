import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Blocker } from "react-router-dom";
import { useTranslation } from "react-i18next";

interface UnsavedChangesDialogProps {
  blocker: Blocker;
}

/**
 * A reusable dialog to show when a user attempts to navigate away with unsaved changes.
 * Integrates with React Router's blocker state.
 */
export function UnsavedChangesDialog({ blocker }: UnsavedChangesDialogProps) {
  // We use i18n if available, otherwise fallback to English
  // The project uses react-i18next as seen in ScopingPage.tsx
  const { t } = useTranslation();

  if (blocker.state !== "blocked") return null;

  return (
    <AlertDialog open={blocker.state === "blocked"}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {t('unsavedChanges.title')}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {t('unsavedChanges.description')}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={() => blocker.reset?.()}>
            {t('unsavedChanges.stay')}
          </AlertDialogCancel>
          <AlertDialogAction 
            onClick={() => blocker.proceed?.()}
            className="bg-red-600 hover:bg-red-700 text-white"
          >
            {t('unsavedChanges.discard')}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
