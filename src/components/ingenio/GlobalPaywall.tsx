import { useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { usePaywallStore } from '@/stores/paywallStore';
import { useIngenioSubscription } from '@/hooks/useIngenioSubscription';
import { SubscriptionModal } from './SubscriptionModal';
import { useAuthStore } from '@/stores';

export function GlobalPaywall() {
  const { user, setActiveRole } = useAuthStore();
  const { isOpen, openPaywall, closePaywall } = usePaywallStore();
  const { isActive } = useIngenioSubscription();
  const location = useLocation();
  const navigate = useNavigate();
  const isRedirecting = useRef(false);

  const isIngenioRoute = location.pathname.startsWith('/app/ingenio') || location.pathname.startsWith('/ingenio');
  const isExcludedRoute = location.pathname.includes('/profile') || location.pathname.includes('/subscription');
  
  useEffect(() => {
    if (!user) {
      if (isOpen) closePaywall();
      return;
    }
    // Auto-open if entering ingenio without active sub, but skip excluded routes
    const hasBeenShownThisSession = sessionStorage.getItem('ingenio_paywall_shown');
    
    if (isIngenioRoute && !isExcludedRoute && !isActive && !isOpen && !isRedirecting.current && !hasBeenShownThisSession) {
      openPaywall();
      sessionStorage.setItem('ingenio_paywall_shown', 'true');
    }
  }, [user, isIngenioRoute, isExcludedRoute, isActive, openPaywall, isOpen, closePaywall]);

  if (!user) return null;
  if (!isIngenioRoute && !isOpen) return null;
  if (isActive && !isOpen) return null;

  return (
    <SubscriptionModal 
      open={isOpen} 
      onOpenChange={(open) => {
        if (!open) {
          if (isIngenioRoute && !isActive) {
            isRedirecting.current = true;
            closePaywall();
            // Determinar a dónde redirigir según los roles disponibles
            if (user.roles.includes('seller')) {
              setActiveRole('seller');
              navigate('/vendedor');
            } else if (user.roles.includes('client')) {
              setActiveRole('client');
              navigate('/app');
            } else {
              navigate('/');
            }
            // Reset redirecting flag after a short delay
            setTimeout(() => { isRedirecting.current = false; }, 500);
          } else {
            closePaywall();
          }
        }
      }} 
    />
  );
}
