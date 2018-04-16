import { Hooks as BaseHooks } from "inversify-components";
import { I18nConfiguration } from "./i18n/public-interfaces";
import { RootConfiguration } from "./root/public-interfaces";
import { ServicesConfiguration, Session } from "./services/public-interfaces";
import { State, Transitionable } from "./state-machine/public-interfaces";
import { UnifierConfiguration } from "./unifier/public-interfaces";

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

/** Common component-independent AssistantJS namespace for hooks */
export namespace Hooks {
  /** Hook executed before the state machine enters an intent */
  export type BeforeIntentHook = (
    mode: BaseHooks.ExecutionMode.Filter,
    state: State.Required,
    stateName: string,
    intentMethod: string,
    machine: Transitionable,
    ...args: any[]
  ) => Promise<boolean> | boolean;

  /** Hook executed after the state machine finished calling the intent method */
  export type AfterIntentHook = (
    mode: BaseHooks.ExecutionMode.ResultSet,
    state: State.Required,
    stateName: string,
    intentMethod: string,
    machine: Transitionable,
    ...args: any[]
  ) => Promise<BaseHooks.HookResult | boolean> | BaseHooks.HookResult | boolean;

  /** Hook executed before all session data is destroyed */
  export type BeforeKillSessionHook = (mode: BaseHooks.ExecutionMode.Filter, session: Session) => Promise<boolean> | boolean;

  /** Hook executed after all session data was destroyed */
  export type AfterKillSessionHook = (
    mode: BaseHooks.ExecutionMode.ResultSet,
    session: Session
  ) => Promise<BaseHooks.HookResult | boolean> | BaseHooks.HookResult | boolean;
}
