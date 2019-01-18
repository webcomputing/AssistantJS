import { Configuration } from "./private-interfaces";

/** Object describing an AssistantJS session */
export interface Session {
  /**
   * Gets the value of a given session field
   * @param {string} field name of field to get the value of
   * @return {Promise<string | undefined>} value of field or undefined if field is not present
   */
  get(field: string): Promise<string | undefined>;

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

  /**
   * Get a key value list of stored session data which match the given field substring
   * @param {string?} searchName - Search for searchName in all data store keys and returns the data. If searchName is not given or includes an empty string, all session date will be returned.
   */
  getSubset(searchName?: string): Promise<{ [name: string]: string }>;

  /**
   * Get an array of all keys in the redis session store which match to the given field substring
   * @param {string?} searchName - List all session data key identifier which match with the given searchName. If searchName is not given or includes an empty string, all keys will be returned.
   */
  listKeys(searchName?: string): Promise<string[]>;
}

/** Implement this factory if you want to create your own session storage */
export interface SessionFactory {
  /**
   * Returns a session object based on the current extraction result
   * @return {Session}
   */
  getCurrentSession(currentSessionAttributes?: any): Session;
}

/** Returns a function which execute the KillService and remove the current session. */
export type KillSessionPromise = () => Promise<void>;

/** Returns a session object describing the current session */
export type CurrentSessionFactory = () => Session;

/** Configuration object for AssistantJS user for services component */
export interface ServicesConfiguration extends Partial<Configuration.Defaults>, Configuration.Required {}
