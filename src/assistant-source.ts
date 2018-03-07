// [DEPRECATED] Export all interfaces - the old way using rootInterfaces, stateMachineInterfaces, ...
import * as i18nInterfaces from "./components/i18n/public-interfaces";
import * as rootInterfaces from "./components/root/public-interfaces";
import * as servicesInterfaces from "./components/services/public-interfaces";
import * as stateMachineInterfaces from "./components/state-machine/public-interfaces";
import * as unifierInterfaces from "./components/unifier/public-interfaces";
/** [DEPRECATED] All interfaces are now available in main scope */
export { i18nInterfaces, rootInterfaces, servicesInterfaces, stateMachineInterfaces, unifierInterfaces };

// Export all public interfaces
export * from "./components/i18n/public-interfaces";
export * from "./components/root/public-interfaces";
export * from "./components/services/public-interfaces";
export * from "./components/state-machine/public-interfaces";
export * from "./components/unifier/public-interfaces";

// Export all joined interfaces
export * from "./components/joined-interfaces";

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
export { ResponseFactory as ResponseFactoryClass } from "./components/unifier/response-factory";
export { cli } from "./cli";

// Export SpecHelper
export { SpecSetup } from "./spec-setup";

// Export injectionNames (less type errors for most important injections)
export { injectionNames } from "./injection-names";

// Export Mixin/Constructor interfaces
export type Constructor<T> = new(...args: any[]) => T;
export interface Mixin<T> { new(...args: any[]): T; };