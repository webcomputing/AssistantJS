import { inject, injectable } from "inversify";
import { DestroyableSession } from "../services/interfaces";

/** Destroys redis session after session ended */
@injectable()
export class SessionEndedCallback {
  sessionFactory: () => DestroyableSession;

  constructor(@inject("core:unifier:current-session-factory") sessionFactory) {
    this.sessionFactory = sessionFactory;
  }

  execute() {
    let currentSession = this.sessionFactory();
    return currentSession.delete();
  }
}