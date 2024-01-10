import React from "react";

/* istanbul ignore next */
export function ConfirmSave({ noOfFixturesToSave, noOfDivisions }) {
    return (<div>
        <p>Press <kbd>Next</kbd> to save all {noOfFixturesToSave} fixtures
            across {noOfDivisions} divisions</p>
        <p>You must keep your device on and connected to the internet during the process of saving the
            fixtures</p>
    </div>);
}