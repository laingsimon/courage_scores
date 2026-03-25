import {
    api,
    appProps,
    brandingProps,
    cleanUp,
    iocProps,
    noop,
    renderApp,
    TestContext,
} from '../../helpers/tests';
import { EditNote } from './EditNote';
import { EditFixtureDateNoteDto } from '../../interfaces/models/dtos/EditFixtureDateNoteDto';
import { IClientActionResultDto } from '../common/IClientActionResultDto';
import { FixtureDateNoteDto } from '../../interfaces/models/dtos/FixtureDateNoteDto';
import { DivisionDto } from '../../interfaces/models/dtos/DivisionDto';
import { SeasonDto } from '../../interfaces/models/dtos/Season/SeasonDto';
import { seasonBuilder } from '../../helpers/builders/seasons';
import { divisionBuilder, noteBuilder } from '../../helpers/builders/divisions';
import { INoteApi } from '../../interfaces/apis/INoteApi';
import { DivisionDataContainer } from '../league/DivisionDataContainer';

describe('EditNote', () => {
    let context: TestContext;
    let savedNote: { id: string; note: EditFixtureDateNoteDto } | null;
    let createdNote: EditFixtureDateNoteDto | null;
    let changedNote: FixtureDateNoteDto | null;
    let closed: boolean;
    let saved: boolean;
    let saveResult: IClientActionResultDto<FixtureDateNoteDto>;

    const noteApi = api<INoteApi>({
        create: async (
            note: EditFixtureDateNoteDto,
        ): Promise<IClientActionResultDto<FixtureDateNoteDto>> => {
            createdNote = note;
            return saveResult || { success: true };
        },
        upsert: async (
            id: string,
            note: EditFixtureDateNoteDto,
        ): Promise<IClientActionResultDto<FixtureDateNoteDto>> => {
            savedNote = { id, note };
            return saveResult || { success: true };
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

    async function renderComponent(
        note: FixtureDateNoteDto,
        divisions: DivisionDto[],
        ...seasons: SeasonDto[]
    ) {
        context = await renderApp(
            iocProps({ noteApi }),
            brandingProps(),
            appProps({
                divisions,
                seasons,
            }),
            <DivisionDataContainer
                onReloadDivision={noop}
                name="Division"
                season={seasons[0]}>
                <EditNote
                    note={note}
                    onNoteChanged={onNoteChanged}
                    onClose={onClose}
                    onSaved={onSaved}
                />
            </DivisionDataContainer>,
        );
    }

    describe('renders', () => {
        const season = seasonBuilder('SEASON')
            .starting('2023-05-01')
            .ending('2023-05-08')
            .build();
        const division = divisionBuilder('DIVISION').build();
        const divisions = [division];

        it('when editing', async () => {
            await renderComponent(
                noteBuilder('2023-05-01T00:00:00')
                    .note('Some note')
                    .season(season)
                    .build(),
                divisions,
                season,
            );

            const header = context.required('.modal-header');
            expect(header.text()).toContain('Edit note');
        });

        it('when creating', async () => {
            await renderComponent(
                noteBuilder('2023-05-01T00:00:00')
                    .noId()
                    .note('Some note')
                    .season(season)
                    .build(),
                divisions,
                season,
            );

            const header = context.required('.modal-header');
            expect(header.text()).toContain('Create note');
        });

        it('date', async () => {
            await renderComponent(
                noteBuilder('2023-05-01T00:00:00')
                    .note('Some note')
                    .season(season)
                    .build(),
                divisions,
                season,
            );

            const dateGroup = context.required(
                '.modal-body > div > div:nth-child(1)',
            );
            expect(dateGroup.text()).toContain('Date');
            const dateInput = dateGroup.required('input');
            expect(dateInput.value()).toEqual('2023-05-01');
        });

        it('note', async () => {
            await renderComponent(
                noteBuilder('2023-05-01T00:00:00')
                    .note('Some note')
                    .season(season)
                    .build(),
                divisions,
                season,
            );

            const noteGroup = context.required(
                '.modal-body > div > div:nth-child(2)',
            );
            expect(noteGroup.text()).toContain('Note');
            const noteInput = noteGroup.required('textarea');
            expect(noteInput.value()).toEqual('Some note');
        });

        it('preview', async () => {
            await renderComponent(
                noteBuilder('2023-05-01T00:00:00')
                    .note('**Some** note')
                    .season(season)
                    .build(),
                divisions,
                season,
            );

            const previewGroup = context.required(
                '.modal-body > div > div:nth-child(3)',
            );
            expect(previewGroup.text()).toContain('Preview');
            expect(previewGroup.required('div > div.alert > p').html()).toEqual(
                '**Some** note',
            );
        });

        it('season', async () => {
            await renderComponent(
                noteBuilder('2023-05-01T00:00:00')
                    .note('Some note')
                    .season(season)
                    .build(),
                divisions,
                season,
            );

            const seasonGroup = context.required(
                '.modal-body > div > div:nth-child(4)',
            );
            expect(seasonGroup.text()).toContain('Season');
            const seasonInput = seasonGroup.required('select');
            expect(seasonInput.value()).toEqual(season.id);
        });

        it('division', async () => {
            await renderComponent(
                noteBuilder('2023-05-01T00:00:00')
                    .note('Some note')
                    .season(season)
                    .division(division)
                    .build(),
                divisions,
                season,
            );

            const divisionGroup = context.required(
                '.modal-body > div > div:nth-child(5)',
            );
            expect(divisionGroup.text()).toContain('Division');
            const divisionInput = divisionGroup.required('select');
            expect(divisionInput.value()).toEqual(division.id);
        });

        it('all divisions', async () => {
            await renderComponent(
                noteBuilder('2023-05-01T00:00:00')
                    .note('Some note')
                    .season(season)
                    .build(),
                divisions,
                season,
            );

            const divisionGroup = context.required(
                '.modal-body > div > div:nth-child(5)',
            );
            expect(divisionGroup.text()).toContain('Division');
            const divisionInput = divisionGroup.required('select');
            expect(divisionInput.value()).toEqual('NULL');
        });
    });

    describe('interactivity', () => {
        const season = seasonBuilder('SEASON').build();
        const division = divisionBuilder('DIVISION').build();
        const divisions = [division];

        it('can change date', async () => {
            await renderComponent(
                noteBuilder('2023-05-01T00:00:00')
                    .note('Some note')
                    .season(season)
                    .build(),
                divisions,
                season,
            );
            const dateGroup = context.required(
                '.modal-body > div > div:nth-child(1)',
            );

            await dateGroup.required('input').change('2023-06-06');

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
                season,
            );
            const noteGroup = context.required(
                '.modal-body > div > div:nth-child(2)',
            );

            await noteGroup.required('textarea').change('Another note');

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
                season,
                anotherSeason,
            );
            const seasonGroup = context.required(
                '.modal-body > div > div:nth-child(4)',
            );

            await seasonGroup.required('select').change(anotherSeason.id);

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
                season,
            );
            const divisionGroup = context.required(
                '.modal-body > div > div:nth-child(5)',
            );

            await divisionGroup.required('select').change(anotherDivision.id);

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
                season,
            );
            const divisionGroup = context.required(
                '.modal-body > div > div:nth-child(5)',
            );

            await divisionGroup.required('select').change('NULL');

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
                season,
            );

            await context.button('Save').click();

            context.prompts.alertWasShown('You must enter a note');
            expect(savedNote).toBeNull();
        });

        it('cannot save when no date', async () => {
            await renderComponent(
                noteBuilder('').note('Some note').season(season).build(),
                divisions,
                season,
            );

            await context.button('Save').click();

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
                season,
            );

            await context.button('Save').click();

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
                season,
            );

            await context.button('Save').click();

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
                season,
            );
            saveResult = {
                success: false,
            };

            await context.button('Save').click();

            context.prompts.noAlerts();
            expect(savedNote).not.toBeNull();
            expect(saved).toEqual(false);
            expect(context.text()).toContain('Could not save note');
        });

        it('can hide error after problem saving', async () => {
            await renderComponent(
                noteBuilder('2023-05-01T00:00:00')
                    .note('Some note')
                    .season(season)
                    .build(),
                divisions,
                season,
            );
            saveResult = {
                success: false,
            };
            await context.button('Save').click();

            await context
                .required('.modal-dialog .modal-dialog')
                .button('Close')
                .click();

            expect(closed).toEqual(false);
            expect(context.text()).not.toContain('Could not save note');
        });

        it('can close dialog', async () => {
            await renderComponent(
                noteBuilder('2023-05-01T00:00:00')
                    .note('Some note')
                    .season(season)
                    .build(),
                divisions,
                season,
            );

            await context.button('Close').click();

            expect(closed).toEqual(true);
        });
    });
});
