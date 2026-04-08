import EditMachineCard from "@/components/card/edit-machine-card";
import ModeratorMachineNavMenu from "@/components/menu/moderator-machine-nav-menu";
import ModeratorLayout from "@/layouts/ModeratorLayout";
import { usePage } from "@inertiajs/react";

export default function EditModeratorMachine() {
    const page = usePage() as any;
    const machine = page.props.machine;

    const breadcrumbs = [
        { label: 'Home', href: '/moderator' },
        { label: 'Panel sterowania maszyn', href: '/moderator/machines' },
        { label: `Edytuj: ${machine?.name ?? 'Maszyna'}`, href: `/moderator/machines/${machine?.id}/edit` },
    ];

    return (
        <ModeratorLayout
            breadcrumbs={breadcrumbs}
            title={`Edytuj maszynę: ${machine?.name ?? 'Nieznana maszyna'}`}
        >
            
            <div className="mt-6">
                <EditMachineCard />
            </div>
        </ModeratorLayout>
    );
}
