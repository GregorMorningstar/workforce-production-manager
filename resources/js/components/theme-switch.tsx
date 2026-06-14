import { useAppearance } from '@/hooks/use-appearance';
import { cn } from '@/lib/utils';
import { Moon, Sun } from 'lucide-react';
import { HTMLAttributes } from 'react';

type ThemeSwitchProps = HTMLAttributes<HTMLButtonElement> & {
    label?: string;
    hideLabelOnCollapsedSidebar?: boolean;
};

export default function ThemeSwitch({
    className,
    label = 'Motyw',
    hideLabelOnCollapsedSidebar = false,
    ...props
}: ThemeSwitchProps) {
    const { updateAppearance } = useAppearance();
    const isDark =
        typeof document !== 'undefined'
            ? document.documentElement.classList.contains('dark')
            : false;

    const toggleTheme = () => {
        updateAppearance(isDark ? 'light' : 'dark');
    };

    return (
        <button
            type="button"
            role="switch"
            aria-checked={isDark}
            aria-label="Przełącz motyw jasny i ciemny"
            onClick={toggleTheme}
            className={cn(
                'flex w-full items-center justify-between rounded-md border border-sidebar-border/60 bg-sidebar-accent/40 px-3 py-2 text-sm transition-colors hover:bg-sidebar-accent',
                className,
            )}
            {...props}
        >
            <span className="flex min-w-0 items-center gap-2">
                <Sun className="h-4 w-4 shrink-0" />
                <span
                    className={cn(
                        'truncate',
                        hideLabelOnCollapsedSidebar &&
                            'group-data-[collapsible=icon]:hidden',
                    )}
                >
                    {label}
                </span>
            </span>

            <span className="flex items-center gap-2">
                <span className="relative inline-flex h-6 w-11 shrink-0 items-center rounded-full bg-muted transition-colors">
                    <span
                        className={cn(
                            'h-5 w-5 rounded-full bg-white shadow transition-transform',
                            isDark ? 'translate-x-5' : 'translate-x-0.5',
                        )}
                    />
                </span>
                <Moon className="h-4 w-4 shrink-0" />
            </span>
        </button>
    );
}