import { Configuration } from "./private-interfaces";

/** Object describing an AssistantJS session */
export interface Session {
  /** Id of session */
  id: string;

  /**
   * Gets the value of a given session field
   * @param {string} field name of field to get the value of
   * @return {Promise<string>} value of field
   */
  get(field: string): Promise<string>;

  /**
   * Sets the value of a given session field
   * @param {string} field name of field to set the value
   * @param {string} value value to set
   * @return {Promise<void>}
   */
  set(field: string, value: string): Promise<void>;

  /**
   * Deletes only one specific field of this session
   * @param {string} field name of the field to delete the value of
   * @return {Promise<void>}
   */
  delete(field: string): Promise<void>;

  /** Deletes the whole session object */
  deleteAllFields(): Promise<void>;

  /** Checks if any fields to this session are set */
  exists(): Promise<boolean>;
}

export interface CurrentSessionFactory {
  /**
   * Returns a session object based on the current extraction result
   * @return {Session}
   */
  getCurrentSession(currentSessionAttributes?: any): Session;
}

/** Configuration object for AssistantJS user for services component */
export interface ServicesConfiguration extends Partial<Configuration.Defaults>, Configuration.Required {}
