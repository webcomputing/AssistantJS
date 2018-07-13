import { inject, injectable, optional } from "inversify";
import { BasicHandler } from "../../../../src/assistant-source";
import { TranslateHelper } from "../../../../src/components/i18n/public-interfaces";
import { Logger } from "../../../../src/components/root/public-interfaces";
import { BaseState } from "../../../../src/components/state-machine/base-state";
import { filter } from "../../../../src/components/state-machine/filter-decorator";
import { State } from "../../../../src/components/state-machine/public-interfaces";
import { injectionNames } from "../../../../src/injection-names";
import { TestFilterA } from "../filters/test-filter-a";
import { TestFilterB } from "../filters/test-filter-b";
import { TestFilterD } from "../filters/test-filter-d";

@injectable()
export class FilterAState extends BaseState implements State.Required {
  public extraction: any;

  constructor(
    @inject(injectionNames.current.responseHandler) responseHandler: BasicHandler<any>,
    @inject("core:unifier:current-extraction") extraction: any,
    @inject("core:i18n:current-translate-helper") translateHelper: TranslateHelper,
    @inject("core:root:current-logger") logger: Logger
  ) {
    super(responseHandler, translateHelper, extraction, logger);
    this.extraction = extraction;
  }

  @filter(TestFilterA)
  public filterTestAIntent(...args: any[]) {
    this.endSessionWith(this.t("filter.stateA.intentA"));
  }

  public filterTestBIntent() {
    this.endSessionWith(this.t("filter.stateA.intentB"));
  }

  @filter(TestFilterD, TestFilterA)
  public filterTestCIntent() {
    this.endSessionWith(this.t("filter.stateA.intentC"));
  }

  @filter(TestFilterA, TestFilterB)
  public filterTestDIntent() {
    this.endSessionWith(this.t("filter.stateA.intentD"));
  }
}
