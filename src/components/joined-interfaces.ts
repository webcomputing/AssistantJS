import { Hooks as BaseHooks } from "inversify-components";
import { RootConfiguration } from "./root/public-interfaces";
import { UnifierConfiguration } from "./unifier/public-interfaces";
import { ServicesConfiguration, Session } from "./services/public-interfaces";
import { Transitionable, State } from './state-machine/public-interfaces';
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

/** Common component-independent AssistantJS namespace for hooks */
export namespace Hooks {
    /** Hook executed before the state machine enters an intent */
    export interface BeforeIntentHook {
      /**
       * Function which is executed before state machine enters an intent. Can interrupt the execution of the intent method by returning false.
       * @param {ExecutionMode.Filter} mode execution mode of this hook. In this case always set to ExecutionMode.Filter
       * @param {State.Required} state Instance of current state
       * @param {string} stateName Name of current state
       * @param {string} intentMethod Name of current intent method
       * @param {Transtionable} machine Reference to current state machine
       * @param args all additional arguments passed to the intent method
       * @return {Promise<boolean> | boolean} true / false if state machine shall go on calling the intent method
       */
      (mode: BaseHooks.ExecutionMode.Filter, state: State.Required, stateName: string, intentMethod: string, machine: Transitionable, ...args: any[]): 
        Promise<boolean> | boolean;
    }
  
    /** Hook executed after the state machine finished calling the intent method */
    export interface AfterIntentHook {
      /**
       * Function which is executed after state machine called an intent method.
       * @param {ExecutionMode.ResultSet} mode execution mode of this hook. In this case always set to ExecutionMode.ResultSet
       * @param {State.Required} state Instance of current state
       * @param {string} stateName Name of current state
       * @param {string} intentMethod Name of current intent method
       * @param {Transtionable} machine Reference to current state machine
       * @param args all additional arguments passed to the intent method
       * @return {Promise<BaseHooks.HookResult | boolean> | BaseHooks.HookResult | boolean} The return value of your hook is not used
       */
      (mode: BaseHooks.ExecutionMode.ResultSet, state: State.Required, stateName: string, intentMethod: string, machine: Transitionable, ...args: any[]): 
        Promise<BaseHooks.HookResult | boolean> | BaseHooks.HookResult | boolean
    }

  /** Hook executed before all session data is destroyed */
  export interface BeforeKillSessionHook {
    /**
     * Function which is executed before AssistantJS deletes all session data. Can interrupt the deletion of all session data by returning false.
     * @param {ExecutionMode.Filter} mode execution mode of this hook. In this case always set to ExecutionMode.Filter
     * @param {Session} session Session AssistantJS wants to delete
     * @return {Promise<boolean> | boolean} true / false if session should be deleted
     */
    (mode: BaseHooks.ExecutionMode.Filter, session: Session): Promise<boolean> | boolean;
  }

  /** Hook executed after all session data was destroyed */
  export interface AfterKillSessionHook {
    /**
     * Function which is executed after AssistantJS deleted all session data.
     * @param {ExecutionMode.ResultSet} mode execution mode of this hook. In this case always set to ExecutionMode.ResultSet
     * @param {Session} session Session AssistantJS wants to delete
     * @return {Promise<BaseHooks.HookResult | boolean> | BaseHooks.HookResult | boolean} The return value of your hook is not used
     */
    (mode: BaseHooks.ExecutionMode.ResultSet, session: Session): Promise<BaseHooks.HookResult | boolean> | BaseHooks.HookResult | boolean;
  }
}