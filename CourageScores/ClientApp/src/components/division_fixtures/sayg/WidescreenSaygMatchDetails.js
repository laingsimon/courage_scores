export function WidescreenSaygMatchDetails({ legs, numberOfLegs }) {
    const orderedLegKeys = Object.keys(legs).sort((keyA, keyB) => Number.parseInt(keyA) - Number.parseInt(keyB));
    const lastLegKey = orderedLegKeys[orderedLegKeys.length - 1];
    const lastLeg = legs[lastLegKey];

    return (<div datatype="WidescreenSaygMatchDetails" className="d-flex flex-row justify-content-around">
        <span>Best of {numberOfLegs}</span>
        <span>from {lastLeg.startingScore}</span>
        <span>Leg {Number.parseInt(lastLegKey) + 1}</span>
    </div>)
}