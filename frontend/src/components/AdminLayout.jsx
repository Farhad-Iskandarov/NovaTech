import React, { useState, useEffect } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  BookOpen,
  FileText,
  MessageSquare,
  Users,
  Star,
  Inbox,
  LogOut,
  Menu,
  X,
  ChevronRight,
  Image,
  Settings,
  GraduationCap,
  Briefcase,
  Award
} from 'lucide-react';
import { Button } from '../components/ui/button';

const menuItems = [
  { path: '/nova-admin/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { path: '/nova-admin/slides', icon: Image, label: 'Hero Slides' },
  { path: '/nova-admin/courses', icon: BookOpen, label: 'Courses' },
  { path: '/nova-admin/blogs', icon: FileText, label: 'Blog Posts' },
  { path: '/nova-admin/testimonials', icon: Star, label: 'Testimonials' },
  { path: '/nova-admin/teachers', icon: Users, label: 'Teachers' },
  { path: '/nova-admin/vacancies', icon: Briefcase, label: 'Vacancies' },
  { path: '/nova-admin/internships', icon: Award, label: 'Internships' },
  { path: '/nova-admin/submissions', icon: Inbox, label: 'Submissions' },
  { path: '/nova-admin/trial-lessons', icon: GraduationCap, label: 'Trial Lessons' },
  { path: '/nova-admin/settings', icon: Settings, label: 'Site Settings' },
];

export function AdminLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('novatech-token');
    const userData = localStorage.getItem('novatech-user');

    if (!token) {
      navigate('/nova-admin');
      return;
    }

    if (userData) {
      setUser(JSON.parse(userData));
    }
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('novatech-token');
    localStorage.removeItem('novatech-user');
    navigate('/nova-admin');
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 h-full w-64 bg-white border-r border-slate-200 z-50 transform transition-transform duration-300 lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-between p-6 border-b border-slate-100">
            <Link to="/" className="flex items-center gap-3">
              <img
                src="/logo.jpg"
                alt="Novatech"
                className="h-10 w-10 object-contain"
              />
              <span className="text-lg font-bold text-slate-900">Admin</span>
            </Link>
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={() => setSidebarOpen(false)}
            >
              <X className="w-5 h-5" />
            </Button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
            {menuItems.map(item => (
              <Link
                key={item.path}
                to={item.path}
                data-testid={`admin-nav-${item.label.toLowerCase().replace(' ', '-')}`}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${location.pathname === item.path
                    ? 'bg-[#5B5BF7]/10 text-[#5B5BF7]'
                    : 'text-slate-600 hover:bg-slate-100'
                  }`}
              >
                <item.icon className="w-5 h-5" />
                {item.label}
              </Link>
            ))}
          </nav>

          {/* User Info & Logout */}
          <div className="p-4 border-t border-slate-100">
            {user && (
              <div className="mb-3 px-4 py-2">
                <p className="text-sm font-medium text-slate-900 truncate">{user.email}</p>
                <p className="text-xs text-slate-500">Administrator</p>
              </div>
            )}
            <Button
              variant="ghost"
              className="w-full justify-start text-slate-600 hover:text-red-600 hover:bg-red-50"
              onClick={handleLogout}
              data-testid="admin-logout"
            >
              <LogOut className="w-5 h-5 mr-3" />
              Logout
            </Button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="lg:ml-64">
        {/* Top Bar */}
        <header className="sticky top-0 z-30 bg-white border-b border-slate-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="w-6 h-6" />
            </Button>

            {/* Breadcrumb */}
            <div className="hidden lg:flex items-center gap-2 text-sm">
              <span className="text-slate-500">Admin</span>
              <ChevronRight className="w-4 h-4 text-slate-400" />
              <span className="text-slate-900 font-medium">
                {menuItems.find(item => item.path === location.pathname)?.label || 'Dashboard'}
              </span>
            </div>

            <Link to="/" className="text-sm text-[#5B5BF7] hover:underline">
              View Website →
            </Link>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
