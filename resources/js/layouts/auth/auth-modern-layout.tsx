import { useState, type PropsWithChildren } from 'react';
import '../../../css/auth.css';

interface AuthModernLayoutProps {
    title?: string;
    description?: string;
}

export default function AuthModernLayout({
    children,
    title,
    description,
}: PropsWithChildren<AuthModernLayoutProps>) {
    const [logoSrc, setLogoSrc] = useState('/storage/image/Logo-PANS-2022-pelne-2-scaled.jpg');

    const onLogoError = () => {
        if (logoSrc !== '/images/Logo-PANS-2022-pelne-2-scaled.jpg') {
            setLogoSrc('/images/Logo-PANS-2022-pelne-2-scaled.jpg');
        }
    };

    return (
        <div className="auth-root auth-login-custom">
            <div className="auth-header">
                <img
                    src={logoSrc}
                    alt="Logo PANS"
                    className="auth-logo-top"
                    onError={onLogoError}
                />
                <h1 className="auth-h1-top">Praca magisterska</h1>
            </div>
            <div className="auth-login-flex">
                <div className="rings right-ring" aria-hidden>
                    <span className="ring ring-3" />
                </div>
                <div className="auth-card auth-card-center">
                    {title && <h2 className="auth-title">{title}</h2>}
                    {description && <p className="auth-description">{description}</p>}
                    <div className="auth-content">
                        {children}
                    </div>
                </div>
            </div>
        </div>
    );
}
