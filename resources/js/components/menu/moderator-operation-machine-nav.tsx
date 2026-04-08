import React from "react";
import { usePage } from "@inertiajs/react";

export default function ModeratorOperationMachineNav() {
    const { url, props } = usePage<{ filters?: { q?: string; dept?: string; barcode?: string } }>();
    const q = props?.filters?.q ?? "";
    const dept = props?.filters?.dept ?? "";
    const barcode = props?.filters?.barcode ?? "";

    const cleanUrl = () => {
        const u = String(url ?? "/moderator/machines/operations");
        return u.split("?")[0];
    };

    const isActive = (href: string) => url?.startsWith(href);
    const isMachinesOnly = () =>
        isActive("/moderator/machines") && !isActive("/moderator/machines/operations");

    return (
        <nav className="flex items-center justify-between gap-4 flex-wrap">
            <form
                method="GET"
                action="/moderator/machines/operations"
                className="flex items-center gap-3 flex-1 min-w-[560px]"
            >
                <input
                    name="q"
                    defaultValue={q}
                    placeholder="Szukaj pracownika..."
                    className="flex-1 h-10 px-3 rounded-md border border-gray-200 bg-white placeholder-gray-400 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
                />

                <input
                    name="dept"
                    defaultValue={dept}
                    placeholder="Dział..."
                    className="w-48 h-10 px-3 rounded-md border border-gray-200 bg-white placeholder-gray-400 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
                />

                <input
                    name="barcode"
                    defaultValue={barcode}
                    placeholder="Barcode..."
                    className="w-48 h-10 px-3 rounded-md border border-gray-200 bg-white placeholder-gray-400 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
                />

                <button
                    type="submit"
                    className="h-10 px-4 bg-blue-600 text-white rounded-md font-semibold hover:bg-blue-700"
                >
                    Szukaj
                </button>

                <a
                    href={cleanUrl()}
                    className="h-10 px-4 border border-gray-200 bg-white text-gray-700 rounded-md hover:bg-gray-50 text-sm inline-flex items-center justify-center"
                >
                    Wyczyść
                </a>
            </form>

            <ul className="flex items-center gap-2 m-0 p-0 list-none">
                <li>
                    <a
                        href="/moderator/machines"
                        className={
                            "inline-flex items-center h-10 px-3 rounded-md text-sm font-medium " +
                            (isMachinesOnly()
                                ? "bg-blue-600 text-white border border-blue-600"
                                : "text-gray-700 hover:bg-gray-50")
                        }
                    >
                        Wszystkie
                    </a>
                </li>

                <li>
                    <a
                        href="/moderator/machines/operations"
                        className={
                            "inline-flex items-center h-10 px-3 rounded-md text-sm font-medium " +
                            (isActive("/moderator/machines/operations")
                                ? "bg-blue-600 text-white border border-blue-600"
                                : "text-gray-700 hover:bg-gray-50")
                        }
                    >
                        Operacje
                    </a>
                </li>
            </ul>
        </nav>
    );
}
