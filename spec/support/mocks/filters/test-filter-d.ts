import { injectable } from "inversify";
import { Filter } from "../../../../src/assistant-source";

@injectable()
export class TestFilterD implements Filter {
  public async execute() {
    return true;
  }
}
