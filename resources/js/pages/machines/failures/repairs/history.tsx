import React, { useState } from 'react';
import { usePage } from '@inertiajs/react';
import ModeratorLayout from '@/layouts/ModeratorLayout';
import EmployeeLayout from '@/layouts/EmployeeLayout';
import HistoryRepairedList from '@/components/list/history-repaired-list';

export default function RepairsHistoryPage() {
    const page = usePage();
    const props: any = page.props;
    const history = props.history ?? { items: [], pagination: {} };
    const filters = props.filters ?? {};

    const rawRole = props?.auth?.user?.role ?? '';
    const userRole = String(rawRole).toLowerCase();

    const breadcrumbsModerator = [
        { label: 'Moderator', href: '/moderator' },
        { label: 'Maszyny', href: '/moderator/machines' },
        { label: 'Historia napraw', href: '/machines/failures/repairs/history' }
    ];

    const breadcrumbsEmployee = [
        { label: 'Pracownik', href: '/employee' },
        { label: 'Maszyny', href: '/employee/machines' },
        { label: 'Historia napraw', href: '/machines/failures/repairs/history' }
    ];

    if (userRole === 'moderator') return (
        <ModeratorLayout breadcrumbs={breadcrumbsModerator} title="Historia napraw">
            <div className="p-4">
                <HistoryRepairedList history={history} filters={filters} />
            </div>
        </ModeratorLayout>
    );

    if (userRole === 'employee') return (
        <EmployeeLayout breadcrumbs={breadcrumbsEmployee} title="Historia napraw">
            <div className="p-4">
                <HistoryRepairedList history={history} filters={filters} />
            </div>
        </EmployeeLayout>
    );

    return <div />;
}
