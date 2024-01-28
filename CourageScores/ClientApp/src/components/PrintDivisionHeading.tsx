import React from "react";
import {useDivisionData} from "./DivisionDataContainer";

export interface IPrintDivisionHeadingProps {
    hideDivision?: boolean;
}

export function PrintDivisionHeading({hideDivision}: IPrintDivisionHeadingProps) {
    const {season, name} = useDivisionData();

    if (!season) {
        return null;
    }

    if (!name && !hideDivision) {
        return null;
    }

    return <div datatype="print-division-heading" className="d-screen-none float-end">
        <strong className="mx-2 d-inline-block fs-3">{hideDivision ? '' : `${name}, `}{season.name}</strong>
    </div>;
}