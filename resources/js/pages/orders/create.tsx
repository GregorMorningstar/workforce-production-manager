import ModeratorLayout from "@/layouts/ModeratorLayout";
import { useForm } from "@inertiajs/react";

export default function OrdersCreate() {
    const { data, setData, post, processing, errors } = useForm({
        customer_name: "",
        planned_production_at: "",
        finished_at: "",
        description: "",
    });

    function submit(e: React.FormEvent) {
        e.preventDefault();
        post('/moderator/orders');
    }

    const breadcrumbs = [
        { label: "Zamówienia", href: "/moderator/orders" },
        { label: "Dodaj zamówienie", href: "/moderator/orders/create" },
    ];

    return (
        <ModeratorLayout breadcrumbs={breadcrumbs} title="Dodaj zamówienie">
            <form onSubmit={submit} className="max-w-md mx-auto bg-white p-6 rounded shadow">
                <h2 className="text-xl font-bold mb-4">Dodaj zamówienie</h2>

                <div className="mb-4">
                    <label className="block mb-1">Nazwa klienta</label>
                    <input
                        type="text"
                        value={data.customer_name}
                        onChange={(e) => setData("customer_name", e.target.value)}
                        className="w-full border rounded px-2 py-1"
                    />
                    {errors.customer_name && (
                        <div className="text-red-500 text-sm">{errors.customer_name}</div>
                    )}
                </div>

                <div className="mb-4">
                    <label className="block mb-1">Planowany czas produkcji</label>
                    <input
                        type="datetime-local"
                        value={data.planned_production_at}
                        onChange={(e) => setData("planned_production_at", e.target.value)}
                        className="w-full border rounded px-2 py-1"
                    />
                    {errors.planned_production_at && (
                        <div className="text-red-500 text-sm">{errors.planned_production_at}</div>
                    )}
                </div>

                <div className="mb-4">
                    <label className="block mb-1">Planowany czas zakończenia</label>
                    <input
                        type="datetime-local"
                        value={data.finished_at}
                        onChange={(e) => setData("finished_at", e.target.value)}
                        className="w-full border rounded px-2 py-1"
                    />
                    {errors.finished_at && (
                        <div className="text-red-500 text-sm">{errors.finished_at}</div>
                    )}
                </div>

                <div className="mb-4">
                    <label className="block mb-1">Opis (opcjonalnie)</label>
                    <textarea
                        value={data.description}
                        onChange={(e) => setData("description", e.target.value)}
                        className="w-full border rounded px-2 py-1"
                    />
                    {errors.description && (
                        <div className="text-red-500 text-sm">{errors.description}</div>
                    )}
                </div>

                <button
                    type="submit"
                    disabled={processing}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded"
                >
                    Dodaj zamówienie
                </button>
            </form>
        </ModeratorLayout>
    );
}
