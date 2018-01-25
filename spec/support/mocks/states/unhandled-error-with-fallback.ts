import { State } from "../../../../src/components/state-machine/public-interfaces";
import { ResponseFactory } from "../../../../src/components/unifier/public-interfaces";
import { injectable, inject, optional } from "inversify";

import { UnhandledErrorState } from "./unhandled-error";

@injectable()
export class UnhandledErrorWithFallbackState extends UnhandledErrorState {
  errorFallback(...args: any[]) {
    this.spyIfExistent("errorFallback", ...args);
  }
}