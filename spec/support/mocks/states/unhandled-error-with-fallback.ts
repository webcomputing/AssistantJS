import { injectable } from "inversify";

import { UnhandledErrorState } from "./unhandled-error";

@injectable()
export class UnhandledErrorWithFallbackState extends UnhandledErrorState {
  public errorFallback(...args: any[]) {
    this.spyIfExistent("errorFallback", ...args);
  }
}
