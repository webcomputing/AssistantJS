import { inject, injectable, optional } from "inversify";
import { Filter, State } from "../../../../src/assistant-source";

@injectable()
export class TestFilterA implements Filter {
  constructor(
    @optional()
    @inject("mocks:filters:call-spy")
    private spy?: (...args: any[]) => void
  ) {}

  public execute(a: State.Required, b: string, c: string, d: { a: "string" }) {
    const redirect = {
      state: "FilterAState",
      intent: "filterTestBIntent",
      args: ["testArgs1", "testArgs2"],
    };

    if (this.spy) this.spy("TestFilterA", ...args);

    return redirect;
  }
}
