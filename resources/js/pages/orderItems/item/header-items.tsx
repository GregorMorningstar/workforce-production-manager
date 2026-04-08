

export default function HeaderItemsCreate({ order }: { order: any }) {
    return (
        <div>
            <h2>Dane zamówienia:</h2>
            <pre>{JSON.stringify(order, null, 2)}</pre>
        </div>
    );
}
