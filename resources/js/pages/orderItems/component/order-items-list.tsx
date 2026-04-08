import { usePage, Link } from '@inertiajs/react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faTrash, faEdit } from '@fortawesome/free-solid-svg-icons';
interface OrderItemsListProps {
    order: {
        customer_name?: string;
        received_at?: string;
        barcode?: string;
    };
}
export default function OrderItemsList({ order }: OrderItemsListProps) {

    const page = usePage();
    const props = page.props as any;
    const userRole = String(props?.auth?.user?.role ?? '').toLowerCase();
    // Example: orders from props, paginated
        const { orders = { data: [] }, pagination = { links: [] } } = props.orders || {};

    return (
        <div>
            <h1 className="text-2xl font-bold mb-4">Lista zleceń</h1>
            <table className="min-w-full bg-white border rounded mb-4">
                <thead>
                    <tr>
                        <th className="px-4 py-2 border">Klient</th>
                        <th className="px-4 py-2 border">Data przyjęcia</th>
                        <th className="px-4 py-2 border">Barcode</th>
                        <th className="px-4 py-2 border">Akcje</th>
                    </tr>
                </thead>
                <tbody>
                    {Array.isArray(orders) && orders.length === 0 ? (
                        <tr>
                            <td colSpan={4} className="text-center py-4">
                                Brak produktów do zamówienia.<br />
                                <Link href={order && order.id ? `/moderator/orders/${order.id}/add-items` : '#'} className="inline-block mt-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
                                    Dodaj produkty do zamówienia
                                </Link>
                            </td>
                        </tr>
                    ) : Array.isArray(orders) ? (
                        orders.map((o: any) => (
                            <tr key={o.id}>
                                <td className="border px-4 py-2">{o.customer_name}</td>
                                <td className="border px-4 py-2">{o.received_at}</td>
                                <td className="border px-4 py-2">{o.barcode}</td>
                                <td className="border px-4 py-2 flex gap-2">
                                    <Link href={`/moderator/orders/${o.id}/items/create`} title="Dodaj produkty" className="text-green-600">
                                        <FontAwesomeIcon icon={faPlus} />
                                    </Link>
                                    <Link href={`/moderator/orders/${o.id}/edit`} title="Edytuj zamówienie" className="text-blue-600">
                                        <FontAwesomeIcon icon={faEdit} />
                                    </Link>
                                    <Link href={`/moderator/orders/${o.id}/delete`} title="Usuń zamówienie" className="text-red-600">
                                        <FontAwesomeIcon icon={faTrash} />
                                    </Link>
                                </td>
                            </tr>
                        ))
                    ) : (
                        <tr>
                            <td colSpan={4} className="text-center py-4 text-red-600">Błąd danych: orders nie jest tablicą.</td>
                        </tr>
                    )}
                </tbody>
            </table>
            {/* Paginacja */}
            <div className="flex gap-2">
                {Array.isArray(pagination) ? (
                    pagination.map((link: any, idx: number) => (
                        <Link key={idx} href={link.url || '#'} className={`px-2 py-1 rounded ${link.active ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}>{link.label}</Link>
                    ))
                ) : (
                    <span className="text-red-600">Błąd paginacji: pagination nie jest tablicą.</span>
                )}
            </div>
        </div>
    );

};
