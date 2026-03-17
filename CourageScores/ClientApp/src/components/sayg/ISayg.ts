import { UpdateRecordedScoreAsYouGoDto } from '../../interfaces/models/dtos/Game/Sayg/UpdateRecordedScoreAsYouGoDto';
import { ScoreAsYouGoDto } from '../../interfaces/models/dtos/Game/Sayg/ScoreAsYouGoDto';
import { UntypedPromise } from '../../interfaces/UntypedPromise';

export interface ISayg {
    sayg: UpdateRecordedScoreAsYouGoDto;
    setSayg(
        newData: UpdateRecordedScoreAsYouGoDto,
    ): Promise<UpdateRecordedScoreAsYouGoDto>;
    saveDataAndGetId(useData?: ScoreAsYouGoDto): Promise<string | undefined>;
    changeNumberOfLegs?(): UntypedPromise;
}
