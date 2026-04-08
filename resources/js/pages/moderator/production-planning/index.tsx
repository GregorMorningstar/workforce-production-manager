import ModeratorLayout from "@/layouts/ModeratorLayout";
import MaterialTab from "@/components/tab/production-materials/materialTab";

export default function ProductionPlanning() {
    const breadcrumbs = [
        { label: "Home", href: "/moderator" },
        { label: "Planowanie produkcji", href: "/moderator/production-planning" },
    ];

    return (
        <ModeratorLayout breadcrumbs={breadcrumbs} title="Planowanie produkcji">
            <h1 className="text-2xl font-bold mb-4">Planowanie produkcji</h1>

            <MaterialTab />

            {/* ...existing page content... */}
        </ModeratorLayout>
    );
}
