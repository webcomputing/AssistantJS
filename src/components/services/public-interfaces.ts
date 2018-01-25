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
}

/** Object describing a destroyable AssistantJS session */
export interface DestroyableSession extends Session {
  /** Deletes the whole session object */
  delete(): Promise<void>;
}

/** Factory function which returns a session for a given session id */
export interface SessionFactory {
  /**
   * Returns a session object for a given id
   * @param {string} id  Id of the session to return
   * @return {DestroyableSession}
   */
  (id: string): DestroyableSession;
}

/** Factory function which returns the current session (based on extraction result) */
export interface CurrentSessionFactory {
  /**
   * Returns a session object based on the current extraction result
   * @return {DestroyableSession}
   */
  (): DestroyableSession;
}

/** Configuration object for AssistantJS user for services component */
export interface ServicesConfiguration extends Partial<Configuration.Defaults>, Configuration.Required {}