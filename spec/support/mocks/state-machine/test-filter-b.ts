import { Filter } from "../../../../src/assistant-source";

export class TestFilterB implements Filter {
  public execute() {
    const redirect = {
      state: "FilterBState",
      intent: "filterTestBIntent",
      args: undefined,
    };

    return redirect;
  }
}
