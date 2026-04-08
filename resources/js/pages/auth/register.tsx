import { login } from '@/routes';
import { store } from '@/routes/register';
import { Form, Head } from '@inertiajs/react';

import InputError from '@/components/input-error';
import TextLink from '@/components/text-link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import '../../../css/auth.css';

export default function Register() {
    return (
        <div className="relative min-h-screen overflow-hidden bg-black">
            <Head title="Rejestracja">
                <link rel="preconnect" href="https://fonts.bunny.net" />
                <link href="https://fonts.bunny.net/css?family=instrument-sans:400,500,600" rel="stylesheet" />
            </Head>
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,209,102,0.12),transparent_30%),radial-gradient(circle_at_left,rgba(46,224,182,0.08),transparent_28%),radial-gradient(circle_at_bottom_right,rgba(255,90,122,0.12),transparent_32%)]" />
            <div className="flex min-h-[720px] items-center justify-center lg:min-h-screen relative">
                <div className="welcome-ring-bg register-ring-bg">
                    <span className="ring ring-3" />
                    <div className="auth-card welcome-login-card">
                        <img
                            src="https://pans.krosno.pl/wp-content/uploads/2023/04/logo-pans.webp"
                            alt="Państwowa Akademia Nauk Stosowanych w Krośnie"
                            className="mb-6 h-auto w-full max-w-[320px] mx-auto rounded-2xl bg-white/95 p-3 shadow-[0_8px_32px_rgba(255,255,255,0.08)]"
                        />
                        <h2 className="auth-title">Rejestracja</h2>
                        <p className="auth-description">Wprowadź swoje dane poniżej, aby utworzyć konto</p>
                        <Form
                            {...store.form()}
                            resetOnSuccess={['password', 'password_confirmation']}
                            disableWhileProcessing
                            className="flex flex-col gap-6"
                        >
                            {({ processing, errors }) => (
                                <>
                                    <div className="grid gap-6">
                                        <div className="grid gap-2">
                                            <Label className="text-white" htmlFor="name">Imię i nazwisko</Label>
                                            <Input
                                                id="name"
                                                type="text"
                                                required
                                                autoFocus
                                                tabIndex={1}
                                                autoComplete="name"
                                                name="name"
                                                placeholder="Pełne imię i nazwisko"
                                                className="auth-input"
                                            />
                                            <InputError
                                                message={errors.name}
                                                className="mt-2"
                                            />
                                        </div>

                                        <div className="grid gap-2">
                                            <Label className="text-white" htmlFor="email">Adres email</Label>
                                            <Input
                                                id="email"
                                                type="email"
                                                required
                                                tabIndex={2}
                                                autoComplete="email"
                                                name="email"
                                                placeholder="email@example.com"
                                                className="auth-input"
                                            />
                                            <InputError message={errors.email} />
                                        </div>

                                        <div className="grid gap-2">
                                            <Label className="text-white" htmlFor="password">Hasło</Label>
                                            <Input
                                                id="password"
                                                type="password"
                                                required
                                                tabIndex={3}
                                                autoComplete="new-password"
                                                name="password"
                                                placeholder="Hasło"
                                                className="auth-input"
                                            />
                                            <InputError message={errors.password} />
                                        </div>

                                        <div className="grid gap-2">
                                            <Label className="text-white" htmlFor="password_confirmation">
                                                Potwierdź hasło
                                            </Label>
                                            <Input
                                                id="password_confirmation"
                                                type="password"
                                                required
                                                tabIndex={4}
                                                autoComplete="new-password"
                                                name="password_confirmation"
                                                placeholder="Potwierdź hasło"
                                                className="auth-input"
                                            />
                                            <InputError
                                                message={errors.password_confirmation}
                                            />
                                        </div>

                                        <Button
                                            type="submit"
                                            className="mt-2 w-full"
                                            tabIndex={5}
                                            data-test="register-user-button"
                                        >
                                            {processing && <Spinner />}
                                            Utwórz konto
                                        </Button>
                                    </div>

                                    <div className="text-center text-sm text-white/90">
                                        Masz już konto?{' '}
                                        <TextLink href={login()} tabIndex={6} className="text-white">
                                            Zaloguj się
                                        </TextLink>
                                    </div>
                                </>
                            )}
                        </Form>
                    </div>
                </div>
            </div>
        </div>
    );
}
