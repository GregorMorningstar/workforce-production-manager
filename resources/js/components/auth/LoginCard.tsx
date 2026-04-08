import React, { useState } from 'react';
import { router } from '@inertiajs/react';
import '../../../css/auth.css';

export default function LoginCard() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        router.post('/login', { email, password }, {
            onFinish: () => setLoading(false)
        });
    };

    return (
        <div className="auth-card welcome-login-card">
            <h2 className="auth-title">Logowanie</h2>

            <form onSubmit={submit} className="auth-form">
                <input
                    type="email"
                    placeholder="Email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="auth-input"
                    required
                />
                <input
                    type="password"
                    placeholder="Hasło"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="auth-input"
                    required
                />

                <button type="submit" className="auth-submit" disabled={loading}>
                    {loading ? 'Logowanie...' : 'Zaloguj się'}
                </button>
            </form>

            <div className="auth-footer split">
                <a href="/password/reset" className="auth-link">Zapomniałeś hasła?</a>
                <a href="/register" className="auth-link">Zarejestruj się</a>
            </div>
        </div>
    );
}
