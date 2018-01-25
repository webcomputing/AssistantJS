import { RootConfiguration } from "./root/public-interfaces";
import { UnifierConfiguration } from "./unifier/public-interfaces";
import { ServicesConfiguration } from "./services/public-interfaces";
import { I18nConfiguration } from "./i18n/public-interfaces";

/** Joined set of all possibly AssistantJS configuration options */
export interface AssistantJSConfiguration {
  /** Configuration options of "root" component */
  "core:root"?: RootConfiguration;

  /** Configuration options of "unifier" component */
  "core:unifier"?: UnifierConfiguration;

  /** Configuration options of "services" component */
  "core:services": ServicesConfiguration;

  /** Configuration options of "i18n" component */
  "core:i18n"?: I18nConfiguration;
}