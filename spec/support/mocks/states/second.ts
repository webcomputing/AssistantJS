import { State } from "../../../../src/components/state-machine/interfaces";
import { injectable } from "inversify";


@injectable()
export class SecondState implements State {
  unhandledIntent() {
  }

  testIntent() {

  }

  noGenericIntent() {
    
  }
}