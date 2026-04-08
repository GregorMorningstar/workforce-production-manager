import AddMachineCard from "@/components/card/add-machine-card";
import ModeratorMachineNavMenu from "@/components/menu/moderator-machine-nav-menu";
import ModeratorLayout from "@/layouts/ModeratorLayout";
export default function createModeratorMachine() {
    const breadcrumbs = [
        { label: 'Home', href: '/moderator' },
        { label: 'Panel sterowania maszyn', href: '/moderator/machines' },
        { label: 'Dodaj nową maszynę', href: '/moderator/machines/add-new' },
    ];
    return (
        <ModeratorLayout breadcrumbs={breadcrumbs} title="Dodaj nową maszynę">
            <ModeratorMachineNavMenu />
            <AddMachineCard />
        </ModeratorLayout>
    )
}
