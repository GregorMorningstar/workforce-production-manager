import ModeratorLayout from "@/layouts/ModeratorLayout";
import { usePage } from '@inertiajs/react';
import MachineFailuresRepariedList from '@/components/list/machine-failures-reparied-list';

export default function MachineFailuresRepariedListPage() {

    const breadcrumbsModerator = [
        { label: 'Moderator', href: '/moderator'},
        { label: 'Maszyny', href: '/moderator/machines' },
        { label: 'Lista Naprawionych Awarii', href: '/machines/failures/repairs/list' }
    ];

    const page = usePage();
    const props = page.props as any;
    const repairs = props.repairs ?? [];
    const pagination = props.pagination ?? null;
    const filters = props.filters ?? null;
    const barcode = props.barcode ?? null;

    return (
        <ModeratorLayout breadcrumbs={breadcrumbsModerator} title="Lista Naprawionych Awarii">
            <div className="p-6">
                <h2 className="text-lg font-semibold mb-4">Lista Naprawionych Awarii</h2>
                <MachineFailuresRepariedList repairs={repairs} pagination={pagination} filters={filters} barcode={barcode} />
            </div>
        </ModeratorLayout>
    );
}
