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
const search = document.location.search;
const hash = document.location.hash;
const embed = search.indexOf('embed=true') !== -1 || hash.indexOf('embed=true') !== -1;
const controls = (search.indexOf('controls=') === -1 || search.indexOf('controls=true') !== -1)
&& (hash.indexOf('controls=') === -1 || hash.indexOf('controls=true') !== -1);
const branding = window.branding || {};

root.render(
  <BrowserRouter basename={baseUrl}>
    <IocContainer>
        <BrandingContainer {...branding}>
            <App embed={embed} controls={controls} />
        </BrandingContainer>
    </IocContainer>
  </BrowserRouter>);
