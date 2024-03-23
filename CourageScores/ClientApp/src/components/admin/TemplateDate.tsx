import React, {useState} from "react";
import {any} from "../../helpers/collections";
import {valueChanged} from "../../helpers/events";
import {DateTemplateDto} from "../../interfaces/models/dtos/Season/Creation/DateTemplateDto";
import {FixtureTemplateDto} from "../../interfaces/models/dtos/Season/Creation/FixtureTemplateDto";

export interface ITemplateDateProps {
    date: DateTemplateDto;
    onUpdate(newDate: DateTemplateDto): Promise<any>;
    onDelete(): Promise<any>;
    divisionSharedAddresses: string[];
    templateSharedAddresses: string[];
    moveEarlier?(): Promise<any>;
    moveLater?(): Promise<any>;
}

export function TemplateDate({ date, onUpdate, onDelete, divisionSharedAddresses, templateSharedAddresses, moveEarlier, moveLater }: ITemplateDateProps) {
    const [ newFixture, setNewFixture ] = useState<FixtureTemplateDto>({
        home: null,
        away: null,
    });

    async function updateFixtures(update: FixtureTemplateDto[]) {
        const newDate: DateTemplateDto = Object.assign({}, date);
        newDate.fixtures = update;
        await onUpdate(newDate);
    }

    async function deleteFixture(index: number) {
        await updateFixtures(date.fixtures.filter((_: FixtureTemplateDto, i: number) => i !== index));
    }

    async function addFixture() {
        if (!newFixture.home) {
            window.alert('Enter at least a home team');
            return;
        }

        await updateFixtures(date.fixtures.concat([ newFixture ]));
        setNewFixture({
            home: null,
            away: null,
        });
    }

    async function onKeyUp(event: React.KeyboardEvent) {
        if (event.key === 'Enter') {
            await addFixture();
        }
    }

    function sharedAddressClassName(address: string): string {
        if (any(divisionSharedAddresses, a => a === address)) {
            return ' bg-secondary text-light';
        }

        if (any(templateSharedAddresses, a => a === address)) {
            return ' bg-warning text-light';
        }

        return '';
    }

    return (<div className="position-relative">
        {date.fixtures.map((f, index: number) => (<button
            key={index}
            onClick={() => deleteFixture(index)}
            className={`btn btn-sm margin-right px-1 badge ${f.away ? 'btn-info' : 'btn-outline-info text-dark'}`}>
            <span className={`px-1 ${sharedAddressClassName(f.home)}`}>{f.home}</span>
            {f.away ? (<span> - </span>) : null}
            {f.away ? (<span className="px-1">{f.away}</span>) : null} &times;</button>))}
        <span className="margin-right badge bg-info ps-1">
            <input className="width-20 border-0 outline-0"
                   name="home"
                   onKeyUp={onKeyUp}
                   value={newFixture.home || ''}
                   onChange={valueChanged(newFixture, setNewFixture, '')} />
            <span>-</span>
            <input className="width-20 border-0 outline-0"
                   name="away"
                   onKeyUp={onKeyUp}
                   value={newFixture.away || ''}
                   onChange={valueChanged(newFixture, setNewFixture, '')} />
            <button className="ms-1 bg-info border-0 px-0" onClick={addFixture}>➕</button>
        </span>
        <button className="btn btn-sm btn-outline-danger float-end p-1" onClick={onDelete}>🗑️</button>
        <button className="btn btn-sm btn-outline-info float-end p-1" disabled={!moveEarlier} onClick={moveEarlier}>⬆</button>
        <button className="btn btn-sm btn-outline-info float-end p-1" disabled={!moveLater} onClick={moveLater}>⬇</button>
    </div>);
}