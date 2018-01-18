import { createLogger } from "bunyan"
import { Logger } from "./interfaces";

export const defaultBunyan: Logger = createLogger({ name: "assistantjs-app" });