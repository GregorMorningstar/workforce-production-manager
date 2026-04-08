import EmployeeLayout from "@/layouts/EmployeeLayout";

export default function AddressIndex() {

    const breadcrumbs = [
        { label: 'Panel Pracownika', href: '/employee/dashboard' },
        { label: 'Adresy' },
    ];
    return (
        <EmployeeLayout title="Adresy" breadcrumbs={breadcrumbs}>
            <div className="p-4 bg-white rounded shadow">
                <h1 className="text-2xl font-bold mb-4">Zarządzaj swoimi adresami</h1>
                {/* Zawartość strony zarządzania adresami */}
            </div>
        </EmployeeLayout>
    );
}
