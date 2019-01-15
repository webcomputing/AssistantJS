import { inject, injectable, optional } from "inversify";
import { Filter, State } from "../../../../src/assistant-source";

@injectable()
export class TestFilterB implements Filter<undefined> {
  constructor(
    @optional()
    @inject("mocks:filters:call-spy")
    private spy?: (...args: any[]) => void
  ) {}

  public execute(a: State.Required, b: string, c: string) {
    const redirect = {
      state: "FilterBState",
      intent: "filterTestBIntent",
    };

    if (this.spy) this.spy("TestFilterB", ...args);

    return redirect;
  }
}
