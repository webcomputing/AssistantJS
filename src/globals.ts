import { ContainerImpl } from "ioc-container";
import { debug } from "debug";

// Export configured debug logger
export const log = debug("assistant.js");

// Export container instance
export const container = new ContainerImpl();