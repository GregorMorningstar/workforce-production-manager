import MachineFailuresList from '@/components/list/machine-failures-list';
import EmployeeLayout from '@/layouts/EmployeeLayout';
import ModeratorLayout from '@/layouts/ModeratorLayout';
import { usePage } from '@inertiajs/react';
import UserMachinesCard from '@/components/card/user-machine-card';

export default function ReportFailurePageIndex() {
    const page = usePage();
    const props = page.props as any;
    const { allmachineFailures, userMachinesFailures } = props;

    const rawRole = props?.auth?.user?.role ?? '';
    const userRole = String(rawRole).toLowerCase();

    const breadcrumbsModerator = [
        { label: 'Moderator', href: '/moderator'},
        { label: 'Maszyny', href: '/moderator/machines' },
        { label: 'Lista Awarii', href: '/machines/report-failure' }
    ];

    const breadcrumbsEmployee = [
        { label: 'Pracownik', href: '/employee'},
        { label: 'Maszyny', href: '/employee/machines' },
        { label: 'Lista Awarii', href: '/machines/report-failure' }
    ];

    if (userRole === 'moderator') return (
        <ModeratorLayout breadcrumbs={breadcrumbsModerator} title="Lista Awarii">
            <MachineFailuresList {...props} />
        </ModeratorLayout>
    );
    if (userRole === 'employee') return (
        <EmployeeLayout breadcrumbs={breadcrumbsEmployee} title="Lista Awarii">
                       <UserMachinesCard userMachines={userMachinesFailures} />

        </EmployeeLayout>
    );

    return <div />;
}
