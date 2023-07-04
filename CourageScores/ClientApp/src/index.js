import 'bootstrap/dist/css/bootstrap.css';
import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { App } from './App';
import {IocContainer} from "./IocContainer";
import {BrandingContainer} from "./BrandingContainer";

/* istanbul ignore file */
const baseUrl = document.getElementsByTagName('base')[0].getAttribute('href');
const rootElement = document.getElementById('root');
const root = createRoot(rootElement);
const shouldExcludeSurround = document.location.search.indexOf('surround=false') !== -1;
const branding = window.branding || {};

root.render(
  <BrowserRouter basename={baseUrl}>
    <IocContainer>
        <BrandingContainer {...branding}>
            <App shouldExcludeSurround={shouldExcludeSurround} />
        </BrandingContainer>
    </IocContainer>
  </BrowserRouter>);
