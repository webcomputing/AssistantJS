import { OptionalExtractions, OptionalHandlerFeatures } from "../../../assistant-source";
import { Session } from "../public-interfaces";

/**
 * Uses the platform's session features to store session data.
 */

export class PlatformSession implements Session {
  constructor(private extraction: OptionalExtractions.SessionData, private handler: OptionalHandlerFeatures.SessionData) {}

  public get(field: string): Promise<string | undefined> {
    return Promise.resolve(this.getLatestSessionData()[field]);
  }

  public set(field: string, value: string): Promise<void> {
    const existing = this.getLatestSessionData();
    existing[field] = value;
    return Promise.resolve(this.storeSessionData(existing));
  }

  public delete(field: string): Promise<void> {
    const existing = this.getLatestSessionData();
    delete existing[field];
    return Promise.resolve(this.storeSessionData(existing));
  }

  public deleteAllFields(): Promise<void> {
    return Promise.resolve(this.storeSessionData({}));
  }

  public exists(): Promise<boolean> {
    return Promise.resolve(Object.keys(this.getLatestSessionData()).length > 0);
  }

  /**
   * Returns latest session data. Gets them from extraction or checks if nothing is already stored in handler.
   * We have to priorize the handler's data to get eventually changed data
   */
  protected getLatestSessionData() {
    if (this.handler.sessionData === null) {
      // Current handler does not have any session data yet. So this is the first call. Let's get session data from extraction
      // and update handler if there is anything in extraction
      if (this.extraction.sessionData === null) {
        // There is nothing in extraction, too. Let's return {} and don't update handler yet.
        return {};
      }

      // There is sth in extraction's sessionData. We have to return it decoded
      return this.decode(this.extraction.sessionData);
    }

    // Session data is already stored in handler. Possibly we already had some session objects in this request manipulating the session data. So let's
    // use the handler's dataset, not the extraction's dataset.
    return this.decode(this.handler.sessionData);
  }

  /** Stores current session data -> sets them to handler */
  protected storeSessionData(newSessionData: { [key: string]: string }) {
    // We cannot send this to null if there are no elements left, because this will always fall back to extraction (if there is data in extraction.)
    this.handler.sessionData = this.encode(newSessionData);
  }

  /** Decodes stored session data */
  protected decode(encodedSessionData: string) {
    return JSON.parse(encodedSessionData);
  }

  /** Encodes stored session data */
  protected encode(encodedSessionData: object) {
    return JSON.stringify(encodedSessionData);
  }
}
