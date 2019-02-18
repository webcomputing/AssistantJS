import { BaseState } from "assistant-source";
import { injectable, unmanaged } from "inversify";
import { MergedSetupSet, MergedAnswerTypes, MergedHandler } from "../../config/handler";

@injectable()
export class ApplicationState extends BaseState<MergedAnswerTypes, MergedHandler> {
  constructor(@unmanaged() setupSet: MergedSetupSet) {
    super(setupSet);
  }
}
