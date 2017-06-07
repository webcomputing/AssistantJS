import { State } from "../../../../src/components/state-machine/interfaces";
import { injectable } from "inversify";


@injectable()
export class MainState implements State {
  unhandledIntent() {
  }
}