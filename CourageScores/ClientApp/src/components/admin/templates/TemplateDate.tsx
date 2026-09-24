import React, { useState } from 'react';
import { any } from '../../../helpers/collections.ts';
import {
    asyncCallback,
    stateChanged,
    valueChanged,
} from '../../../helpers/events.ts';
import { DateTemplateDto } from '../../../interfaces/models/dtos/Season/Creation/DateTemplateDto.ts';
import { FixtureTemplateDto } from '../../../interfaces/models/dtos/Season/Creation/FixtureTemplateDto.ts';
import { UntypedPromise } from '../../../interfaces/UntypedPromise.ts';
import { NoteTemplateDto } from '../../../interfaces/models/dtos/Season/Creation/NoteTemplateDto';
import { createTemporaryId } from '../../../helpers/projection.ts';
import { Dialog } from '../../common/Dialog.tsx';
import { FixtureDateNote } from '../../division_fixtures/FixtureDateNote.tsx';

const weekDays = [
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
    'Friday',
    'Saturday',
    'Sunday',
];

export interface ITemplateDateProps {
    date: DateTemplateDto;
    onUpdate(newDate: DateTemplateDto): UntypedPromise;
    onDelete(): UntypedPromise;
    divisionSharedAddresses: string[];
    templateSharedAddresses: string[];
    moveEarlier?(): UntypedPromise;
    moveLater?(): UntypedPromise;
    highlight?: string;
    setHighlight(highlight?: string): UntypedPromise;
    deleteDates(mnemonic: string): UntypedPromise;
    divisionCount: number;
}

