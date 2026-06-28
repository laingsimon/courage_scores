import { useApp } from './AppContainer.tsx';
import { any } from '../../helpers/collections.ts';
import { useDependencies } from './IocContainer.tsx';
import { useState } from 'react';
import { LoadingSpinnerSmall } from './LoadingSpinnerSmall.tsx';
import { ExportDataRequestDto } from '../../interfaces/models/dtos/Data/ExportDataRequestDto.ts';
import { ExportDataResultDto } from '../../interfaces/models/dtos/Data/ExportDataResultDto.ts';
import { IClientActionResultDto } from './IClientActionResultDto.ts';
import { hasAccess } from '../../helpers/conditions.ts';
import { AccessOption } from '../../interfaces/models/dtos/Identity/AccessOption.ts';

export interface IExportDataButtonProps extends ExportDataRequestDto {
    tables?: { [key: string]: string[] };
}

export function ExportDataButton({ tables }: IExportDataButtonProps) {
    const { account, onError } = useApp();
    const { dataApi } = useDependencies();
    const [exporting, setExporting] = useState<boolean>(false);

    if (!hasAccess(account, AccessOption.exportData)) {
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
            const request: ExportDataRequestDto = {
                password: '',
                includeDeletedEntries: false,
                tables,
            };

            const response: IClientActionResultDto<ExportDataResultDto> =
                await dataApi.exportData(request);
            if (response.success) {
                window.open(
                    `data:application/zip;base64,${response.result!.zip}`,
                );
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

    return (
        <button className="btn btn-sm btn-outline-primary" onClick={doExport}>
            {exporting ? <LoadingSpinnerSmall /> : '🛒'}
        </button>
    );
}
