import EmployeeLayout from "@/layouts/EmployeeLayout";

export default function AddressEdit() {

    const breadcrumbs = [
        { label: 'Panel Pracownika', href: '/employee/dashboard' },
        { label: 'Adresy', href: '/employee/address' },
        { label: 'Edytuj adres' },
    ];
    return (
        <EmployeeLayout title="Adresy" breadcrumbs={breadcrumbs}>
            <div className="p-4 bg-white rounded shadow">
                <h1 className="text-2xl font-bold mb-4">Edytuj swój adres</h1>
                {/* Zawartość strony zarządzania adresami */}
            </div>
        </EmployeeLayout>
    );
}
