import { any } from '../../helpers/collections.ts';
import { LoadingSpinnerSmall } from '../common/LoadingSpinnerSmall.tsx';
import { IClientActionResultDto } from '../common/IClientActionResultDto.ts';
import { ISavedProposal } from './CreateSeasonDialog.tsx';

export interface ISavingProposalsProps {
    saveMessage: string;
    proposalsToSave: number;
    savedProposals: ISavedProposal[];
    saving: boolean;
}

export function SavingProposals({
    saveMessage,
    proposalsToSave,
    savedProposals,
    saving,
}: ISavingProposalsProps) {
    function renderError(e: string, i: number) {
        return (
            <li className="text-danger" key={i}>
                {e}
            </li>
        );
    }

    function renderWarning(w: string, i: number) {
        return <li key={i}>{w}</li>;
    }

    function renderMessage(m: string, i: number) {
        return (
            <li className="text-secondary" key={i}>
                {m}
            </li>
        );
    }

    function getPercentageComplete(): string {
        const total: number = savedProposals.length + proposalsToSave;
        const complete: number = savedProposals.length;
        const percentage: number = complete / total;

        return (percentage * 100).toFixed(2);
    }

    function failed(saved: ISavedProposal) {
        return (
            saved.fixture?.success === false || saved.note?.success === false
        );
    }

    function renderErrors<T>(
        index: string,
        result?: IClientActionResultDto<T>,
    ) {
        if (!result) {
            return null;
        }

        return (
            <div key={index}>
                {any(result.errors) ? (
                    <ol>{result.errors!.map(renderError)}</ol>
                ) : null}
                {any(result.warnings) ? (
                    <ol>{result.warnings!.map(renderWarning)}</ol>
                ) : null}
                {any(result.messages) ? (
                    <ol>{result.messages!.map(renderMessage)}</ol>
                ) : null}
            </div>
        );
    }

    return (
        <div>
            <div className="min-height-50">
                {saving && proposalsToSave > 0 ? <LoadingSpinnerSmall /> : null}
                {saveMessage}
            </div>
            <div>
                {savedProposals.length} fixtures of{' '}
                {savedProposals.length + proposalsToSave} saved
            </div>
            <div className="progress">
                <div
                    className="progress-bar progress-bar-striped"
                    style={{ width: getPercentageComplete() + '%' }}
                    role="progressbar"
                    aria-valuenow={75}
                    aria-valuemin={0}
                    aria-valuemax={100}></div>
            </div>
            {any(savedProposals, failed) ? (
                <div className="overflow-auto max-height-250">
                    {savedProposals
                        .filter(failed)
                        .flatMap((r: ISavedProposal, index: number) => [
                            renderErrors(index + 'fixture', r.fixture),
                            renderErrors(index + 'note', r.note),
                        ])}
                </div>
            ) : null}
        </div>
    );
}
