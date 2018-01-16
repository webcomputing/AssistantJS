// Export all interfaces
import * as i18nInterfaces from "./components/i18n/interfaces";
import * as rootInterfaces from "./components/root/interfaces";
import * as servicesInterfaces from "./components/services/interfaces";
import * as stateMachineInterfaces from "./components/state-machine/interfaces";
import * as unifierInterfaces from "./components/unifier/interfaces";
export { i18nInterfaces, rootInterfaces, servicesInterfaces, stateMachineInterfaces, unifierInterfaces };

// Export specific instances
export { AssistantJSSetup } from "./setup";
export { ServerApplication } from "./components/root/app-server";
export { GeneratorApplication } from "./components/root/app-generator";
export { GenericRequestHandler } from "./components/root/generic-request-handler";
export { defaultBunyan } from "./components/root/default-bunyan";
export { StateMachineSetup } from "./components/state-machine/setup";
export { BaseState } from "./components/state-machine/base-state";
export { AbstractResponseHandler } from "./components/unifier/abstract-response-handler";
export { featureIsAvailable } from "./components/unifier/feature-checker";
export { BaseResponse } from "./components/unifier/responses/base-response";
export { ResponseFactory } from "./components/unifier/response-factory";
export { cli } from "./cli";

// Export SpecHelper
export { SpecSetup } from "./spec-setup";

// Export injectionNames (less type errors for most important injections)
export { injectionNames } from "./injection-names";

// Export Mixin/Constructor interfaces
export type Constructor<T> = new(...args: any[]) => T;
export interface Mixin<T> { new(...args: any[]): T; };