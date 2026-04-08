import React from 'react';
import { usePage } from '@inertiajs/react';
import AppLogoIcon from './app-logo-icon';

export default function AppLogo() {
    const page = usePage();
    const user = (page.props as any).auth?.user ?? {};
    const userName = user.name ?? 'Gość';
    const profilePhotoUrl = user.profile?.profile_photo_url || user.avatar;

    return (
        <>
            <div className="flex aspect-square h-12 w-12 items-center justify-center rounded-md bg-sidebar-primary text-sidebar-primary-foreground overflow-hidden">
                {profilePhotoUrl ? (
                    <img
                        src={profilePhotoUrl}
                        alt={userName}
                        className="h-full w-full object-cover rounded-md"
                        onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.style.display = 'none';
                            target.nextElementSibling?.classList.remove('hidden');
                        }}
                    />
                ) : null}
                <AppLogoIcon className={`h-5 w-5 fill-current text-white dark:text-black ${profilePhotoUrl ? 'hidden' : ''}`} />
            </div>
            <div className="ml-1 grid flex-1 text-left text-sm">
                <span className="mb-0.5 leading-tight font-semibold">
                    {userName}
                </span>
            </div>
        </>
    );
}
