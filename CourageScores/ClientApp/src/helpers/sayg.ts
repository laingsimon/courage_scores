import {doClick, findButton, TestContext} from "./tests";
import {ENTER_SCORE_BUTTON} from "./constants";

export async function playsFirst(context: TestContext, name: string) {
    await doClick(findButton(context.container, '🎯' + name));
}

export async function keyPad(context: TestContext, keys: string[], dialog?: Element) {
    for (let key of keys) {
        await doClick(findButton(dialog || context.container, key));
    }
}

export async function enterScores(context: TestContext, homeScores: number[], awayScores: number[], awayFirst?: boolean) {
    const scores: number[] = [];
    for (let index = 0; index < Math.max(homeScores.length, awayScores.length); index++) {
        scores.push(awayFirst ? awayScores[index] : homeScores[index]);
        scores.push(awayFirst ? homeScores[index] : awayScores[index]);
    }

    for (let score of scores) {
        if (score || score === 0) {
            const scoreToEnter: string[] = score.toString().split('');
            scoreToEnter.push(ENTER_SCORE_BUTTON);
            await keyPad(context, scoreToEnter);
        }
    }
}

export async function checkoutWith(context: TestContext, noOfDarts: string, dialog?: Element) {
    const buttonContainer = (dialog || context.container).querySelector('div[datatype="gameshot-buttons-score"]');
    await doClick(findButton(buttonContainer, noOfDarts));
}