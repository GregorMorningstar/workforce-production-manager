import React, { useState, useEffect } from 'react';
import ModeratorLayout from "@/layouts/ModeratorLayout";
import PlaningCanbanCard from '../tab/planing-canban-card';
import  PlaningProcesItems from '../tab/planing-proces-items';

type TabItem = {
    id: string;
    label: string;
    content: React.ReactNode;
};

type OrderForPlanning = {
    id: number;
    barcode?: string | null;
    customer_name: string;
    status: string;
    planned_production_at?: string | null;
    finished_at?: string | null;
    items_count?: number;
};

type PlanningPageProps = {
    ordersForPlanning?: {
        data?: OrderForPlanning[];
        current_page?: number;
        last_page?: number;
        per_page?: number;
        total?: number;
        links?: Array<{ url: string | null; label: string; active: boolean }>;
    };
    ordersInProgress?: {
        data?: OrderForPlanning[];
        current_page?: number;
        last_page?: number;
        per_page?: number;
        total?: number;
        links?: Array<{ url: string | null; label: string; active: boolean }>;
    };
};

export default function ProductionPlanning({ ordersForPlanning, ordersInProgress }: PlanningPageProps) {
        const breadcrumbs = [
                { label: "Home", href: "/moderator" },
                { label: "Planowanie produkcji", href: "/moderator/production-planning" },
                { label: "Elementy", href: "/moderator/production-planning/element" },
        ];

        const tabs: TabItem[] = [
            { id: 'create-canban-card', label: 'Tworzenie Karty Produkcji', content: <PlaningCanbanCard orders={ordersForPlanning} /> },
            { id: 'planing-proces-items', label: 'Planowanie Procesu', content: <PlaningProcesItems /> },
            { id: 'tab-3', label: 'W trakcie', content: <PlaningCanbanCard orders={ordersInProgress} title="W trakcie" /> },
            { id: 'tab-4', label: 'Element 4', content: <div>Treść elementu 4</div> },
            { id: 'tab-5', label: 'Element 5', content: <div>Treść elementu 5</div> },
        ];

        const [activeTab, setActiveTab] = useState<string>(tabs[0].id);
        const [pendingTab, setPendingTab] = useState<string | null>(null);
        const [visible, setVisible] = useState<boolean>(true);
        const navRef = React.useRef<HTMLElement | null>(null);
        const tabRefs = React.useRef<Record<string, HTMLButtonElement | null>>({});
        const [indicator, setIndicator] = useState<{ left: number; width: number }>({ left: 0, width: 0 });

        const handleTabClick = (tabId: string) => {
            if (tabId === activeTab) return;
            setPendingTab(tabId);
            setVisible(false);
            window.setTimeout(() => {
                setActiveTab(tabId);
                setPendingTab(null);
                setVisible(true);
            }, 180);
        };

        const updateIndicator = () => {
            const navEl = navRef.current;
            const btn = tabRefs.current[activeTab];
            if (!navEl || !btn) return setIndicator({ left: 0, width: 0 });
            const navRect = navEl.getBoundingClientRect();
            const btnRect = btn.getBoundingClientRect();
            setIndicator({ left: btnRect.left - navRect.left, width: btnRect.width });
        };

        useEffect(() => {
            updateIndicator();
            const ro = new ResizeObserver(() => updateIndicator());
            if (navRef.current) ro.observe(navRef.current);
            window.addEventListener('resize', updateIndicator);
            return () => {
                ro.disconnect();
                window.removeEventListener('resize', updateIndicator);
            };
        }, [activeTab]);

        return (
                <ModeratorLayout breadcrumbs={breadcrumbs} title="Elementy planowania produkcji">
                        <h1 className="text-2xl font-bold mb-4">Elementy planowania produkcji</h1>

                        <div className="bg-white dark:bg-gray-800 rounded-md shadow-sm">
                            <div className="border-b border-gray-200 dark:border-gray-700">
                                <nav ref={navRef as any} className="relative flex -mb-px" aria-label="Tabs">
                                    {tabs.map(tab => (
                                        <button
                                            key={tab.id}
                                            ref={el => { tabRefs.current[tab.id] = el; }}
                                            onClick={() => handleTabClick(tab.id)}
                                            className={`px-4 py-3 text-sm font-medium -mb-px border-b-2 ${
                                                activeTab === tab.id
                                                    ? 'border-indigo-500 text-indigo-700 bg-indigo-50 dark:bg-indigo-900 dark:text-indigo-200 rounded-t-md'
                                                    : 'border-transparent text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white'
                                            }`}
                                        >
                                            {tab.label}
                                        </button>
                                    ))}

                                    {/* sliding indicator */}
                                    <div
                                        aria-hidden
                                        className="absolute bottom-0 h-1 bg-indigo-500 rounded-full transition-all duration-200"
                                        style={{ left: indicator.left, width: indicator.width }}
                                    />
                                </nav>
                            </div>

                            <div
                                className={`p-4 transition-all duration-180 transform ${
                                    visible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2'
                                }`}
                                key={activeTab}
                            >
                                {tabs.find(t => t.id === activeTab)?.content}
                            </div>
                        </div>
                </ModeratorLayout>
        );
}
