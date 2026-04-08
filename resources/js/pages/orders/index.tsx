import EmployeeLayout from '@/layouts/EmployeeLayout';
import ModeratorLayout from '@/layouts/ModeratorLayout';
import { usePage } from '@inertiajs/react';
import OrderList from '@/pages/orders/components/order_list';
import NavTopOrdermenu from './components/nav_top_menu';

export default function OrdersIndex() {


    const page = usePage();
    const props = page.props as any;
        const rawRole = props?.auth?.user?.role ?? '';
    const userRole = String(rawRole).toLowerCase();
    const order = props.orders ?? null;


const breadcrumbsModerator = [
        { label: 'Moderator', href: '/moderator'},
        { label: 'Zamówienia', href: '/moderator/orders' },
    ];

    const breadcrumbsEmployee = [
        { label: 'Pracownik', href: '/employee'},
        { label: 'Zamówienia', href: '/employee/orders' },
    ];



if (userRole === 'moderator') return (
                <ModeratorLayout breadcrumbs={breadcrumbsModerator} title="Lista zamówień">
                        <NavTopOrdermenu />
                        <OrderList orders={order} />
                </ModeratorLayout>
        );
    if (userRole === 'employee') return (
        <EmployeeLayout breadcrumbs={breadcrumbsEmployee} title="Lista zamówień">
            <OrderList orders={order} />
        </EmployeeLayout>
    );

    return null;

}
