import ItemsTab from "@/components/tab/items/itemsTab";
import ModeratorLayout from "@/layouts/ModeratorLayout";

export default function ProductionPlanning() {
    const breadcrumbs = [
        { label: "Home", href: "/moderator" },
        { label: "Produkty gotowe", href: "/moderator/production-planning/element" },
    ];

    return (
        <ModeratorLayout breadcrumbs={breadcrumbs} title="Produkty gotowe">
            <ItemsTab />
        </ModeratorLayout>
    );
}
