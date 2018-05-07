import { injectable } from "inversify";
import { Filter } from "../../../../src/assistant-source";

@injectable()
export class TestFilterA implements Filter.Required {
  public async execute() {
    const redirect = {
      state: "FilterAState",
      intent: "filterTestBIntent",
      args: undefined,
    };

    return redirect;
  }
}