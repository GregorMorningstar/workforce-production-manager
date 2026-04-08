type AvailableProductsSectionProps = {
    availableProducts: any[];
};

export default function AvailableProductsSection({ availableProducts }: AvailableProductsSectionProps) {
    const productsArray = Array.isArray(availableProducts) ? availableProducts : [];

    return (
        <>
        {productsArray.map((product, idx) => (
            <div key={idx} className="mb-2 p-2 bg-green-50 rounded">{product.name}</div>
        ))}
        </>
    );
}
