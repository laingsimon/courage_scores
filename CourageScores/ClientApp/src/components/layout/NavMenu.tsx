import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router';
import './NavMenu.css';
import { any, isEmpty, sortBy } from '../../helpers/collections.ts';
import { useDependencies } from '../common/IocContainer.tsx';
import { useApp } from '../common/AppContainer.tsx';
import { useBranding } from '../common/BrandingContainer.tsx';
import { LoadingSpinnerSmall } from '../common/LoadingSpinnerSmall.tsx';
import { IMenuItem } from './IMenuItem.ts';
import { DivisionDto } from '../../interfaces/models/dtos/DivisionDto.ts';
import { SeasonDto } from '../../interfaces/models/dtos/Season/SeasonDto.ts';
import { AccessDto } from '../../interfaces/models/dtos/Identity/AccessDto.ts';
import { IError } from '../common/IError.ts';
import { NavLink } from '../common/NavLink.tsx';

export function NavMenu() {
    const { settings } = useDependencies();
    const { menu } = useBranding();
    const { account, clearError, divisions, appLoading, seasons } = useApp();
    const [collapsed, setCollapsed] = useState<boolean>(true);
    const [navMenuError, setNavMenuError] = useState<IError | null>(null);
    const location = useLocation();
    const fullScreen = account && account.access && account.access.kioskMode;

    useEffect(() => {
        setCollapsed(true);
    }, [location]);

    function isActive(toRegex: string) {
        const currentLink =
            'https://' + document.location.host + location.pathname;

        return decodeURI(currentLink).match(toRegex);
    }

    function getClassName(to: string) {
        return isActive(to) ? 'nav-item-active' : '';
    }

    async function navigate() {
        setCollapsed(true);
        if (clearError) {
            await clearError();
        }
    }

    function getLogoutUrl() {
        return `${settings.apiHost}/api/Account/Logout/?redirectUrl=${getRedirectUrl()}`;
    }

    function getRedirectUrl() {
        const currentLink: string = location.pathname + location.search;

        return encodeURIComponent(currentLink);
    }

    function shouldShowDivision(division: DivisionDto) {
        const currentSeasons = (seasons || []).filter(
            (s: SeasonDto) => s.isCurrent === true,
        );
        const currentDivisions = currentSeasons.flatMap(
            (s: SeasonDto) => s.divisions || [],
        );

        if (isEmpty(currentDivisions)) {
            return true;
        }

        return any(currentDivisions, (d: DivisionDto) => d.id === division.id);
    }

    function hasAdminAccess(access: AccessDto) {
        return (
            access.manageAccess ||
            access.viewExceptions ||
            access.importData ||
            access.exportData
        );
    }

    function renderMenuItem(
        menuItem: IMenuItem,
        index: number,
        location: string,
    ) {
        if (menuItem.url.startsWith('/')) {
            return (
                <li key={location + '_' + index} className="nav-item">
                    <NavLink
                        className={getClassName(menuItem.url)}
                        onClick={navigate}
                        to={menuItem.url}>
                        {menuItem.text}
                    </NavLink>
                </li>
            );
        }

        return (
            <li key={location + '_' + index} className="nav-item">
                <a className="nav-link" href={menuItem.url}>
                    {menuItem.text}
                </a>
            </li>
        );
    }

    function renderItems(location: string) {
        if (!menu) {
            return null;
        }

        const items = menu[location] || [];
        return items.map((menuItem: IMenuItem, index: number) => {
            return renderMenuItem(menuItem, index, location);
        });
    }

    function getDivisionAddress(division: DivisionDto) {
        const currentSeasons: SeasonDto[] = seasons
            .filter((s: SeasonDto) => s.isCurrent)
            .filter((s: SeasonDto) =>
                any(s.divisions, (d: DivisionDto) => d.id === division.id),
            );

        if (currentSeasons.length !== 1) {
            return `/division/${division.name}`;
        }

        const season: SeasonDto = currentSeasons[0];
        return `/fixtures/${season.name}/?division=${division.name}`;
    }

    if (navMenuError) {
        return (
            <div>
                ERROR: {navMenuError.message}: {navMenuError.stack}
            </div>
        );
    }

    try {
        return (
            <header
                className="d-print-none"
                data-state={collapsed ? 'collapsed' : 'expanded'}>
                <nav className="navbar-expand-sm navbar-toggleable-sm ng-white border-bottom box-shadow mb-3 navbar">
                    <div className="container">
                        {fullScreen ? null : (
                            <span
                                onClick={() => setCollapsed(!collapsed)}
                                className="me-auto navbar-brand">
                                Menu
                            </span>
                        )}
                        <button
                            onClick={() => setCollapsed(!collapsed)}
                            type="button"
                            className="mr-2 navbar-toggler">
                            {appLoading ? (
                                <span
                                    className="spinner-border spinner-border-sm margin-right"
                                    role="status"
                                    aria-hidden="true"></span>
                            ) : (
                                <span className="navbar-toggler-icon"></span>
                            )}
                        </button>
                        <div
                            className={`d-sm-inline-flex flex-sm-row-reverse collapse${collapsed ? '' : ' show'} navbar-collapse`}>
                            <ul className="navbar-nav flex-grow">
                                {fullScreen
                                    ? null
                                    : renderItems('beforeDivisions')}
                                {!appLoading &&
                                    divisions
                                        .filter(shouldShowDivision)
                                        .sort(sortBy('name'))
                                        .map((division: DivisionDto) => (
                                            <li
                                                className="nav-item"
                                                key={division.id}>
                                                <NavLink
                                                    onClick={navigate}
                                                    to={getDivisionAddress(
                                                        division,
                                                    )}>
                                                    {division.name}
                                                </NavLink>
                                            </li>
                                        ))}
                                {fullScreen
                                    ? null
                                    : renderItems('afterDivisions')}
                                {appLoading ? (
                                    <li className="nav-item">
                                        <a className="nav-link">
                                            <LoadingSpinnerSmall />
                                        </a>
                                    </li>
                                ) : null}
                                {!appLoading &&
                                account &&
                                account.access &&
                                hasAdminAccess(account.access) ? (
                                    <li className="nav-item">
                                        <NavLink
                                            onClick={navigate}
                                            className={getClassName('/admin')}
                                            to={`/admin`}>
                                            Admin
                                        </NavLink>
                                    </li>
                                ) : null}
                                {!appLoading ? (
                                    <li className="nav-item">
                                        {!appLoading && account ? (
                                            <a
                                                className="nav-link"
                                                href={`${getLogoutUrl()}`}>
                                                Logout ({account.givenName})
                                            </a>
                                        ) : null}
                                        {!appLoading && !account ? (
                                            <Link
                                                className="nav-link"
                                                to={`/login/?redirectUrl=${getRedirectUrl()}`}>
                                                Login
                                            </Link>
                                        ) : null}
                                    </li>
                                ) : null}
                            </ul>
                        </div>
                    </div>
                </nav>
            </header>
        );
    } catch (e) {
        const error: Error = e as Error;

        setNavMenuError({
            message: error.message,
            stack: error.stack,
        });
    }
}
