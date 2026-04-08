import EditFailureCard from '@/components/card/edit-failure-card';
import MachineFailuresList from '@/components/list/machine-failures-list';
import ModeratorLayout from '@/layouts/ModeratorLayout';
import { usePage } from '@inertiajs/react';

export default function EditFailurePage() {
    const page = usePage();
    const props = page.props as any;
    const { allmachineFailures } = props;

    const rawRole = props?.auth?.user?.role ?? '';
    const userRole = String(rawRole).toLowerCase();

    const breadcrumbsModerator = [
        { label: 'Moderator', href: '/moderator'},
        { label: 'Maszyny', href: '/machines' },
        { label: 'Lista Awarii', href: '/machines/report-failure' },
        { label: 'Edytuj Awarię', href: '' }
    ];

    if (userRole === 'moderator') return (
        <ModeratorLayout breadcrumbs={breadcrumbsModerator} title="Lista Awarii">
                <EditFailureCard {...props} />
        </ModeratorLayout>
    );
    if (userRole === 'employee') return (
        <div>2</div>
    );

    return <div />;
}
