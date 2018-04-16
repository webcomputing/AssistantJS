import { inject, injectable, optional } from "inversify";
import { State } from "../../../../src/components/state-machine/public-interfaces";
import { ResponseFactory } from "../../../../src/components/unifier/public-interfaces";

import { UnhandledErrorState } from "./unhandled-error";

@injectable()
export class UnhandledErrorWithFallbackState extends UnhandledErrorState {
  public errorFallback(...args: any[]) {
    this.spyIfExistent("errorFallback", ...args);
  }
}
