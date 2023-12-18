export function WidescreenSaygRecentThrow({ score, bust, throwNumber }) {
    const fontSizes = [
        'fs-1 opacity-100',
        'fs-2 opacity-75',
        'fs-3 opacity-50',
        'fs-4 opacity-50',
        'fs-5 opacity-25',
    ];
    const fontSizeToUse = fontSizes[Math.min(throwNumber - 1, fontSizes.length - 1)];

    let className = 'text-center px-1 ';
    className += score >= 100 ? 'text-danger ' : '';
    className += score === 180 ? 'fw-bold ' : '';
    className += bust ? 'text-decoration-line-through ' : '';
    className += fontSizeToUse;

    return (<div className={className}>{score}</div>);
}