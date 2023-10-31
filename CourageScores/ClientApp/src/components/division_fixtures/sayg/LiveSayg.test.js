// noinspection JSUnresolvedFunction

import {cleanUp, renderApp} from "../../../helpers/tests";
import React from "react";
import {LiveSayg} from "./LiveSayg";
import {saygBuilder} from "../../../helpers/builders";

describe('LiveSayg', () => {
    let context;
    let requestedSaygId;
    let saygData;
    let reportedError;
    const saygApi = {
        get: (id) => {
            requestedSaygId = id;
            return saygData;
        },
        createSocket: async (id) => {
            return {
                send: () => {
                    // do nothing
                }
            };
        }
    }

    afterEach(() => {
        cleanUp(context);
    });

    async function renderComponent(route, currentPath) {
        requestedSaygId = null;
        reportedError = null;
        context = await renderApp(
            {saygApi},
            {name: 'Courage Scores'},
            {
                onError: (err) => {
                    reportedError = {
                        message: err.message,
                        stack: err.stack
                    };
                },
            },
            <LiveSayg />,
            route,
            currentPath);
    }

    it('requests given id', async () => {
        saygData = saygBuilder()
            .build();

        await renderComponent('/live/match/:id', '/live/match/' + saygData.id);

        expect(reportedError).toBeNull();
        expect(requestedSaygId).toEqual(saygData.id);
    })
});