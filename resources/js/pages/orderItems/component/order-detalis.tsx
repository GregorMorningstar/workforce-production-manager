import OrderItemsList from "./order-items-list";


interface OrderDetailsProps {
    order: {
        customer_name?: string;
        received_at?: string;
        barcode?: string;
    };
}


export default function OrderDetails({ order }: OrderDetailsProps) {
    console.log(order);
    return (
      <OrderItemsList order={order} />
    );
}
