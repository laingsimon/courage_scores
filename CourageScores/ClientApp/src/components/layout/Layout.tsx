import {Container} from 'reactstrap';
import {NavMenu} from './NavMenu';
import {Heading} from "./Heading";
import {PageError} from "../common/PageError";
import {useApp} from "../common/AppContainer";
import {Footer} from "./Footer";
import React from "react";

export interface ILayoutProps {
    children?: React.ReactNode;
}

export function Layout({children}: ILayoutProps) {
    const {error, onError, embed} = useApp();

    function renderError() {
        return (<PageError error={error}/>)
    }

    if (embed) {
        return (<div>
            {error ? renderError() : (<Container>
                {children}
            </Container>)}
        </div>);
    }

    try {
        return (
            <div>
                <Heading/>
                <NavMenu/>
                {error ? renderError() : (<Container className="full-screen-print-mode">
                    {children}
                </Container>)}
                <Footer/>
            </div>
        );
    } catch (e) {
        /* istanbul ignore next */
        onError(e);
    }
}
