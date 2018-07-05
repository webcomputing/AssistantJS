import { inject, injectable, optional } from "inversify";
import { Filter } from "../../../../src/assistant-source";

@injectable()
export class TestFilterD implements Filter {
  constructor(
    @optional()
    @inject("mocks:filters:call-spy")
    private spy?: (...args: any[]) => void
  ) {}

  public async execute(...args: any[]) {
    if (this.spy) this.spy("TestFilterD", ...args);
    return true;
  }
}
