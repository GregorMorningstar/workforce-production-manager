import PendingLeavesTable from "@/components/list/pending-leaves-list";
import ModeratorLayout from "@/layouts/ModeratorLayout";
import { usePage } from "@inertiajs/react";

type Leave = {
    id: number;
    user_id: number;
    user?: { id: number; name: string } | null;
    start_date: string;
    end_date: string;
    status: string;
    reason?: string | null;
    description?: string | null;
    days: number;
    type?: string | null;
};

export default function PendingLeaves() {
    const { pendingLeaves = [] } = usePage<{ pendingLeaves: Leave[] }>().props;

    const breadcrumbs = [
        { label: 'Moderator', url: '/moderator' },
        { label: 'Użytkownicy', url: '/moderator/users' },
        { label: 'Urlopy', url: '/moderator/user/leaves' },
        { label: 'Oczekujące', url: '/moderator/user/leaves/pending' },
    ];

    return (
      <ModeratorLayout breadcrumbs={breadcrumbs}>
        <PendingLeavesTable pendingLeaves={pendingLeaves} />
      </ModeratorLayout>
    );
}
