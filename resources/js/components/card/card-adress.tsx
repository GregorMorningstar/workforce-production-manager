import { email } from '@/routes/password';
import React, { useEffect, useRef, useState } from 'react';
import { usePage } from '@inertiajs/react';
import { faPencil } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

export default function CardAdress({ address, avatarUrl, user }: { address?: any; avatarUrl?: string; user?: any }) {
    const containerRef = useRef<HTMLDivElement | null>(null);
    const linesRef = useRef<HTMLDivElement[]>([]);

    const resolvedName = address?.name || address?.full_name || address?.user?.name || user?.name || 'User';


    const page = usePage().props as any;
    const pageAuthAvatar = page?.auth?.user?.avatar ?? page?.user?.avatar ?? null;

    const resolvedAvatar = avatarUrl && avatarUrl.length
        ? avatarUrl
        : address?.avatar || address?.user?.avatar || address?.user?.profile_photo_url || user?.avatar || user?.profile_photo_url || pageAuthAvatar || null;

    const avatarSrc = resolvedAvatar && typeof resolvedAvatar === 'string' && resolvedAvatar.length
        ? resolvedAvatar
        : null;
    const finalAvatarSrc = (avatarSrc && typeof avatarSrc === 'string')
        ? (avatarSrc.startsWith('http') || avatarSrc.startsWith('//')
            ? avatarSrc
            : (avatarSrc.startsWith('/storage') ? avatarSrc : `/storage/${avatarSrc.replace(/^\/+/, '')}`))
        : null;

    const primaryPhone = address?.phone || address?.contact_phone || user?.phone || null;
    const emergencyPhone = address?.emergency_contact_phone || address?.contact_phone || null;
    const resolvedPesel = address?.pesel || user?.pesel || null;
    const role = (user?.role || address?.role || '').toString().toLowerCase();
    const [showPhone, setShowPhone] = useState(false);

    const currentUserRole = (page?.auth?.user?.role || page?.user?.role || '').toString().toLowerCase();

    const currentUserId = page?.auth?.user?.id ?? page?.user?.id ?? null;
    const ownerUser = address?.user || user || null;
    const ownerId = ownerUser?.id ?? address?.user_id ?? null;

    const isOwner = currentUserId && ownerId && currentUserId === ownerId;
    const isModerator = currentUserRole === 'moderator' || role === 'moderator' || user?.role === 'moderator';
    const isOtherUser = currentUserId && ownerId && currentUserId !== ownerId && !isModerator;

    useEffect(() => {
        const container = containerRef.current;
        const lines = linesRef.current.filter(Boolean);
        if (!container || lines.length === 0) return;

        const width = container.clientWidth;
        const speeds = lines.map(() => 30 + Math.random() * 60); // px/sec
        const offsets = lines.map(() => -width + Math.random() * width);

        let rafId = 0;
        let last = performance.now();

        const tick = (now: number) => {
            const dt = (now - last) / 1000;
            last = now;
            for (let i = 0; i < lines.length; i++) {
                offsets[i] += speeds[i] * dt;
                if (offsets[i] > width) offsets[i] = -width;
                const el = lines[i];
                if (el) el.style.transform = `translateX(${offsets[i]}px)`;
            }
            rafId = requestAnimationFrame(tick);
        };

        rafId = requestAnimationFrame(tick);
        const onResize = () => {
            const w = container.clientWidth;
            for (let i = 0; i < offsets.length; i++) offsets[i] = -w + Math.random() * w;
        };
        window.addEventListener('resize', onResize);

        return () => {
            cancelAnimationFrame(rafId);
            window.removeEventListener('resize', onResize);
        };
    }, []);

    return (
<div
    className="max-w-2xl mx-4 sm:max-w-sm md:max-w-sm lg:max-w-sm xl:max-w-sm sm:mx-auto md:mx-auto lg:mx-auto xl:mx-auto mt-16 bg-white shadow-xl rounded-lg text-gray-900">
    <div ref={containerRef} className="rounded-t-lg h-32 overflow-hidden relative bg-gradient-to-r from-sky-300 via-white to-pink-200">
        {[0,1,2,3,4,5].map((_, i) => (
            <div
                key={i}
                ref={el => { linesRef.current[i] = el as HTMLDivElement; }}
                className="absolute left-0 w-[200%] h-0.5 bg-gradient-to-r from-blue-900/90 to-transparent opacity-90"
                style={{ top: `${10 + i * 18}px`, transform: 'translateX(-100%)' }}
            />
        ))}
    </div>
    <div className="mx-auto w-32 h-32 relative -mt-16 border-4 border-white rounded-full overflow-hidden">
        {finalAvatarSrc ? (
            <img className="object-cover object-center h-32 w-32" src={finalAvatarSrc} alt={resolvedName} />
        ) : (
            <div className="h-32 w-32 flex items-center justify-center bg-gray-100 text-gray-800 text-lg font-semibold px-2 text-center">
                {(() => {
                    const parts = (resolvedName || 'User').split(/\s+/).filter(Boolean);
                    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
                    return (parts[0][0] + (parts[1][0] || '')).toUpperCase();
                })()}
            </div>
        )}
    </div>
    <div className="text-center mt-2">
        <p className="text-gray-500">{user?.email || address?.email || ''}</p>
    </div>
    <div className="px-6 mt-3">
        <div className="flex items-start justify-between text-sm text-gray-700">
            <div className="flex flex-col items-center text-center max-w-xs">
                <div className="p-2 rounded-full bg-blue-50">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-700" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M6.62 10.79a15.053 15.053 0 006.59 6.59l2.2-2.2a1 1 0 011.11-.21c1.2.48 2.5.74 3.85.74a1 1 0 011 1v3.5a1 1 0 01-1 1C10.07 21.5 2.5 13.93 2.5 3a1 1 0 011-1H7a1 1 0 011 1c0 1.35.26 2.65.74 3.85.2.45.07.97-.21 1.32l-2.2 2.2z" />
                    </svg>
                </div>
                <div className="mt-2">
                    {primaryPhone ? (
                        <a href={`tel:${primaryPhone}`} className="font-medium text-blue-800">{primaryPhone}</a>
                    ) : (
                        <span className="text-gray-400">Brak telefonu</span>
                    )}
                </div>
            </div>

            <div className="flex flex-col items-center text-center max-w-xs">
                <div className="p-2 rounded-full bg-gray-50">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-700" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" />
                    </svg>
                </div>
                <div className="mt-2 text-sm text-gray-700 max-w-xs break-words">
                    {(() => {
                        const addressText = address?.address?.address || address?.address || user?.address || null;
                        const safeAddressText = typeof addressText === 'string' ? addressText : null;
                        return safeAddressText || <span className="text-gray-400">Brak adresu</span>;
                    })()}
                </div>
            </div>
        </div>

        <div className="mt-4 px-6">
            <div className="flex items-center justify-between text-sm text-gray-700">
                <div className="flex-1 text-center">
                    {(isOwner || isModerator || isOtherUser) ? (
                        <div>
                            <div className="text-xs text-gray-500">PESEL</div>
                            <div className="font-medium">{resolvedPesel || <span className="text-gray-400">Brak</span>}</div>
                        </div>
                    ) : (
                        <div />
                    )}
                </div>
                <div className="flex-1 text-center">
                    <div className="text-xs text-gray-500">Kontakt bliski</div>
                    {emergencyPhone ? (
                        <a href={`tel:${emergencyPhone}`} className="font-medium text-blue-800">{emergencyPhone}</a>
                    ) : (
                        <div className="text-gray-400">Brak</div>
                    )}
                </div>
            </div>
        </div>
    </div>
    <div className="p-4 border-t mx-8 mt-2">
        {(() => {
            const isOwner = currentUserId && ownerId && currentUserId === ownerId;
            const isModerator = currentUserRole === 'moderator' || role === 'moderator' || user?.role === 'moderator';
            const isOtherUser = currentUserId && ownerId && currentUserId !== ownerId && !isModerator;
            if (isOwner) {
                return (
                    <div className="flex items-center justify-center space-x-3">
                        <a
                            href="/employee/adress/edit"
                            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
                        >
                           <FontAwesomeIcon icon={faPencil} />
                            Edytuj profil
                        </a>
                        <button
                            onClick={() => {
                                if (!confirm('Na pewno chcesz usunąć swój profil?')) return;
                                alert('Usuwanie profilu - wymaga implementacji backend');
                            }}
                            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 text-sm"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2 inline-block" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                                <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H3a1 1 0 100 2h14a1 1 0 100-2h-2V3a1 1 0 00-1-1H6zm2 6a1 1 0 012 0v6a1 1 0 11-2 0V8zm4 0a1 1 0 10-2 0v6a1 1 0 102 0V8z" clipRule="evenodd" />
                            </svg>
                            Usuń profil
                        </button>
                    </div>
                );
            } else if (isModerator) {
                return (
                    <div className="flex items-center justify-center space-x-3">
                        <button
                            onClick={() => {
                                alert('Moderator - edycja profilu użytkownika');
                            }}
                            className="px-4 py-2 bg-yellow-600 text-white rounded hover:bg-yellow-700 text-sm"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2 inline-block" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                                <path d="M17.414 2.586a2 2 0 010 2.828l-9.9 9.9a1 1 0 01-.464.263l-4 1a1 1 0 01-1.213-1.213l1-4a1 1 0 01.263-.464l9.9-9.9a2 2 0 012.828 0zM15.121 4.05l.829.829L5.5 15.33l-.829-.829L15.121 4.05z" />
                            </svg>
                            Moderuj profil
                        </button>
                        <button
                            onClick={() => {
                                if (!confirm('Na pewno chcesz usunąć profil tego użytkownika?')) return;
                                alert('Moderator - usuwanie profilu użytkownika');
                            }}
                            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 text-sm"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2 inline-block" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                                <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H3a1 1 0 100 2h14a1 1 0 100-2h-2V3a1 1 0 00-1-1H6zm2 6a1 1 0 012 0v6a1 1 0 11-2 0V8zm4 0a1 1 0 10-2 0v6a1 1 0 102 0V8z" clipRule="evenodd" />
                            </svg>
                            Usuń profil
                        </button>
                        <button
                            onClick={() => {
                                const chatUrl = `/chat?with=${ownerId}`;
                                window.open(chatUrl, 'chat', 'width=420,height=640');
                            }}
                            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 text-sm"
                        >
                            Napisz do użytkownika
                        </button>
                    </div>

                );
            } else if (isOtherUser) {
                return (
                    <div className="flex items-center justify-center">
                        <button
                            onClick={() => {
                                const chatUrl = `/chat?with=${ownerId}`;
                                window.open(chatUrl, 'chat', 'width=420,height=640');
                            }}
                            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
                        >
                            Napisz wiadomość
                        </button>
                    </div>
                );
            } else {

                return (
                    <div className="text-center">
                        <span className="text-gray-500 text-sm">Brak dostępnych akcji</span>
                    </div>
                );
            }
        })()}
    </div>

</div>    );
}