export function TemplateDate({
    date,
    onUpdate,
    onDelete,
    divisionSharedAddresses,
    templateSharedAddresses,
    moveEarlier,
    moveLater,
    highlight,
    setHighlight,
    deleteDates,
    divisionCount,
}: ITemplateDateProps) {
    const [spec, setSpec] = useState<string>('');
    const [editingNote, setEditingNote] = useState<
        NoteTemplateDto | undefined
    >();

    async function updateFixtures(fixtures: FixtureTemplateDto[]) {
        const newDate: DateTemplateDto = Object.assign({}, date);
        newDate.fixtures = fixtures;
        await onUpdate(newDate);
    }

    async function updateNotes(notes: NoteTemplateDto[]) {
        const newDate: DateTemplateDto = Object.assign({}, date);
        newDate.notes = notes;
        await onUpdate(newDate);
    }

    async function deleteFixture(index: number) {
        await updateFixtures(
            date.fixtures!.filter(
                (_: FixtureTemplateDto, i: number) => i !== index,
            ),
        );
    }

    async function addFixture() {
        const parts = spec?.match(/^(.+?)(\s?-\s?(.+))?$/);
        const newFixture: FixtureTemplateDto = {
            home: (parts?.[1] ?? '').trim(),
            away: parts?.[3]?.trim(),
        };

        if (!newFixture.home || newFixture.home.charAt(0) === '-') {
            window.alert('Enter a spec in the format: "home[ - away]"');
            return;
        }

        await updateFixtures(date.fixtures!.concat([newFixture]));
        setSpec('');
    }

    async function addNote() {
        const newNote: NoteTemplateDto = {
            id: createTemporaryId(),
            note: 'NEW NOTE',
        };
        setEditingNote(newNote);
        await updateNotes([...(date.notes ?? []), newNote]);
    }

    async function saveNoteToTemplate(editingNote: NoteTemplateDto) {
        const newNotes = date.notes!.map((n) =>
            n.id === editingNote.id ? editingNote : n,
        );
        await updateNotes(newNotes);
        setEditingNote(undefined);
    }

    async function removeNote(editingNote: NoteTemplateDto) {
        const newNotes = date.notes!.filter((n) => n.id !== editingNote.id);
        await updateNotes(newNotes);
        setEditingNote(undefined);
    }

    async function onKeyUp(event: React.KeyboardEvent) {
        if (event.key === 'Enter') {
            await addFixture();
        }
    }

    function sharedAddressClassName(address: string): string {
        if (any(divisionSharedAddresses, (a) => a === address)) {
            return ' bg-secondary text-light';
        }

        if (any(templateSharedAddresses, (a) => a === address)) {
            return ' bg-warning text-light';
        }

        return '';
    }

    async function highlightIfCtrlDown(
        event: React.MouseEvent<HTMLSpanElement>,
        mnemonic: string,
    ) {
        if (!event.ctrlKey) {
            if (highlight) {
                await setHighlight();
            }
            return;
        }

        await setHighlight(mnemonic);
    }

    function getHighlightClassName(mnemonic: string) {
        return highlight === mnemonic ? ' bg-danger' : '';
    }

    async function deleteFixtureOrMnemonic(index: number) {
        if (highlight) {
            if (
                window.confirm(
                    `Are you sure you want to delete all fixtures where ${highlight} are playing?`,
                )
            ) {
                await deleteDates(highlight);
                await setHighlight();
            }
            return;
        }

        await deleteFixture(index);
    }

    return (
        <div className="position-relative">
            <span data-type="fixtures">
                {date.fixtures?.map((f, index: number) => (
                    <button
                        key={index}
                        data-type="fixture"
                        onClick={async () =>
                            await deleteFixtureOrMnemonic(index)
                        }
                        className={`btn btn-sm margin-right px-1 badge ${f.away ? 'btn-info' : 'btn-outline-info text-dark'}`}>
                        <span
                            className={`px-1 ${sharedAddressClassName(f.home)}${getHighlightClassName(f.home)}`}
                            onMouseMove={async (event) =>
                                await highlightIfCtrlDown(event, f.home)
                            }
                            onMouseLeave={async () => await setHighlight()}>
                            {f.home}
                        </span>
                        {f.away ? <span> - </span> : null}
                        {f.away ? (
                            <span
                                className={`px-1${getHighlightClassName(f.away)}`}
                                onMouseMove={async (event) =>
                                    await highlightIfCtrlDown(event, f.away!)
                                }
                                onMouseLeave={async () => await setHighlight()}>
                                {f.away}
                            </span>
                        ) : null}{' '}
                        &times;
                    </button>
                ))}
                <span className="margin-right badge bg-info ps-1">
                    <input
                        className="width-50 border-0 outline-0"
                        name="spec"
                        placeholder="h[ - a]"
                        onKeyUp={onKeyUp}
                        value={spec || ''}
                        onChange={stateChanged(setSpec)}
                    />
                    <button
                        className="ms-1 bg-info border-0 px-0"
                        onClick={addFixture}>
                        ➕
                    </button>
                </span>
            </span>

            <span
                data-type="notes"
                className="ms-1 ps-1 border-solid border-0 border-start border-secondary">
                {date.notes?.map((n) => (
                    <button
                        data-type="note"
                        key={n.id}
                        className="btn btn-sm badge bg-info-subtle text-black ps-1 ms-1"
                        onClick={() => setEditingNote(n)}>
                        {n.note}
                        <span className="ps-1"> ✏️</span>
                    </button>
                ))}

                <button
                    className="ms-1 bg-info-subtle border-0 px-1 badge"
                    onClick={addNote}>
                    ➕
                </button>
            </span>

            <button
                className="btn btn-sm btn-outline-danger float-end p-1"
                data-type="fixture"
                onClick={onDelete}>
                🗑️
            </button>
            <button
                className="btn btn-sm btn-outline-info float-end p-1"
                data-type="fixture"
                disabled={!moveEarlier}
                onClick={moveEarlier}>
                ⬆
            </button>
            <button
                className="btn btn-sm btn-outline-info float-end p-1"
                data-type="fixture"
                disabled={!moveLater}
                onClick={moveLater}>
                ⬇
            </button>

            {editingNote ? (
                <Dialog title="Edit note">
                    <div className="form-group my-3 d-flex">
                        <label htmlFor="note-text" className="input-group-text">
                            Note
                        </label>
                        <textarea
                            cols={75}
                            rows={2}
                            id="note-text"
                            value={editingNote.note}
                            name="note"
                            onChange={valueChanged(
                                editingNote,
                                asyncCallback(setEditingNote),
                            )}></textarea>
                    </div>
                    <div className="form-group my-3">
                        <h5>Preview</h5>
                        <div>
                            <FixtureDateNote
                                note={editingNote}
                                preventDelete={true}
                            />
                        </div>
                    </div>
                    <div className="input-group my-3">
                        <div className="input-group-prepend">
                            <span className="input-group-text">
                                Division (optional)
                            </span>
                        </div>
                        <select
                            value={editingNote.divisionNumber || 'NULL'}
                            name="divisionNumber"
                            onChange={valueChanged(
                                editingNote,
                                asyncCallback(setEditingNote),
                                'NULL',
                            )}>
                            <option key="" value={'NULL'}>
                                All divisions
                            </option>
                            {Array.from({ length: divisionCount }).map(
                                (_, index) => (
                                    <option key={index} value={index + 1}>
                                        Division {index + 1}
                                    </option>
                                ),
                            )}
                        </select>
                    </div>

                    <div className="input-group my-3">
                        <div className="input-group-prepend">
                            <span className="input-group-text">
                                Day of week
                            </span>
                        </div>
                        <select
                            value={editingNote.alternativeDayOfWeek || 'NULL'}
                            name="alternativeDayOfWeek"
                            onChange={valueChanged(
                                editingNote,
                                asyncCallback(setEditingNote),
                                'NULL',
                            )}>
                            <option key="" value={'NULL'}>
                                Same day as fixtures
                            </option>
                            {weekDays.map((weekDay) => (
                                <option key={weekDay} value={weekDay}>
                                    {weekDay}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className="modal-footer px-0 pb-0">
                        <div className="left-aligned">
                            <button
                                className="btn btn-secondary"
                                onClick={() => setEditingNote(undefined)}>
                                Close
                            </button>
                        </div>
                        <button
                            className="btn btn-danger"
                            onClick={async () => removeNote(editingNote)}>
                            Remove
                        </button>
                        <button
                            className="btn btn-primary"
                            onClick={async () =>
                                saveNoteToTemplate(editingNote)
                            }>
                            Save
                        </button>
                    </div>
                </Dialog>
            ) : null}
        </div>
    );
}
