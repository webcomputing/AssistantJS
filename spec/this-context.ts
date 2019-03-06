import { interfaces as inversifyInterfaces } from "inversify";
import { AssistantJSSetup, Constructor, FilterSetup, SpecHelper, SpecHelperOptions, State, StateMachineSetup } from "../src/assistant-source";

export interface ThisContext {
  /** StateMachineSetup instance */
  stateMachineSetup: StateMachineSetup;

  /** AssistantJS setup instance */
  assistantJs: AssistantJSSetup;

  /** FilterSetup instance */
  filterSetup: FilterSetup;

  /** Instance of AssistantJS's spec helper */
  specHelper: SpecHelper;

  /** Reference to inversify instance */
  inversify: inversifyInterfaces.Container;

  /** Default spec options to pass into specHelper.prepareSpec(). You might want to override some options per spec. */
  defaultSpecOptions: Partial<SpecHelperOptions>;

  /** Use this for any untyped test params */
  params: any;

  /**
   * Helper which binds a single state in container. This includes some heurisitic you might want to know about:
   * - The state is bound as singleton instance
   * - metastate and state is both bound to the same contianer (this.inversify). This differs from real states, meta state is bound to root scope,
   * but shouldn't make any difference since childContainers are nearly always disabled in specs
   * @param stateClass Class to bind to state interface
   * @param stateName If given, the state class is bound to this given name
   * @param intents If given, those intents are added as meta states. Else, the intents are derived from the methods, as it is done in state machine setup
   */
  bindSingleState(stateClass: Constructor<State.Required>, stateName?: string, intents?: string[]): void;
}
