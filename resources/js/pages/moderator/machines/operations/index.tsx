
import ModeratorLayout from "@/layouts/ModeratorLayout"
import { usePage, router } from "@inertiajs/react";
import MachineOperationsList from "@/components/list/machine-operations-list";
import { useState } from "react";
import ConfirmDialog from '@/components/ui/ConfirmDialog';

type PageProps = {
    allOperations?: any[] | null;
    auth?: {
        user?: any | null;
    } | null;
};

export default function MachineOperationModerator() {
    const props = usePage<PageProps>().props;
    const allOperations = props.allOperations;
    const sampleMachine = Array.isArray(allOperations) && allOperations.length > 0 ? allOperations[0] : null;

    const [deleteOpen, setDeleteOpen] = useState(false);
    const [selectedOp, setSelectedOp] = useState<any | null>(null);

    const breadcrumbs = [
        { label: "Panel", href: "/moderator/dashboard" },
        { label: "Maszyny", href: "/moderator/machines" },
        { label: "Operacje", href: "/moderator/machines/operations" },
    ];

    function handleDeleteClick(op: any) {
        setSelectedOp(op);
        setDeleteOpen(true);
    }

    function handleConfirmDelete() {
        if (!selectedOp) {
            setDeleteOpen(false);
            return;
        }

        const opId = selectedOp.id ?? selectedOp.operation_id ?? selectedOp.operation?.id;
        if (!opId) {
            setDeleteOpen(false);
            return;
        }

        router.delete(`/moderator/machines/operations/${opId}`, {
            onSuccess: () => {
                setDeleteOpen(false);
                setSelectedOp(null);
            },
            onError: () => {
                setDeleteOpen(false);
            },
        });
    }

    return (
        <ModeratorLayout breadcrumbs={breadcrumbs} title="Machine Operations">
            <MachineOperationsList
                allOperations={allOperations}
                currentUserRole={props.auth?.user?.role ?? 'user'}
                onDelete={handleDeleteClick}
            />

            <ConfirmDialog
                open={deleteOpen}
                onClose={() => setDeleteOpen(false)}
                onConfirm={handleConfirmDelete}
                title="Usuń operację"
                message={`Czy na pewno usunąć operację "${selectedOp?.operation?.name ?? selectedOp?.operation_name ?? ''}"?`}
                confirmText="Usuń"
                cancelText="Anuluj"
            />
        </ModeratorLayout>
    );
}
