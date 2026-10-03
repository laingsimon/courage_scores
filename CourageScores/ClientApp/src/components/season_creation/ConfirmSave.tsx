export interface IConfirmSaveProps {
    noOfFixturesToSave: number;
    noOfNotesToSave: number;
    noOfDivisions: number;
}

/* istanbul ignore next */
export function ConfirmSave({
    noOfFixturesToSave,
    noOfNotesToSave,
    noOfDivisions,
}: IConfirmSaveProps) {
    return (
        <div>
            <p>
                Press <kbd>Next</kbd> to save all {noOfFixturesToSave} fixtures
                & {noOfNotesToSave} notes across {noOfDivisions} divisions
            </p>
            <p>
                You must keep your device on and connected to the internet
                during the process of saving the fixtures
            </p>
        </div>
    );
}
