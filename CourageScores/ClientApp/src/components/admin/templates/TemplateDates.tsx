import { TemplateDate } from './TemplateDate.tsx';
import { DateTemplateDto } from '../../../interfaces/models/dtos/Season/Creation/DateTemplateDto.ts';
import { repeat } from '../../../helpers/projection.ts';
import { any } from '../../../helpers/collections.ts';
import { FixtureTemplateDto } from '../../../interfaces/models/dtos/Season/Creation/FixtureTemplateDto.ts';
import { UntypedPromise } from '../../../interfaces/UntypedPromise.ts';
import { NoteTemplateDto } from '../../../interfaces/models/dtos/Season/Creation/NoteTemplateDto';
import React, { useState } from 'react';

export interface ITemplateDatesProps {
    dates: DateTemplateDto[];
    onUpdate(newDates: DateTemplateDto[]): UntypedPromise;
    onCopyToDivision(destinationDivisionIndex: number): UntypedPromise;
    divisionSharedAddresses: string[];
    templateSharedAddresses: string[];
    divisionNo: number;
    divisionCount: number;
    highlight?: string;
    setHighlight(highlight?: string): UntypedPromise;
    getCrossDivisionalNotes: (dateIndex: number) => NoteTemplateDto[];
}

export interface TentativeMove {
    sourceIndex: number;
    targetIndex: number;
}

export function applyMove(dates: DateTemplateDto[], move?: TentativeMove) {
    if (!move) {
        return dates;
    }

    const { sourceIndex, targetIndex } = move;
    const moving = dates[sourceIndex];
    return dates.flatMap((d, di) => {
        if (di === targetIndex && di !== sourceIndex) {
            return targetIndex < sourceIndex ? [moving, d] : [d, moving];
        }
        if (di === sourceIndex && di === targetIndex) {
            return [d];
        }
        if (di === sourceIndex) {
            return [];
        }

        return [d];
    });
}

