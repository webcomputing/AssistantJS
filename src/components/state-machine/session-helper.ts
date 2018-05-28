import { inject, injectable } from "inversify";
import { Session } from "../services/public-interfaces";
import { BeforeStateMachine } from "./public-interfaces";

// Name of the session counter in database
export const SESSION_COUNTER = "__session_counter";

/**
 * This class increments the SessionCounter before the statemachine is executed
 */
@injectable()
export class SessionHelper implements BeforeStateMachine {
  /**
   * @param sessionFactory injected to save session data
   */
  constructor(@inject("core:unifier:current-session-factory") private sessionFactory: () => Session) {}

  /**
   * This method is the implementation of extensionpoint
   */
  public async execute(): Promise<void> {
    await this.incrementSessionCounter();
  }

  /**
   * Increases session counter
   */
  private async incrementSessionCounter() {
    // parse the value from database as number, use dynamic sessionFactory() as not everything from the sessionFactory is loaded in constructor
    let count: number = Number(await this.sessionFactory().get(SESSION_COUNTER));

    // increment
    count = count + 1;

    // we have to set the count as String here, use dynamic sessionFactory() as not everything from the sessionFactory is loaded in constructor
    await this.sessionFactory().set(SESSION_COUNTER, String(count));
  }
}
