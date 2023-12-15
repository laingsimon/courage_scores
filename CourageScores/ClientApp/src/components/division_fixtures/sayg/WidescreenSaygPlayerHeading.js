export function WidescreenSaygPlayerHeading({ name, score, scoreFirst }) {
    const scoreElement = <h1 className="flex-grow-0 text-center px-3 text-dark">
        {score}
    </h1>;

    return (<div className="d-flex flex-row border-bottom border-dark">
        {scoreFirst ? scoreElement : null}
        <h1 className="flex-grow-1 text-center text-dark">
            {name}
        </h1>
        {scoreFirst ? null : scoreElement}
    </div>);
}