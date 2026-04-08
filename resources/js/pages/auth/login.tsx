import InputError from '@/components/input-error';
import TextLink from '@/components/text-link';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { register } from '@/routes';
import { store } from '@/routes/login';
import { request } from '@/routes/password';
import { Form, Head } from '@inertiajs/react';
import '../../../css/auth.css';

interface LoginProps {
    status?: string;
    canResetPassword: boolean;
    canRegister: boolean;
}

export default function Login({
    status,
    canResetPassword,
    canRegister,
}: LoginProps) {
    return (
        <div className="relative min-h-screen overflow-hidden bg-black">
            <Head title="Logowanie">
                <link rel="preconnect" href="https://fonts.bunny.net" />
                <link href="https://fonts.bunny.net/css?family=instrument-sans:400,500,600" rel="stylesheet" />
            </Head>
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,209,102,0.12),transparent_30%),radial-gradient(circle_at_left,rgba(46,224,182,0.08),transparent_28%),radial-gradient(circle_at_bottom_right,rgba(255,90,122,0.12),transparent_32%)]" />
            <div className="flex min-h-[720px] items-center justify-center lg:min-h-screen relative">
                <div className="welcome-ring-bg">
                    <span className="ring ring-3" />
                    <div className="auth-card welcome-login-card text-white">
                        <img
                            src="https://pans.krosno.pl/wp-content/uploads/2023/04/logo-pans.webp"
                            alt="Państwowa Akademia Nauk Stosowanych w Krośnie"
                            className="mb-6 h-auto w-full max-w-[320px] mx-auto rounded-2xl bg-white/95 p-3 shadow-[0_8px_32px_rgba(255,255,255,0.08)]"
                        />
                        <h2 className="auth-title">Logowanie</h2>
                        <p className="auth-description">Wprowadź swój email i hasło poniżej</p>

                        <Form
                            {...store.form()}
                            resetOnSuccess={['password']}
                            className="flex flex-col gap-6"
                        >
                            {({ processing, errors }) => (
                                <>
                                    <div className="grid gap-6">
                                        <div className="grid gap-2">
                                            <Label className="text-white" htmlFor="email">Adres email</Label>
                                            <Input
                                                id="email"
                                                type="email"
                                                name="email"
                                                required
                                                autoFocus
                                                tabIndex={1}
                                                autoComplete="email"
                                                placeholder="email@example.com"
                                                className="auth-input"
                                            />
                                            <InputError message={errors.email} />
                                        </div>

                                        <div className="grid gap-2">
                                            <div className="flex items-center">
                                                <Label className="text-white" htmlFor="password">Haslo</Label>
                                                {canResetPassword && (
                                                    <TextLink
                                                        href={request()}
                                                        className="ml-auto text-sm text-white"
                                                        tabIndex={5}
                                                    >
                                                        Zapomniales hasla?
                                                    </TextLink>
                                                )}
                                            </div>
                                            <Input
                                                id="password"
                                                type="password"
                                                name="password"
                                                required
                                                tabIndex={2}
                                                autoComplete="current-password"
                                                placeholder="Haslo"
                                                className="auth-input"
                                            />
                                            <InputError message={errors.password} />
                                        </div>

                                        <div className="flex items-center space-x-3">
                                            <Checkbox id="remember" name="remember" tabIndex={3} />
                                            <Label className="text-white" htmlFor="remember">Zapamietaj mnie</Label>
                                        </div>

                                        <Button
                                            type="submit"
                                            className="mt-4 w-full"
                                            tabIndex={4}
                                            disabled={processing}
                                            data-test="login-button"
                                        >
                                            {processing && <Spinner />}
                                            Zaloguj sie
                                        </Button>
                                    </div>

                                    {canRegister && (
                                        <div className="text-center text-sm text-white/90">
                                            Nie masz konta?{' '}
                                            <TextLink href={register()} tabIndex={5} className="text-white">
                                                Zarejestruj sie
                                            </TextLink>
                                        </div>
                                    )}
                                </>
                            )}
                        </Form>

                        {status && (
                            <div className="mb-4 text-center text-sm font-medium text-green-400">
                                {status}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
