import 'bootstrap/dist/css/bootstrap.css';
import {createRoot} from 'react-dom/client';
import {BrowserRouter} from 'react-router-dom';
import {App} from './App';
import {IIocContainerProps, IocContainer} from "./components/common/IocContainer";
import {BrandingContainer} from "./components/common/BrandingContainer";
import {IBranding} from "./components/common/IBranding";

/* istanbul ignore file */

// @ts-ignore
const baseUrl: string = document.getElementsByTagName('base')[0].getAttribute('href');
// @ts-ignore
const rootElement: HTMLElement = document.getElementById('root');
const root = createRoot(rootElement);
const search: string = document.location.search;
const hash: string = document.location.hash;
const embed: boolean = search.indexOf('embed=true') !== -1 || hash.indexOf('embed=true') !== -1;
const controls: boolean = (search.indexOf('controls=') === -1 || search.indexOf('controls=true') !== -1)
    && (hash.indexOf('controls=') === -1 || hash.indexOf('controls=true') !== -1);
// noinspection JSUnresolvedReference
const branding: IBranding = (window as any).branding || {};
const noServices: IIocContainerProps = null;

root.render(
    <BrowserRouter basename={baseUrl}>
        <IocContainer {...noServices}>
            <BrandingContainer {...branding}>
                <App embed={embed} controls={controls}/>
            </BrandingContainer>
        </IocContainer>
    </BrowserRouter>);
