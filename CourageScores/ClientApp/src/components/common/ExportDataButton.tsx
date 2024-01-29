import {useApp} from "../../AppContainer";
import {any} from "../../helpers/collections";
import {useDependencies} from "../../IocContainer";
import React, {useState} from "react";
import {LoadingSpinnerSmall} from "./LoadingSpinnerSmall";
import {IExportDataRequestDto} from "../../interfaces/dtos/Data/IExportDataRequestDto";
import {IExportDataResultDto} from "../../interfaces/dtos/Data/IExportDataResultDto";
import {IClientActionResultDto} from "../../interfaces/IClientActionResultDto";

export interface IExportDataButtonProps extends IExportDataRequestDto {
    tables?: { [key: string]: string[] };
}

export function ExportDataButton({tables}: IExportDataButtonProps) {
    const {account, onError} = useApp();
    const {dataApi} = useDependencies();
    const [exporting, setExporting] = useState<boolean>(false);

    if (!account || !account.access || !account.access.exportData) {
        return null;
    }

    if (!any(Object.keys(tables || {}))) {
        return null;
    }

    async function doExport() {
        /* istanbul ignore next */
        if (exporting) {
            /* istanbul ignore next */
            return;
        }

        setExporting(true);
        try {
            const request: IExportDataRequestDto = {
                password: '',
                includeDeletedEntries: false,
                tables,
            };

            const response: IClientActionResultDto<IExportDataResultDto> = await dataApi.export(request);
            if (response.success) {
                window.open(`data:application/zip;base64,${response.result.zip}`);
            } else {
                window.alert('Unable to export data');
            }
        } catch (e) {
            /* istanbul ignore next */
            onError(e);
        } finally {
            setExporting(false);
        }
    }

    return (<button className="btn btn-sm btn-outline-primary" onClick={doExport}>
        {exporting
            ? (<LoadingSpinnerSmall/>)
            : '🛒'}
    </button>);
}