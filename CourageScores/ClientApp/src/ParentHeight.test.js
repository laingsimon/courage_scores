// noinspection JSUnresolvedReference

import {ParentHeight} from "./ParentHeight";

describe('ParentHeight', () => {
    let intervalCreated;
    let intervalCleared;
    let postedMessage;
    let nextHandle = 1;

    window.setInterval = (func, freq) => {
        const handle = nextHandle++;
        intervalCreated = { func, freq, handle };
        return handle;
    };

    window.clearInterval = (handle) => {
        intervalCleared = handle;
    };

    const parentMock = {
        postMessage: (message, targetOrigin, transfer) => {
            postedMessage = {message, targetOrigin, transfer};
        }
    };

    beforeEach(() => {
       intervalCreated = null;
       intervalCleared = null;
       postedMessage = null;
    });

   describe('setupInterval', () => {
       it('should setup interval', () => {
            const sut = new ParentHeight(() => 100, () => parentMock);

            sut.setupInterval(200);

            expect(intervalCreated).not.toBeNull();
            expect(intervalCreated.freq).toEqual(200);
       });

       it('should not setup interval if no parent', () => {
           const sut = new ParentHeight(() => 100, () => null);

           sut.setupInterval(200);

           expect(intervalCreated).toBeNull();
       });

       it('should not setup interval if already setup', () => {
           const sut = new ParentHeight(() => 100, () => parentMock);
           sut.setupInterval(200);

           sut.setupInterval(250);

           expect(intervalCreated).not.toBeNull();
           expect(intervalCreated.freq).toEqual(200);
       });
   });

    describe('cancelInterval', () => {
        it('should not clear interval if not setup', () => {
            const sut = new ParentHeight(() => 100, () => parentMock);

            sut.cancelInterval();

            expect(intervalCleared).toBeNull();
        });

        it('should clear interval', () => {
            const sut = new ParentHeight(() => 100, () => parentMock);
            sut.setupInterval(200);

            sut.cancelInterval();

            expect(intervalCleared).toEqual(intervalCreated.handle);
        });
    });

    describe('publishContentHeight', () => {
        let currentHeight = 0;

        it('should publish content height if never published before', async () => {
            const sut = new ParentHeight(() => currentHeight, () => parentMock);
            currentHeight = 123;
            sut.setupInterval(200);

            intervalCreated.func(); // publishContentHeight()

            expect(postedMessage).not.toBeNull();
            expect(postedMessage.targetOrigin).toEqual('*');
            expect(postedMessage.message).toEqual({
                height: 123,
            });
        });

        it('should publish content height if different to before', async () => {
            const sut = new ParentHeight(() => currentHeight, () => parentMock);
            currentHeight = 123;
            sut.setupInterval(200);
            intervalCreated.func(); // publishContentHeight()
            currentHeight = 456;

            intervalCreated.func(); // publishContentHeight()

            expect(postedMessage).not.toBeNull();
            expect(postedMessage.targetOrigin).toEqual('*');
            expect(postedMessage.message).toEqual({
                height: 456,
            });
        });

        it('should not publish content height if same as before', async () => {
            const sut = new ParentHeight(() => currentHeight, () => parentMock);
            currentHeight = 123;
            sut.setupInterval(200);
            intervalCreated.func(); // publishContentHeight()
            // dont change the height
            postedMessage = null;

            intervalCreated.func(); // publishContentHeight()

            expect(postedMessage).toBeNull();
        });
    });
});