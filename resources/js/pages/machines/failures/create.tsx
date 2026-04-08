import CreateNewFailure from '@/components/card/add-failure-card';
import ModeratorLayout from '@/layouts/ModeratorLayout';
import { usePage } from '@inertiajs/react';

export default function ReportFailureCreatePage() {
    const page = usePage();
    const rawRole = (page.props as any)?.auth?.user?.role ?? '';
    const userRole = String(rawRole).toLowerCase();

    const machineId = (page.props as any)?.machine_id ?? null;


    const breadcrumbsModerator = [
        { label: 'Moderator', href: '/moderator'},
        { label: 'Maszyny', href: '/moderator/machines' },
        { label: 'Lista Awarii', href: '/machines/report-failure' }
    ];

    if (userRole === 'moderator') return (
    <ModeratorLayout breadcrumbs={breadcrumbsModerator} title="Lista Awarii">
        <CreateNewFailure machineId={machineId} />
    </ModeratorLayout>
    );
    if (userRole === 'employee') return (
     <>
             <CreateNewFailure machineId={machineId} />

     </>
    );

    return <div />;
}
