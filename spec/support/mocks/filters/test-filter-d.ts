import { inject, injectable } from "inversify";
import { Filter, injectionNames } from "../../../../src/assistant-source";

@injectable()
export class TestFilterD implements Filter.Required {
  public async execute() {
    return true;
  }
}
