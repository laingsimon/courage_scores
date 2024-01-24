import {IDivisionDataDto} from "./serverSide/Division/IDivisionDataDto";
import React from "react";

export interface IDivisionData extends IDivisionDataDto {
    onReloadDivision: (preventReloadIfIdsAreTheSame?: boolean) => Promise<IDivisionDataDto | null>;
    setDivisionData: (data: IDivisionDataDto) => Promise<any>;
}