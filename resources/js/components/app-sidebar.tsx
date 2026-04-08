import { NavFooter } from '@/components/nav-footer';
import { NavUser } from '@/components/nav-user';
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from '@/components/ui/sidebar';
import { dashboard } from '@/routes';
import { type NavItem } from '@/types';
import { Link, usePage } from '@inertiajs/react';
import { BookOpen, Folder, LayoutGrid, MessageCircle } from 'lucide-react';
import AppLogo from './app-logo';
import ModeratorSidebarMenu from './menu/moderator-sidebar-menu';
import EmployeeSidebarMenu from './menu/employee-sidebar-menu';
import AdminSidebarMenu from './menu/admin-sidebar-menu';

const footerNavItems: NavItem[] = [
    {
        title: 'Chat',
        href: '/chat',
        icon: MessageCircle,
    },
];

export function AppSidebar() {
    const page = usePage();
    const role = String((page.props as any).auth?.user?.role ?? 'guest').toLowerCase();

    const renderMenu = () => {
        switch (role) {
            case 'admin':
                return <AdminSidebarMenu />;
            case 'moderator':
                return <ModeratorSidebarMenu />;
            case 'employee':
                return <EmployeeSidebarMenu />;
            case 'user':
            case 'guest':
            default:
                return 3;
        }
    };

    return (
        <Sidebar collapsible="icon" variant="inset">
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild>
                            <Link href={dashboard()} prefetch>
                                <AppLogo />
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent>{renderMenu()}</SidebarContent>

            <SidebarFooter>
                <NavFooter items={footerNavItems} className="mt-auto" />
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}
