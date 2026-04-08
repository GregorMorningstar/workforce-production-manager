import CardAdress from "@/components/card/card-adress";
import EmployeeLayout from "@/layouts/EmployeeLayout";
import { usePage } from "@inertiajs/react";
import { use } from "react";

export default function ShowEmployeeAddress() {

        const breadcrumbs = [
        { label: 'Panel Pracownika', href: '/employee/dashboard' },
        { label: 'Adresy', href: '/employee/address' },
        { label: 'Szczegóły Adresu' },
    ];

    const page = usePage().props as any;
    const adress = page.address ?? null;
    const user = page.user ?? null;

    const useEffect = () => {
        console.log(adress);
    };
    return (
      <EmployeeLayout title="Szczegóły Adresu" breadcrumbs={breadcrumbs}>
          <CardAdress address={adress} user={user} />

      </EmployeeLayout>
    );
}
