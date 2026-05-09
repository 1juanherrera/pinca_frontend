import { Navigate, Outlet } from 'react-router';
import Sidebar from './Shared/Sidebar';
import Topbar from './Shared/Topbar';
import { useBoundStore } from './store/useBoundStore';

const Layout = () => {
  const token = useBoundStore((s) => s.token);

  if (!token) return <Navigate to="/login" replace />;

  return (
    <div className="flex h-screen w-full bg-surface-base overflow-hidden font-sans transition-colors duration-300">
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0">
        <Topbar />

        <main className="p-2 bg-surface-main h-full overflow-auto">
            <Outlet />
        </main>
      </div>
    </div>
  );
}

export default Layout;
