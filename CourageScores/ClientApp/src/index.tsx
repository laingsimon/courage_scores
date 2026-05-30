import 'bootstrap/dist/css/bootstrap.css';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router';
import { App } from './App.tsx';
import {
    IIocContainerProps,
    IocContainer,
} from './components/common/IocContainer.tsx';
import { BrandingContainer } from './components/common/BrandingContainer.tsx';
import { IBrandingData } from './components/common/IBrandingData.ts';

interface IConfiguredPage {
    branding?: IBrandingData;
}

const baseUrl: string | null = document
    .getElementsByTagName('base')[0]
    .getAttribute('href');
const rootElement: HTMLElement = document.getElementById('root')!;
const root = createRoot(rootElement);
const search: string = document.location.search;
const hash: string = document.location.hash;
const embed: boolean =
    search.indexOf('embed=true') !== -1 || hash.indexOf('embed=true') !== -1;
const controls: boolean =
    (search.indexOf('controls=') === -1 ||
        search.indexOf('controls=true') !== -1) &&
    (hash.indexOf('controls=') === -1 || hash.indexOf('controls=true') !== -1);
const configuredPage: IConfiguredPage = window as IConfiguredPage;
const branding: IBrandingData = configuredPage.branding || {
    name: 'unknown',
    menu: {
        beforeDivisions: [],
        afterDivisions: [],
    },
};
const noServices: IIocContainerProps | null = {};

root.render(
    <BrowserRouter basename={baseUrl || ''}>
        <IocContainer {...noServices}>
            <BrandingContainer {...branding}>
                <App embed={embed} controls={controls} />
            </BrandingContainer>
        </IocContainer>
    </BrowserRouter>,
);
