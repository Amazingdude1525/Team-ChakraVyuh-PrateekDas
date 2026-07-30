import { Outlet } from 'react-router-dom';
import Header from './Header';
import BottomNav from './BottomNav';

interface AppLayoutProps {
  title?: string;
  showBack?: boolean;
}

export default function AppLayout({ title, showBack }: AppLayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      <Header title={title} showBack={showBack} />
      <main className="max-w-lg mx-auto pb-24 px-4">
        <Outlet />
      </main>
      <BottomNav />
    </div>
  );
}
