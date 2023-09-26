// noinspection JSUnresolvedFunction

import {cleanUp, renderApp} from "../../../helpers/tests";
import React from "react";
import {LiveSayg} from "./LiveSayg";
import {saygBuilder} from "../../../helpers/builders";

describe('LiveSayg', () => {
    let context;
    let requestedSaygId;
    let saygData;
    const saygApi = {
        get: (id) => {
            requestedSaygId = id;
            return saygData;
        }
    }

    afterEach(() => {
        cleanUp(context);
    });

    async function renderComponent(route, currentPath) {
        requestedSaygId = null;
        context = await renderApp(
            {saygApi},
            {name: 'Courage Scores'},
            {},
            <LiveSayg />,
            route,
            currentPath);
    }

    it('requests given id', async () => {
        saygData = saygBuilder()
            .build();

        await renderComponent('/live/match/:id', '/live/match/' + saygData.id);

        expect(requestedSaygId).toEqual(saygData.id);
    })
});