export function TemplateDates({
    dates,
    onUpdate,
    divisionSharedAddresses,
    templateSharedAddresses,
    divisionCount,
    divisionNo,
    onCopyToDivision,
    highlight,
    setHighlight,
    getCrossDivisionalNotes,
}: ITemplateDatesProps) {
    const [thisDivisionTentativeMove, setThisDivisionTentativeMove] = useState<
        TentativeMove | undefined
    >();

    async function updateDate(update: DateTemplateDto, updateIndex: number) {
        await onUpdate(
            dates.map((a: DateTemplateDto, index: number) =>
                index === updateIndex ? update : a,
            ),
        );
    }

    async function addDate() {
        const newDate: DateTemplateDto = {
            fixtures: [],
        };
        await onUpdate(dates.concat([newDate]));
    }

    async function deleteDate(index: number) {
        await onUpdate(
            dates.filter((_: DateTemplateDto, i: number) => index !== i),
        );
    }

    async function deleteDates(mnemonic: string) {
        const newDates: DateTemplateDto[] = dates.map(
            (date: DateTemplateDto) => {
                const newDate: DateTemplateDto = Object.assign({}, date);
                newDate.fixtures = date.fixtures!.filter(
                    (f: FixtureTemplateDto) =>
                        f.home !== mnemonic && f.away !== mnemonic,
                );
                return newDate;
            },
        );
        await onUpdate(newDates);
    }

    async function copyDates() {
        const secondHalf = dates.map((d) => {
            const newDate = Object.assign({}, d);
            newDate.fixtures = d.fixtures?.map((f) => {
                return f.away ? { home: f.away!, away: f.home } : f;
            });
            return newDate;
        });

        const newDates = dates.concat(secondHalf);
        await onUpdate(newDates);
    }

    const divisionNoDataType: string = 'application/division-' + divisionNo;
    const sourceIndexDataTypeName: string = 'application/week-index-';
    const sourceIndexDataType: string = 'application/source-index';

    async function startDrag(
        sourceIndex: number,
        event: React.DragEvent<HTMLLIElement>,
    ) {
        event.dataTransfer.setData(
            sourceIndexDataTypeName + sourceIndex,
            sourceIndex.toString(),
        );
        event.dataTransfer.setData(sourceIndexDataType, sourceIndex.toString());
        event.dataTransfer.setData(divisionNoDataType, divisionNo.toString());
        event.dataTransfer.effectAllowed = 'move';
    }

    async function dragOver(
        targetIndex: number,
        event: React.DragEvent<HTMLLIElement>,
    ) {
        if (!event.dataTransfer.types.includes(sourceIndexDataType)) {
            return;
        }

        const sourceIndex = getSourceIndex(
            event.dataTransfer.types.find((t) =>
                t.startsWith(sourceIndexDataTypeName),
            ),
        );

        if (sourceIndex !== undefined) {
            setThisDivisionTentativeMove({
                sourceIndex: sourceIndex,
                targetIndex,
            });
            event.preventDefault();
        }
    }

    function getSourceIndex(typeName?: string): number | undefined {
        if (!typeName || !typeName.startsWith(sourceIndexDataTypeName)) {
            return;
        }

        return Number.parseInt(
            typeName.substring(sourceIndexDataTypeName.length),
        );
    }

    async function dragDrop(
        targetIndex: number,
        event: React.DragEvent<HTMLLIElement>,
    ) {
        if (!event.dataTransfer.types.includes(divisionNoDataType)) {
            // different division
            return;
        }

        const sourceIndex = Number.parseInt(
            event.dataTransfer.getData(sourceIndexDataType),
        );

        setThisDivisionTentativeMove(undefined);
        await onUpdate(applyMove(dates, { sourceIndex, targetIndex }));
    }

    return (
        <ul className="list-group mb-3">
            <li className="list-group-item bg-info text-light">
                Weeks
                {any(dates)
                    ? repeat(divisionCount)
                          .filter((index) => index !== divisionNo - 1)
                          .map((index) => {
                              return (
                                  <button
                                      key={index}
                                      className="btn btn-sm btn-primary float-end"
                                      onClick={async () =>
                                          onCopyToDivision(index)
                                      }>
                                      Copy to division {index + 1}
                                  </button>
                              );
                          })
                    : null}
                <small className="d-block">
                    League fixtures (or byes) per-week
                </small>
            </li>
            {applyMove(dates, thisDivisionTentativeMove).map(
                (d: DateTemplateDto, index: number) => (
                    <li
                        className="list-group-item position-relative d-flex flex-row ps-1"
                        key={index}
                        draggable
                        onDragStart={(ev) => startDrag(index, ev)}
                        onDragOver={(ev) => dragOver(index, ev)}
                        onDrop={(ev) => dragDrop(index, ev)}
                        onDragEnd={() =>
                            setThisDivisionTentativeMove(undefined)
                        }>
                        {index ===
                        Math.floor(
                            dates.filter((d) => any(d.fixtures)).length / 2,
                        ) ? (
                            <div className="position-absolute left-negative-100 top-negative-15 bg-warning-subtle px-2">
                                Mid season &rarr;
                            </div>
                        ) : null}
                        <TemplateDate
                            weekNumber={index + 1}
                            date={d}
                            onDelete={() => deleteDate(index)}
                            onUpdate={(update) => updateDate(update, index)}
                            divisionSharedAddresses={divisionSharedAddresses}
                            templateSharedAddresses={templateSharedAddresses}
                            highlight={highlight}
                            setHighlight={setHighlight}
                            deleteDates={deleteDates}
                            divisionNo={divisionNo}
                            getCrossDivisionalNotes={() =>
                                getCrossDivisionalNotes(index)
                            }
                        />
                    </li>
                ),
            )}
            <div className="list-group-item d-flex flex-row">
                <button
                    className="btn btn-sm btn-primary margin-right"
                    onClick={addDate}>
                    ➕ Add a week
                </button>
                <button
                    className="btn btn-sm btn-primary margin-right"
                    onClick={copyDates}>
                    📋 Copy to second half
                </button>
            </div>
        </ul>
    );
}
