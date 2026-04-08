import React from "react";
import AddMachineOperationCard from "@/components/card/add-machine-operation-card";
import ModeratorLayout from "@/layouts/ModeratorLayout";
import { usePage } from "@inertiajs/react";

type PageProps = {
    machine_id: number;
    machine?: {
        id: number;
        name: string;
        model?: string;
    };
};

export default function CreateMachineOperation() {
    const page = usePage<PageProps>();
    const machineId = page.props.machine_id;
    const machine = page.props.machine;

    const breadcrumbs = [
        { label: "Dashboard", href: "/moderator/dashboard" },
        { label: "Machines", href: "/moderator/machines" },
        { label: "Operations", href: "/moderator/machines/operations" },
        { label: "Dodaj", href: `/moderator/machines/${machineId}/operations/create` },
    ];

    const AddMachineOperationCardAny = AddMachineOperationCard as any;

    return (
        <ModeratorLayout
            breadcrumbs={breadcrumbs}
            title={`Dodaj operację - ${machine?.name || `Maszyna #${machineId}`}`}
        >
            <div className="space-y-4">
                {machine && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <h2 className="font-medium text-blue-900">
                            Dodajesz operację do maszyny: <span className="font-bold">{machine.name}</span>
                            {machine.model && <span className="text-sm text-blue-700"> (Model: {machine.model})</span>}
                        </h2>
                    </div>
                )}

                <AddMachineOperationCardAny
                    initialMachineId={machineId}
                    machine={machine}
                />
            </div>
        </ModeratorLayout>
    );
}
