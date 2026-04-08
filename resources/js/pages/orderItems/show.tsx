import { usePage } from '@inertiajs/react';
import EmployeeLayout from '@/layouts/EmployeeLayout';
import ModeratorLayout from '@/layouts/ModeratorLayout';
import OrderHeaderItem from './component/order-header-item';
import CreateOneItems from './item/create-one-items';

type Order = {
    customer_name?: string;
    received_at?: string;
    barcode?: string;
    id: number;
    planned_start_at?: string;
    planned_end_at?: string;
    // add other properties as needed
};

export default function OrderShow() {
    const { props } = usePage<any>();
    const order = props.order;
    const userRole = String(props.auth?.user?.role || '').toLowerCase();


    const breadcrumbsModerator = [
        { label: 'Moderator', href: '/moderator'},
        { label: 'Zamówienia', href: '/moderator/orders' },
        { label: 'Szczegóły zamówienia', href: `/moderator/orders/${order?.id}` },
    ];

    const breadcrumbsEmployee = [
        { label: 'Pracownik', href: '/employee'},
        { label: 'Zamówienia', href: '/employee/orders' },
        { label: 'Szczegóły zamówienia', href: `/employee/orders/${order?.id}` },
    ];
    if (userRole === 'moderator') return (
        <ModeratorLayout breadcrumbs={breadcrumbsModerator} title="Szczegóły zamówienia">
            <OrderHeaderItem order={order} showModeratorActions={false} />
            <CreateOneItems
                order={order}
                addedProducts={props.addedProducts ?? []}
                availableProducts={props.availableProducts ?? []}
                embedded
                showAvailableProducts
                readOnly={false}
            />
        </ModeratorLayout>
    );
    if (userRole === 'employee') return (
        <EmployeeLayout breadcrumbs={breadcrumbsEmployee} title="Szczegóły zamówienia">
            <OrderHeaderItem order={order} showModeratorActions={false} />
            <CreateOneItems
                order={order}
                addedProducts={props.addedProducts ?? []}
                availableProducts={[]}
                embedded
                showAvailableProducts={false}
                readOnly
            />
        </EmployeeLayout>
    );
    // fallback
    return <OrderHeaderItem order={order} showModeratorActions={false} />;
}
