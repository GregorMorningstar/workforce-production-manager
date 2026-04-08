import MachineFailureHistory from '@/components/table/machineFailureHistory';
import EmployeeLayout from '@/layouts/EmployeeLayout';
import ModeratorLayout from '@/layouts/ModeratorLayout';
import { usePage } from '@inertiajs/react';

export default function ReportFailureHistoryPage() {
    const page = usePage();
    const rawRole = (page.props as any)?.auth?.user?.role ?? '';
    const userRole = String(rawRole).toLowerCase();
    const history = (page.props as any)?.history ?? [];
    const filters = (page.props as any)?.filters ?? {};

    const breadcrumbsModerator = [
        { label: 'Moderator', href: '/moderator'},
        { label: 'Maszyny', href: '/moderator/machines' },
        { label: 'Lista Awarii', href: '/machines/report-failure' }
    ];

    const breadcrumbsEmployee = [
        { label: 'Pracownik', href: '/employee'},
        { label: 'Maszyny', href: '/employee/machines' },
        { label: 'Historia Awarii', href: '/machines/failures/history' }
    ];

    if (userRole === 'moderator') return (
        <ModeratorLayout breadcrumbs={breadcrumbsModerator} title="Lista Awarii">
            <MachineFailureHistory history={history} filters={filters} />
        </ModeratorLayout>
    );
    if (userRole === 'employee') return (
       <EmployeeLayout breadcrumbs={breadcrumbsEmployee} title="Historia Awarii">
           <MachineFailureHistory history={history} filters={filters} />
       </EmployeeLayout>
    );

    return <div />;
}
