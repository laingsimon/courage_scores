import { IComponent, TestContext } from './tests';
import { ENTER_SCORE_BUTTON } from './constants';
import { LegThrowDto } from '../interfaces/models/dtos/Game/Sayg/LegThrowDto';

function scopeFromOptionalRoot(
    context: TestContext,
    root?: IComponent,
): IComponent {
    if (root === undefined) {
        return context;
    }
    return root;
}

export async function playsFirst(context: TestContext, name: string) {
    await context.button('🎯' + name).click();
}

export async function keyPad(
    context: TestContext,
    keys: string[],
    root?: IComponent,
) {
    const scope = scopeFromOptionalRoot(context, root);
    for (const key of keys) {
        await scope.button(key).click();
    }
}

export async function enterScores(
    context: TestContext,
    homeScores: number[],
    awayScores: number[],
    awayFirst?: boolean,
) {
    const scores: number[] = [];
    for (
        let index = 0;
        index < Math.max(homeScores.length, awayScores.length);
        index++
    ) {
        scores.push(awayFirst ? awayScores[index] : homeScores[index]);
        scores.push(awayFirst ? homeScores[index] : awayScores[index]);
    }

    for (const score of scores) {
        if (score || score === 0) {
            const scoreToEnter: string[] = score.toString().split('');
            scoreToEnter.push(ENTER_SCORE_BUTTON);
            await keyPad(context, scoreToEnter);
        }
    }
}

export async function checkoutWith(
    context: TestContext,
    noOfDarts: string,
    root?: IComponent,
) {
    const scope = scopeFromOptionalRoot(context, root);
    await scope
        .required('div[datatype="gameshot-buttons-score"]')
        .button(noOfDarts)
        .click();
}

export function getScoreFromThrows(
    startingScore: number,
    throws?: LegThrowDto[],
): number {
    return (throws || []).reduce(
        (total: number, thr: LegThrowDto) =>
            total + (thr.score || 0) > startingScore
                ? total /* bust */
                : total + (thr.score || 0),
        0,
    );
}

export function assertWaitingForScoreFor(context: TestContext, side: string) {
    expect(context.required('div[datatype="current-player"]').text()).toContain(
        side,
    );
}

export function previousScoreRows(context: TestContext): IComponent[] {
    return context.all('div[datatype="previous-scores"] > div');
}

export function scoreCardDivTexts(ps: IComponent): string[] {
    return ps.all('div').map((d) => d.text());
}

export function homeScoreFromRow(ps: IComponent): string {
    return ps.required('div:nth-child(1)').text();
}

export function homeRemainingFromRow(ps: IComponent): string {
    return ps.required('div:nth-child(2)').text();
}

export function noOfDartsFromRow(ps: IComponent): string {
    return ps.required('div:nth-child(3)').text();
}

export function awayScoreFromRow(ps: IComponent): string {
    return ps.required('div:nth-child(4)').text();
}

export function awayRemainingFromRow(ps: IComponent): string {
    return ps.required('div:nth-child(5)').text();
}
