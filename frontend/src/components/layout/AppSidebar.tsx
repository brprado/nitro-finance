import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Receipt,
  CheckSquare,
  Bell,
  Building2,
  FolderTree,
  Tag,
  Users,
  ChevronLeft,
  Menu,
  LogOut,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from '@/components/ui/sheet';
import { useIsMobile } from '@/hooks/use-mobile';

const mainNavItems = [
  { icon: LayoutDashboard, label: 'Dashboard', href: '/dashboard' },
  { icon: Receipt, label: 'Despesas', href: '/expenses' },
  { icon: CheckSquare, label: 'Validações', href: '/validations', requireLeader: true },
  { icon: Bell, label: 'Alertas', href: '/alerts' },
];

const adminNavItems = [
  { icon: Building2, label: 'Empresas', href: '/companies' },
  { icon: FolderTree, label: 'Setores', href: '/departments' },
  { icon: Tag, label: 'Categorias', href: '/categories' },
  { icon: Users, label: 'Usuários', href: '/users' },
];

function SidebarContent({ isCollapsed, onItemClick }: { isCollapsed: boolean; onItemClick?: () => void }) {
  const location = useLocation();
  const { user, logout, isAdmin, isLeader } = useAuth();

  const isActive = (href: string) => location.pathname === href;

  const NavItem = ({ icon: Icon, label, href }: { icon: React.ElementType; label: string; href: string }) => (
    <Link
      to={href}
      onClick={onItemClick}
      className={cn(
        'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150',
        isActive(href)
          ? 'bg-accent text-accent-foreground border-l-3 border-primary'
          : 'text-muted-foreground hover:bg-muted hover:text-foreground'
      )}
    >
      <Icon className="h-5 w-5 flex-shrink-0" />
      {!isCollapsed && <span>{label}</span>}
    </Link>
  );

  return (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="p-4 border-b border-border">
        <Link to="/dashboard" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
            <span className="text-primary-foreground font-bold text-lg">N</span>
          </div>
          {!isCollapsed && (
            <div className="flex items-center gap-2">
              <span className="text-xl font-bold">
                <span className="text-primary">Nitro</span>
                <span className="text-muted-foreground">Subs</span>
              </span>
              <Badge variant="secondary" className="text-xs">
                Beta
              </Badge>
            </div>
          )}
        </Link>
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto p-4">
        <nav className="space-y-1">
          {mainNavItems.map((item) => {
            if (item.requireLeader && !isLeader) return null;
            return <NavItem key={item.href} {...item} />;
          })}
        </nav>

        {isAdmin && (
          <>
            <div className="mt-6 mb-2">
              {!isCollapsed && (
                <p className="px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Cadastros
                </p>
              )}
            </div>
            <nav className="space-y-1">
              {adminNavItems.map((item) => (
                <NavItem key={item.href} {...item} />
              ))}
            </nav>
          </>
        )}
      </div>

      {/* User section */}
      <div className="p-4 border-t border-border">
        <div className={cn('flex items-center', isCollapsed ? 'justify-center' : 'gap-3')}>
          <Avatar className="h-9 w-9">
            <AvatarFallback className="bg-primary text-primary-foreground text-sm">
              {user?.name?.charAt(0) || 'U'}
            </AvatarFallback>
          </Avatar>
          {!isCollapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{user?.name}</p>
              <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
            </div>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={logout}
            className="text-muted-foreground hover:text-destructive"
            title="Sair"
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

export function AppSidebar() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const isMobile = useIsMobile();

  if (isMobile) {
    return (
      <Sheet>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" className="fixed top-4 left-4 z-50 md:hidden">
            <Menu className="h-5 w-5" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-64 p-0">
          <SidebarContent isCollapsed={false} />
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <aside
      className={cn(
        'hidden md:flex flex-col bg-card border-r border-border transition-all duration-200',
        isCollapsed ? 'w-[68px]' : 'w-64'
      )}
    >
      <SidebarContent isCollapsed={isCollapsed} />
      
      {/* Collapse toggle */}
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="absolute -right-3 top-20 h-6 w-6 rounded-full border border-border bg-card shadow-sm"
      >
        <ChevronLeft className={cn('h-3 w-3 transition-transform', isCollapsed && 'rotate-180')} />
      </Button>
    </aside>
  );
}
