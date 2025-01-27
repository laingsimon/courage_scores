import React, {createContext, useContext, useState} from "react";
import {IEditingThrow} from "./IEditingThrow";
import {UntypedPromise} from "../../interfaces/UntypedPromise";

const EditableSaygContext = createContext({});

export function useEditableSayg(): IEditableSayg {
    return useContext(EditableSaygContext) as IEditableSayg;
}

export interface IEditableSayg {
    editScore?: IEditingThrow;
    setEditScore(edit?: IEditingThrow): UntypedPromise;
}

export interface IEditableSaygContainerProps {
    children?: React.ReactNode;
}

export function EditableSaygContainer({children}: IEditableSaygContainerProps) {
    const [editScore, setEditScore] = useState<IEditingThrow | undefined>(undefined);

    const props: IEditableSayg = {
        editScore,
        setEditScore: async (value: IEditingThrow) => setEditScore(value),
    };

    return (<EditableSaygContext.Provider value={props}>
        {children}
    </EditableSaygContext.Provider>);
}