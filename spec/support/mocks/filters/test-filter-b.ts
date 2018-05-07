import { injectable } from "inversify";
import { Filter } from "../../../../src/assistant-source";

@injectable()
export class TestFilterB implements Filter.Required {
  public async execute() {
    const redirect = {
      state: "FilterBState",
      intent: "filterTestBIntent",
      args: undefined,
    };

    return redirect;
  }
}
