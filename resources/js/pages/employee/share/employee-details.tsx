import { usePage } from '@inertiajs/react';
import ModeratorLayout from '@/layouts/ModeratorLayout';
import EmployeeDetailsCard from '@/components/card/employee-detalis-card';


export default function EmployeeDetails() {
   const page = usePage();
    const props = page.props as any;
    const { employee } = props;

    const rawRole = props?.auth?.user?.role ?? '';
    const userRole = String(rawRole).toLowerCase();

    const breadcrumbsModerator = [
        { label: 'Moderator', href: '/moderator'},
        { label: 'Pracownicy', href: '/moderator/users' },
        { label: 'Szczegóły Pracownika', href: '' }
    ];

    if (userRole === 'moderator') return (
        <ModeratorLayout breadcrumbs={breadcrumbsModerator} title="Lista Pracownikow">

<EmployeeDetailsCard employee={employee} />

        </ModeratorLayout>
    );
    if (userRole === 'employee') return (
        <div>2</div>
    );

    return <div />;
}
