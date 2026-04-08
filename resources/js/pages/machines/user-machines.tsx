import React from 'react';
import UserMachinesCard from "@/components/card/user-machine-card";
import EmployeeLayout from "@/layouts/EmployeeLayout";
import { usePage } from '@inertiajs/react';

export default function UserMachines() {
    const page = usePage<any>();
    // If backend returns a paginator, the array is under `machines.data`.
    const userMachines = page.props?.machines?.data ?? page.props?.machines ?? [];

    const breadcrumbs = [
        { label: 'Maszyny', href: '/employee/machines' },
        { label: 'Moje maszyny', href: '/employee/machines/user' },
    ];

    return (
        <EmployeeLayout breadcrumbs={breadcrumbs} title="Moje maszyny">
           <UserMachinesCard userMachines={userMachines} />
        </EmployeeLayout>
    );
}
