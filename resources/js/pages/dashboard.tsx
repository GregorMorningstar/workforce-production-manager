import { type BreadcrumbItem } from '@/types';
import { router, usePage } from '@inertiajs/react';
import { useEffect } from 'react';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/dashboard' },
];

export default function Dashboard() {
    const { auth } = (usePage().props as unknown) as { auth: { user: { role: string } } };

    useEffect(() => {
        if (auth?.user?.role === 'admin') {
            router.visit('admin/dashboard');
        } else if (auth?.user?.role === 'moderator') {
            router.visit('moderator/dashboard');
        } else if (auth?.user?.role === 'employee') {
            router.visit('employee/dashboard');
        }
    }, [auth?.user?.role]);

    return null;
}
