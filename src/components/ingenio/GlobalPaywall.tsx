import { usePaywallStore } from '@/stores/paywallStore';
import { SubscriptionModal } from './SubscriptionModal';

export function GlobalPaywall() {
  const { isOpen, closePaywall } = usePaywallStore();
  
  return (
    <SubscriptionModal 
      open={isOpen} 
      onOpenChange={(open) => {
        if (!open) closePaywall();
      }} 
    />
  );
}
