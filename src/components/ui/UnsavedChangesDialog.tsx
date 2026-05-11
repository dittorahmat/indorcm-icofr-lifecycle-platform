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
  title?: string;
  description?: string;
}

/**
 * A reusable dialog to show when a user attempts to navigate away with unsaved changes.
 * Integrates with React Router's blocker state.
 */
export function UnsavedChangesDialog({ blocker, title, description }: UnsavedChangesDialogProps) {
  const { t } = useTranslation('common');

  if (!blocker || blocker.state !== "blocked") return null;

  return (
    <AlertDialog open={blocker.state === "blocked"}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {title || t('unsavedChanges.title')}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {description || t('unsavedChanges.description')}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={() => blocker.reset?.()}>
            {t('unsavedChanges.stay')}
          </AlertDialogCancel>
          <AlertDialogAction 
            onClick={() => blocker.proceed?.()}
            className="bg-red-600 hover:bg-red-700 text-white font-bold"
          >
            {t('unsavedChanges.discard')}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
