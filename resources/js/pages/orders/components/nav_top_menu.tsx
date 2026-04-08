import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCartPlus } from '@fortawesome/free-solid-svg-icons';
import { Link } from '@inertiajs/react';

export default function NavTopOrdermenu() {
    return (
        <div className="w-full flex gap-2 bg-gray-100 p-4 rounded-md mb-4">
            <Link
                href={'/moderator/orders/create'}
                aria-label="Dodaj zamówienie"
                className="w-8 h-8 bg-emerald-600 hover:bg-emerald-700 text-white rounded-full flex items-center justify-center"
            >
                <FontAwesomeIcon icon={faCartPlus} className="w-4 h-4" />
            </Link>
        </div>
    );
}
