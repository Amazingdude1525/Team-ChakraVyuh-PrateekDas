import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, LogOut } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

interface HeaderProps {
  title?: string;
  showBack?: boolean;
  transparent?: boolean;
}

export default function Header({ title, showBack = false, transparent = false }: HeaderProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { profile, signOut } = useAuth();

  const isHome = location.pathname === '/app';

  return (
    <header
      className={`sticky top-0 z-30 px-4 py-3 ${
        transparent ? '' : 'glass-strong border-b border-border-light'
      }`}
    >
      <div className="max-w-lg mx-auto flex items-center justify-between">
        <div className="flex items-center gap-3">
          {showBack && (
            <button
              onClick={() => navigate(-1)}
              className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
            >
              <ArrowLeft size={20} className="text-text-primary" />
            </button>
          )}
          {isHome && !title ? (
            <div className="flex items-center gap-2">
              <span className="text-2xl">🍽️</span>
              <div>
                <h1 className="text-lg font-bold text-text-primary leading-tight font-display">
                  VITe<span className="text-primary">Bites</span>
                </h1>
                {profile && (
                  <p className="text-[11px] text-text-muted leading-tight">
                    Hey, {profile.full_name || profile.email.split('@')[0].split('.')[0]} 👋
                  </p>
                )}
              </div>
            </div>
          ) : (
            <h1 className="text-lg font-bold text-text-primary">{title}</h1>
          )}
        </div>

        <button
          onClick={signOut}
          className="p-2 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
          title="Sign out"
        >
          <LogOut size={18} className="text-text-muted" />
        </button>
      </div>
    </header>
  );
}
