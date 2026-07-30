import { useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import Spinner from '../../components/ui/Spinner';

export default function QRLanding() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, isLoading } = useAuth();

  const vendorId = searchParams.get('vendor');

  useEffect(() => {
    if (isLoading) return;

    if (!vendorId) {
      navigate('/app', { replace: true });
      return;
    }

    if (user) {
      // Authenticated student -> jump straight to vendor menu!
      navigate(`/app/vendor/${vendorId}`, { replace: true });
    } else {
      // Save intended vendor destination in session storage and redirect to Auth
      sessionStorage.setItem('redirect_vendor_id', vendorId);
      navigate('/auth', { replace: true });
    }
  }, [vendorId, user, isLoading, navigate]);

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center">
      <Spinner size="lg" />
      <p className="text-sm font-semibold text-text-secondary mt-4">
        Redirecting to cafe menu...
      </p>
    </div>
  );
}
