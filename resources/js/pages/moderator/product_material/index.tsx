import ModeratorLayout from "@/layouts/ModeratorLayout";
import MaterialTab from "@/components/tab/production-materials/materialTab";

export default function ProductionPlanning() {
    const breadcrumbs = [
        { label: "Home", href: "/moderator" },
        { label: "Materialy  do produkcji", href: "/moderator/product-material" },
    ];

    return (
        <ModeratorLayout breadcrumbs={breadcrumbs} title="Materialy  produkcji">

            <MaterialTab />

        </ModeratorLayout>
    );
}
