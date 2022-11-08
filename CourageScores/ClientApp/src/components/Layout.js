import React from 'react';
import {Container} from 'reactstrap';
import {NavMenu} from './NavMenu';
import {Heading} from "./Heading";

export function Layout(props) {
    return (
        <div>
            <Heading />
            <NavMenu {...props} />
            <Container>
                {props.children}
            </Container>
        </div>
    );
}
