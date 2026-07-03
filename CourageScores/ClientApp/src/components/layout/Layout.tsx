import { NavMenu } from './NavMenu.tsx';
import { Heading } from './Heading.tsx';
import { PageError } from '../common/PageError.tsx';
import { useApp } from '../common/AppContainer.tsx';
import { Footer } from './Footer.tsx';
import React from 'react';
import { hasAccess } from '../../helpers/conditions.ts';
import { AccessOption } from '../../interfaces/models/dtos/Identity/AccessOption.ts';

export interface ILayoutProps {
    children?: React.ReactNode;
}

export function Layout({ children }: ILayoutProps) {
    const { error, onError, embed, account, fullScreen } = useApp();
    const hideHeaderAndFooter =
        fullScreen.isFullScreen || hasAccess(account, AccessOption.kioskMode);

    function renderError() {
        return <PageError error={error!} />;
    }

    if (embed) {
        return (
            <div>
                {error ? (
                    renderError()
                ) : (
                    <div className="container">{children}</div>
                )}
            </div>
        );
    }

    try {
        return (
            <div>
                {hideHeaderAndFooter ? null : <Heading />}
                <NavMenu />
                {error ? (
                    renderError()
                ) : (
                    <div className="full-screen-print-mode container">
                        {children}
                    </div>
                )}
                {hideHeaderAndFooter ? null : <Footer />}
            </div>
        );
    } catch (e) {
        /* istanbul ignore next */
        onError(e);
    }
}
