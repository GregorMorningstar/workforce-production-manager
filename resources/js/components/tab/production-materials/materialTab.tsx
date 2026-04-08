import React, { useEffect, useRef, useState } from "react";
import AvailableMaterials from "./element/AvailableMaterials";
import InProductionMaterials from "./element/InProductionMaterials";
import ToAddMaterials from "./element/ToAddMaterials";
import MaterialsHistory from "./element/MaterialsHistory";

type TabKey = "available" | "in_production" | "to_add" | "history";

export default function MaterialTab() {
    const [tab, setTab] = useState<TabKey>("available");
    const containerRef = useRef<HTMLDivElement | null>(null);
    const tabRefs = useRef<Array<HTMLButtonElement | null>>([]);
    const [indicator, setIndicator] = useState<{ left: number; width: number }>({ left: 0, width: 0 });

    const tabs: { key: TabKey; label: string }[] = [
        { key: "available", label: "Materiały dostępne" },
        { key: "in_production", label: "W produkcji" },
        { key: "to_add", label: "Do dodania" },
        { key: "history", label: "Historia" },
    ];

    const renderContent = () => {
        switch (tab) {
            case "available":
                return <AvailableMaterials />;
            case "in_production":
                return <InProductionMaterials />;
            case "to_add":
                return <ToAddMaterials />;
            case "history":
                return <MaterialsHistory />;
            default:
                return null;
        }
    };

    useEffect(() => {
        function update() {
            const idx = tabs.findIndex((t) => t.key === tab);
            const btn = tabRefs.current[idx];
            const container = containerRef.current;
            if (btn && container) {
                const b = btn.getBoundingClientRect();
                const c = container.getBoundingClientRect();
                setIndicator({ left: b.left - c.left, width: b.width });
            }
        }

        update();
        window.addEventListener("resize", update);
        return () => window.removeEventListener("resize", update);
    }, [tab]);

    return (
        <div className="bg-white rounded shadow p-4">
            <div className="relative mb-4" ref={containerRef}>
                {/* sliding background indicator */}
                <div
                    className="absolute top-0 h-full rounded-t-md bg-white border shadow-sm transition-all duration-300 pointer-events-none"
                    style={{
                        left: indicator.left,
                        width: indicator.width,
                        boxSizing: 'border-box',
                        borderBottom: '3px solid #7c3aed',
                    }}
                />

                <div className="flex space-x-2 relative z-10">
                    {tabs.map((t, i) => (
                        <button
                            key={t.key}
                            ref={(el) => { tabRefs.current[i] = el }}
                            onClick={() => setTab(t.key)}
                            className={`px-3 py-1 rounded-t ${tab === t.key ? 'text-slate-900' : 'text-slate-600'}`}
                        >
                            {t.label}
                        </button>
                    ))}
                </div>
            </div>

            <div className="text-sm text-gray-700">{renderContent()}</div>
        </div>
    );
}
