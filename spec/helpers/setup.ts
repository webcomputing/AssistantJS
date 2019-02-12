// tslint:disable-next-line:no-var-requires
require("reflect-metadata");
import { AssistantJSSetup, FilterSetup, I18nConfiguration, SpecHelper, StateMachineSetup } from "../../src/assistant-source";
import { TestFilterA } from "../support/mocks/filters/test-filter-a";
import { TestFilterB } from "../support/mocks/filters/test-filter-b";
import { TestFilterC } from "../support/mocks/filters/test-filter-c";
import { TestFilterD } from "../support/mocks/filters/test-filter-d";
import { ContextAState } from "../support/mocks/states/context/context-a";
import { ContextBState } from "../support/mocks/states/context/context-b";
import { ContextCState } from "../support/mocks/states/context/context-c";
import { ContextDState } from "../support/mocks/states/context/context-d";
import { FilterAState } from "../support/mocks/states/filter-a";
import { FilterBState } from "../support/mocks/states/filter-b";
import { FilterCState } from "../support/mocks/states/filter-c";
import { IntentCallbackState } from "../support/mocks/states/intent-callbacks";
import { MainState } from "../support/mocks/states/main";
import { PlainState } from "../support/mocks/states/plain";
import { SecondState } from "../support/mocks/states/second";
import { UnhandledErrorState } from "../support/mocks/states/unhandled-error";
import { UnhandledErrorWithFallbackState } from "../support/mocks/states/unhandled-error-with-fallback";
import { ThisContext } from "../this-context";

beforeEach(function(this: ThisContext) {
  this.assistantJs = new AssistantJSSetup();
  this.stateMachineSetup = new StateMachineSetup(this.assistantJs);
  this.filterSetup = new FilterSetup(this.assistantJs);
  this.specHelper = new SpecHelper(this.assistantJs, this.stateMachineSetup);

  // Tell state machine to add some mock states
  this.stateMachineSetup.addState(MainState);
  this.stateMachineSetup.addState(PlainState);
  this.stateMachineSetup.addState(SecondState);
  this.stateMachineSetup.addState(UnhandledErrorState);
  this.stateMachineSetup.addState(UnhandledErrorWithFallbackState);
  this.stateMachineSetup.addState(ContextAState);
  this.stateMachineSetup.addState(ContextBState);
  this.stateMachineSetup.addState(ContextCState);
  this.stateMachineSetup.addState(ContextDState);
  this.stateMachineSetup.addState(FilterAState);
  this.stateMachineSetup.addState(FilterBState);
  this.stateMachineSetup.addState(FilterCState);
  this.stateMachineSetup.addState(IntentCallbackState);
  this.stateMachineSetup.registerStates();

  // Register filters
  this.filterSetup.addFilter(TestFilterA);
  this.filterSetup.addFilter(TestFilterB);
  this.filterSetup.addFilter(TestFilterC);
  this.filterSetup.addFilter(TestFilterD);
  this.filterSetup.registerFilters();

  // Register components
  this.assistantJs.registerInternalComponents();

  // Disable auto-loading of translation files, just put an empty translation in here
  this.assistantJs.configureComponent<I18nConfiguration>("core:i18n", {
    i18nextAdditionalConfiguration: {
      resources: {},
    },
  });

  this.assistantJs = this.specHelper.assistantJs;
  this.inversify = this.assistantJs.container.inversifyInstance;

  // Default spec options
  this.defaultSpecOptions = {};
  this.params = {};
});
