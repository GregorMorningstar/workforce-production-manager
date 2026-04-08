import Barcode from 'react-barcode';
import { usePage, Link } from '@inertiajs/react';

interface OrderDetailsProps {
  order: {
    customer_name?: string;
    received_at?: string;
    barcode?: string;
    planned_start_at?: string;
    planned_end_at?: string;
    planned_production_at?: string;
    finished_at?: string;
    id?: number;
  };
  showModeratorActions?: boolean;
}

export default function OrderDetails({ order, showModeratorActions = true }: OrderDetailsProps) {
  const page = usePage();
  const props = page.props as any;
  const userRole = String(props?.auth?.user?.role ?? '').toLowerCase();
  // Determine background color based on finished_at
  let bgColor = "bg-green-100";
  if (order.finished_at) {
    const now = new Date();
    const finishedAt = new Date(order.finished_at);
    const diffMs = finishedAt.getTime() - now.getTime();
    const diffHours = diffMs / (1000 * 60 * 60);
    if (diffHours < 0) {
      bgColor = "bg-red-200";
    } else if (diffHours <= 12) {
      bgColor = "bg-orange-200";
    } else if (diffHours <= 24) {
      bgColor = "bg-yellow-200";
    }
  }
  return (
    <>
      <div className={`flex w-full ${bgColor} p-8 rounded-lg`}>
        <div className="flex items-center justify-center w-1/3 min-w-[220px]">
          <Barcode value={order.barcode || ""} width={2} height={80} />
        </div>
        <div className="flex flex-col justify-center w-2/3 pl-8">
          <div className="mb-2">
            <span className="font-semibold">Klient:</span> {order.customer_name}
          </div>
          <div className="mb-2">
            <span className="font-semibold">Data przyjęcia:</span> {order.received_at}
          </div>
          <div className="mb-2">
            <span className="font-semibold">Data planowanego startu:</span> {order.planned_production_at}
          </div>
          <div>
            <span className="font-semibold">Data planowanego zakończenia:</span> {order.finished_at}
          </div>
        </div>
      </div>
      {userRole === 'moderator' && showModeratorActions && (
        <div className="mt-4 p-4 bg-blue-100 rounded-lg">
          <span className="font-semibold mb-2 block">Panel akcji moderatora:</span>
          <Link
            href={`/moderator/orders/${order.id}/add-item`}
            className="inline-block px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Dodaj przedmioty do zamówienia
          </Link>
        </div>
      )}
    </>
  );
}
