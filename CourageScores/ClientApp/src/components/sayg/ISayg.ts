import { UpdateRecordedScoreAsYouGoDto } from '../../interfaces/models/dtos/Game/Sayg/UpdateRecordedScoreAsYouGoDto.ts';
import { ScoreAsYouGoDto } from '../../interfaces/models/dtos/Game/Sayg/ScoreAsYouGoDto.ts';
import { UntypedPromise } from '../../interfaces/UntypedPromise.ts';

export interface ISayg {
    sayg: UpdateRecordedScoreAsYouGoDto;
    setSayg(
        newData: UpdateRecordedScoreAsYouGoDto,
    ): Promise<UpdateRecordedScoreAsYouGoDto>;
    saveDataAndGetId(useData?: ScoreAsYouGoDto): Promise<string | undefined>;
    changeNumberOfLegs?(): UntypedPromise;
}
