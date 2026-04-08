import { faCartPlus } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';


export default function ModeratorNavMenuOrderItemsAdd() {
    return (
        <div className="w-full flex gap-2 bg-gray-100 p-4 rounded-md mb-4">
            <a
                href={'/moderator/orders/create'}
                aria-label="Dodaj zamówienie"
                className="w-8 h-8 bg-emerald-600 hover:bg-emerald-700 text-white rounded-full flex items-center justify-center"
            >
                <FontAwesomeIcon icon={faCartPlus} className="w-4 h-4" />
            </a>
        </div>
    );
}
