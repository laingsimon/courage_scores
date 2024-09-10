import React, {createContext, useContext, useState} from "react";
import {IEditingThrow} from "./IEditingThrow";

const EditableSaygContext = createContext({});

export function useEditableSayg(): IEditableSayg {
    return useContext(EditableSaygContext) as IEditableSayg;
}

export interface IEditableSayg {
    editScore?: IEditingThrow;
    setEditScore(edit: IEditingThrow): Promise<any>;
}

export interface IEditableSaygContainerProps {
    children?: React.ReactNode;
}

export function EditableSaygContainer({children}: IEditableSaygContainerProps) {
    const [editScore, setEditScore] = useState<IEditingThrow>(null);

    const props: IEditableSayg = {
        editScore,
        setEditScore: async (value: IEditingThrow) => setEditScore(value),
    };

    return (<EditableSaygContext.Provider value={props}>
        {children}
    </EditableSaygContext.Provider>);
}