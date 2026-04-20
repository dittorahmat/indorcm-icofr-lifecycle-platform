import { useState, useEffect } from 'react';
import { AlertCircle, Clock, X, ShieldAlert } from 'lucide-react';
import { useLicense } from './LicenseGuard';
import { Button } from './ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';

export function LicenseBanner() {
  const { license } = useLicense();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Check if user has already dismissed the banner in this session
    const isDismissed = sessionStorage.getItem('license_banner_dismissed');
    
    if (license?.status === 'active' && 
        license.daysRemaining <= 90 && 
        license.daysRemaining > 7 && 
        !isDismissed) {
      setIsVisible(true);
    }
  }, [license]);

  const handleDismiss = () => {
    setIsVisible(false);
    sessionStorage.setItem('license_banner_dismissed', 'true');
  };

  if (!isVisible) return null;

  return (
    <div className="bg-amber-50 border-b border-amber-200 py-2 px-4 flex items-center justify-between animate-in slide-in-from-top duration-500">
      <div className="flex items-center gap-2 text-amber-800 text-sm font-medium">
        <Clock className="h-4 w-4" />
        <span>License notice: {license?.daysRemaining} days remaining until expiration. Please renew soon.</span>
      </div>
      <button 
        onClick={handleDismiss}
        className="text-amber-500 hover:text-amber-700 transition-colors"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}

export function LicenseModal() {
  const { license } = useLicense();
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    // Check if user has already acknowledged the modal in this session
    const isAcknowledged = sessionStorage.getItem('license_modal_acknowledged');
    
    if (license?.status === 'active' && 
        license.daysRemaining <= 7 && 
        license.daysRemaining > 0 && 
        !isAcknowledged) {
      setIsOpen(true);
    }
  }, [license]);

  const handleAcknowledge = () => {
    setIsOpen(false);
    sessionStorage.setItem('license_modal_acknowledged', 'true');
  };

  if (!license) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
        // Only allow closing via the button to ensure they "read" it
        if (!open) handleAcknowledge();
    }}>
      <DialogContent className="sm:max-w-md border-red-200">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-600">
            <ShieldAlert className="h-5 w-5" />
            Urgent: License Expiring Soon
          </DialogTitle>
          <DialogDescription className="pt-2">
            Your IndoRCM Pro license will expire in <span className="font-bold text-red-600">{license.daysRemaining} days</span>. 
            After this period, the system will be locked and all access will be disabled.
          </DialogDescription>
        </DialogHeader>
        
        <Alert variant="destructive" className="bg-red-50 border-red-100 text-red-800 mt-2">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Action Required</AlertTitle>
          <AlertDescription className="text-xs">
            Please contact your system administrator or vendor immediately to obtain a renewal key.
          </AlertDescription>
        </Alert>

        <DialogFooter className="sm:justify-start mt-4">
          <Button
            type="button"
            className="w-full bg-red-600 hover:bg-red-700 text-white"
            onClick={handleAcknowledge}
          >
            I understand, continue to application
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
