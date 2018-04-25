import { Filter } from "../../../../src/assistant-source";

export class TestFilterA implements Filter {
  public execute() {
    const redirect = {
      state: "FilterAState",
      intent: "filterTestBIntent",
      args: undefined,
    };

    return redirect;
  }
}
