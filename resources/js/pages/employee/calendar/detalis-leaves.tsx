import EmployeeLayout from "@/layouts/EmployeeLayout";
import LeavesDetailsCard from "@/components/card/leaves-detalis-card";
import { usePage } from '@inertiajs/react';
import { useEffect, useState } from 'react';

export default function LeavesDetails() {
    const { props: pageProps } = usePage<any>();
    const leaveData = pageProps?.leave ?? null;
    const userLeaves = pageProps?.userLeaves ?? [];
    const redirectSeconds = pageProps?.redirectBackInSeconds ?? null;

    const breadcrumbs = [
        { label: 'Kalendarz', href: '/employee/calendar' },
        { label: 'Szczegóły urlopu', href: '/employee/calendar/details-leaves' },
    ];

    const [counter, setCounter] = useState<number | null>(redirectSeconds ?? null);

    useEffect(() => {
        if (!redirectSeconds) return;
        setCounter(redirectSeconds);
        const interval = setInterval(() => {
            setCounter((c) => {
                if (c === null) return null;
                if (c <= 1) {
                    clearInterval(interval);
                    // navigate back using history or Inertia fallback
                    if (window.history.length > 1) {
                        window.history.back();
                    } else {
                        window.location.href = '/employee/calendar';
                    }
                    return 0;
                }
                return c - 1;
            });
        }, 1000);

        return () => clearInterval(interval);
    }, [redirectSeconds]);

    const goBackNow = () => {
        if (window.history.length > 1) {
            window.history.back();
        } else {
            window.location.href = '/employee/calendar';
        }
    };

    return (
        <EmployeeLayout breadcrumbs={breadcrumbs}>
            {counter !== null && (
                <div className="mb-4 p-3 bg-yellow-50 border-l-4 border-yellow-300 rounded">
                    <div className="flex items-center justify-between">
                        <div className="text-sm text-yellow-800">Za <strong>{counter}</strong> sekund wrócisz do poprzedniej strony.</div>
                        <div>
                            <button onClick={goBackNow} className="px-3 py-1 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700">Cofnij teraz</button>
                        </div>
                    </div>
                </div>
            )}

            <LeavesDetailsCard
                leave={leaveData}
                userLeaves={userLeaves}
                {...pageProps}
            />
        </EmployeeLayout>
    );
}
