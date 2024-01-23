import 'bootstrap/dist/css/bootstrap.css';
import React from 'react';
import {createRoot} from 'react-dom/client';
import {BrowserRouter} from 'react-router-dom';
import {App} from './App';
import {IIocContainerProps, IocContainer} from "./IocContainer";
import {BrandingContainer} from "./BrandingContainer";
import {IBranding} from "./interfaces/IBranding";
import {IDependencies} from "./interfaces/IDependencies";

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
