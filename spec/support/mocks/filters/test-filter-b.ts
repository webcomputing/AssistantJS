import { inject, injectable, optional } from "inversify";
import { Filter } from "../../../../src/assistant-source";

@injectable()
export class TestFilterB implements Filter {
  constructor(
    @optional()
    @inject("mocks:filters:call-spy")
    private spy?: (...args: any[]) => void
  ) {}

  public execute(...args: any[]) {
    const redirect = {
      state: "FilterBState",
      intent: "filterTestBIntent",
    };

    if (this.spy) this.spy("TestFilterB", ...args);

    return redirect;
  }
}
