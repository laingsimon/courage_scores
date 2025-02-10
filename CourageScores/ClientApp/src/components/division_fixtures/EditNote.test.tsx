import {
    api,
    appProps,
    brandingProps,
    cleanUp,
    doChange,
    doClick,
    findButton,
    iocProps,
    renderApp, TestContext
} from "../../helpers/tests";
import {EditNote} from "./EditNote";
import {EditFixtureDateNoteDto} from "../../interfaces/models/dtos/EditFixtureDateNoteDto";
import {IClientActionResultDto} from "../common/IClientActionResultDto";
import {FixtureDateNoteDto} from "../../interfaces/models/dtos/FixtureDateNoteDto";
import {DivisionDto} from "../../interfaces/models/dtos/DivisionDto";
import {SeasonDto} from "../../interfaces/models/dtos/Season/SeasonDto";
import {seasonBuilder} from "../../helpers/builders/seasons";
import {divisionBuilder, noteBuilder} from "../../helpers/builders/divisions";
import {INoteApi} from "../../interfaces/apis/INoteApi";

describe('EditNote', () => {
    let context: TestContext;
    let savedNote: { id: string, note: EditFixtureDateNoteDto } | null;
    let createdNote: EditFixtureDateNoteDto | null;
    let changedNote: FixtureDateNoteDto | null;
    let closed: boolean;
    let saved: boolean;
    let saveResult: IClientActionResultDto<FixtureDateNoteDto>;

    const noteApi = api<INoteApi>({
        create: async (note: EditFixtureDateNoteDto): Promise<IClientActionResultDto<FixtureDateNoteDto>> => {
            createdNote = note;
            return saveResult || {success: true};
        },
        upsert: async (id: string, note: EditFixtureDateNoteDto): Promise<IClientActionResultDto<FixtureDateNoteDto>> => {
            savedNote = {id, note};
            return saveResult || {success: true};
        },
    });

    async function onNoteChanged(note: FixtureDateNoteDto) {
        changedNote = note;
    }

    async function onClose() {
        closed = true;
    }

    async function onSaved() {
        saved = true;
    }

    afterEach(async () => {
        await cleanUp(context);
    });

    beforeEach(() => {
        savedNote = null;
        changedNote = null;
        createdNote = null;
        closed = false;
        saved = false;
    });

    async function renderComponent(note: FixtureDateNoteDto, divisions: DivisionDto[], seasons: SeasonDto[]) {
        context = await renderApp(
            iocProps({noteApi}),
            brandingProps(),
            appProps({
                divisions,
                seasons
            }),
            (<EditNote note={note} onNoteChanged={onNoteChanged} onClose={onClose} onSaved={onSaved} />));
    }

    describe('renders', () => {
        const season = seasonBuilder('SEASON').build();
        const division = divisionBuilder('DIVISION').build();
        const divisions = [division];
        const seasons = [season];

        it('when editing', async () => {
            await renderComponent(
                noteBuilder('2023-05-01T00:00:00')
                    .note('Some note')
                    .season(season)
                    .build(),
                divisions,
                seasons);

            const header = context.container.querySelector('.modal-header')!;
            expect(header).toBeTruthy();
            expect(header.textContent).toContain('Edit note');
        });

        it('when creating', async () => {
            await renderComponent(
                noteBuilder('2023-05-01T00:00:00')
                    .noId()
                    .note('Some note')
                    .season(season)
                    .build(),
                divisions,
                seasons);

            const header = context.container.querySelector('.modal-header')!;
            expect(header).toBeTruthy();
            expect(header.textContent).toContain('Create note');
        });

        it('date', async () => {
            await renderComponent(
                noteBuilder('2023-05-01T00:00:00')
                    .note('Some note')
                    .season(season)
                    .build(),
                divisions,
                seasons);

            const dateGroup = context.container.querySelector('.modal-body > div > div:nth-child(1)')!;
            expect(dateGroup).toBeTruthy();
            expect(dateGroup.textContent).toContain('Date');
            const dateInput = dateGroup.querySelector('input')!;
            expect(dateInput).toBeTruthy();
            expect(dateInput.value).toEqual('2023-05-01');
        });

        it('note', async () => {
            await renderComponent(
                noteBuilder('2023-05-01T00:00:00')
                    .note('Some note')
                    .season(season)
                    .build(),
                divisions,
                seasons);

            const noteGroup = context.container.querySelector('.modal-body > div > div:nth-child(2)')!;
            expect(noteGroup).toBeTruthy();
            expect(noteGroup.textContent).toContain('Note');
            const noteInput = noteGroup.querySelector('textarea')!;
            expect(noteInput).toBeTruthy();
            expect(noteInput.value).toEqual('Some note');
        });

        it('preview', async () => {
            await renderComponent(
                noteBuilder('2023-05-01T00:00:00')
                    .note('**Some** note')
                    .season(season)
                    .build(),
                divisions,
                seasons);

            const previewGroup = context.container.querySelector('.modal-body > div > div:nth-child(3)')!;
            expect(previewGroup).toBeTruthy();
            expect(previewGroup.textContent).toContain('Preview');
            expect(previewGroup.querySelector('div > div.alert > p')!.innerHTML).toEqual('**Some** note');
        });

        it('season', async () => {
            await renderComponent(
                noteBuilder('2023-05-01T00:00:00')
                    .note('Some note')
                    .season(season)
                    .build(),
                divisions,
                seasons);

            const seasonGroup = context.container.querySelector('.modal-body > div > div:nth-child(4)')!;
            expect(seasonGroup).toBeTruthy();
            expect(seasonGroup.textContent).toContain('Season');
            const seasonInput = seasonGroup.querySelector('select')!;
            expect(seasonInput).toBeTruthy();
            expect(seasonInput.value).toEqual(season.id);
        });

        it('division', async () => {
            await renderComponent(
                noteBuilder('2023-05-01T00:00:00')
                    .note('Some note')
                    .season(season)
                    .division(division)
                    .build(),
                divisions,
                seasons);

            const divisionGroup = context.container.querySelector('.modal-body > div > div:nth-child(5)')!;
            expect(divisionGroup).toBeTruthy();
            expect(divisionGroup.textContent).toContain('Division');
            const divisionInput = divisionGroup.querySelector('select')!;
            expect(divisionInput).toBeTruthy();
            expect(divisionInput.value).toEqual(division.id);
        });

        it('all divisions', async () => {
            await renderComponent(
                noteBuilder('2023-05-01T00:00:00')
                    .note('Some note')
                    .season(season)
                    .build(),
                divisions,
                seasons);

            const divisionGroup = context.container.querySelector('.modal-body > div > div:nth-child(5)')!;
            expect(divisionGroup).toBeTruthy();
            expect(divisionGroup.textContent).toContain('Division');
            const divisionInput = divisionGroup.querySelector('select')!;
            expect(divisionInput).toBeTruthy();
            expect(divisionInput.value).toEqual('NULL');
        });
    });

    describe('interactivity', () => {
        const season = seasonBuilder('SEASON').build();
        const division = divisionBuilder('DIVISION').build();
        const divisions = [division];
        const seasons = [season];

        it('can change date', async () => {
            await renderComponent(
                noteBuilder('2023-05-01T00:00:00')
                    .note('Some note')
                    .season(season)
                    .build(),
                divisions,
                seasons);
            const dateGroup = context.container.querySelector('.modal-body > div > div:nth-child(1)')!;

            await doChange(dateGroup, 'input', '2023-06-06', context.user);

            expect(changedNote).toBeTruthy();
            expect(changedNote!.date).toEqual('2023-06-06');
        });

        it('can change note', async () => {
            await renderComponent(
                noteBuilder('2023-05-01T00:00:00')
                    .note('Some note')
                    .season(season)
                    .build(),
                divisions,
                seasons);
            const noteGroup = context.container.querySelector('.modal-body > div > div:nth-child(2)')!;

            await doChange(noteGroup, 'textarea', 'Another note', context.user);

            expect(changedNote).toBeTruthy();
            expect(changedNote!.note).toEqual('Another note');
        });

        it('can change season', async () => {
            const anotherSeason = seasonBuilder('ANOTHER SEASON').build();
            await renderComponent(
                noteBuilder('2023-05-01T00:00:00')
                    .note('Some note')
                    .season(season)
                    .build(),
                divisions,
                [season, anotherSeason]);
            const seasonGroup = context.container.querySelector('.modal-body > div > div:nth-child(4)')!;

            await doChange(seasonGroup, 'select', anotherSeason.id, context.user);

            expect(changedNote).toBeTruthy();
            expect(changedNote!.seasonId).toEqual(anotherSeason.id);
        });

        it('can change division', async () => {
            const anotherDivision = divisionBuilder('ANOTHER DIVISION').build();
            await renderComponent(
                noteBuilder('2023-05-01T00:00:00')
                    .note('Some note')
                    .season(season)
                    .build(),
                [division, anotherDivision],
                seasons);
            const divisionGroup = context.container.querySelector('.modal-body > div > div:nth-child(5)')!;

            await doChange(divisionGroup, 'select', anotherDivision.id, context.user);

            expect(changedNote).toBeTruthy();
            expect(changedNote!.divisionId).toEqual(anotherDivision.id);
        });

        it('can change to all divisions', async () => {
            await renderComponent(
                noteBuilder('2023-05-01T00:00:00')
                    .note('Some note')
                    .season(season)
                    .build(),
                divisions,
                seasons);
            const divisionGroup = context.container.querySelector('.modal-body > div > div:nth-child(5)')!;

            await doChange(divisionGroup, 'select', 'NULL', context.user);

            expect(changedNote).toBeTruthy();
            expect(changedNote!.divisionId).toEqual(null);
        });

        it('cannot save when no note', async () => {
            await renderComponent(
                noteBuilder('2023-05-01T00:00:00')
                    .note('')
                    .season(season)
                    .build(),
                divisions,
                seasons);

            await doClick(findButton(context.container, 'Save'));

            context.prompts.alertWasShown('You must enter a note');
            expect(savedNote).toBeNull();
        });

        it('cannot save when no date', async () => {
            await renderComponent(
                noteBuilder('')
                    .note('Some note')
                    .season(season)
                    .build(),
                divisions,
                seasons);

            await doClick(findButton(context.container, 'Save'));

            context.prompts.alertWasShown('You must enter a date');
            expect(savedNote).toBeNull();
        });

        it('can create note', async () => {
            await renderComponent(
                noteBuilder('2023-05-01T00:00:00')
                    .noId()
                    .note('Some note')
                    .season(season)
                    .updated('2023-07-01T00:00:00')
                    .build(),
                divisions,
                seasons);

            await doClick(findButton(context.container, 'Save'));

            context.prompts.noAlerts();
            expect(createdNote).not.toBeNull();
            expect(saved).toEqual(true);
        });

        it('can update note', async () => {
            await renderComponent(
                noteBuilder('2023-05-01T00:00:00')
                    .note('Some note')
                    .season(season)
                    .updated('2023-07-01T00:00:00')
                    .build(),
                divisions,
                seasons);

            await doClick(findButton(context.container, 'Save'));

            context.prompts.noAlerts();
            expect(savedNote).not.toBeNull();
            expect(savedNote!.note.lastUpdated).toEqual('2023-07-01T00:00:00');
            expect(saved).toEqual(true);
        });

        it('shows error if unable to save', async () => {
            await renderComponent(
                noteBuilder('2023-05-01T00:00:00')
                    .note('Some note')
                    .season(season)
                    .build(),
                divisions,
                seasons);
            saveResult = {
                success: false,
            };

            await doClick(findButton(context.container, 'Save'));

            context.prompts.noAlerts();
            expect(savedNote).not.toBeNull();
            expect(saved).toEqual(false);
            expect(context.container.textContent).toContain('Could not save note');
        });

        it('can hide error after problem saving', async () => {
            await renderComponent(
                noteBuilder('2023-05-01T00:00:00')
                    .note('Some note')
                    .season(season)
                    .build(),
                divisions,
                seasons);
            saveResult = {
                success: false,
            };
            await doClick(findButton(context.container, 'Save'));

            await doClick(findButton(context.container.querySelector('.modal-dialog .modal-dialog'), 'Close'));

            expect(closed).toEqual(false);
            expect(context.container.textContent).not.toContain('Could not save note');
        });

        it('can close dialog', async () => {
            await renderComponent(
                noteBuilder('2023-05-01T00:00:00')
                    .note('Some note')
                    .season(season)
                    .build(),
                divisions,
                seasons);

            await doClick(findButton(context.container, 'Close'));

            expect(closed).toEqual(true);
        });
    });
});