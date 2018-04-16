import { createLogger } from "bunyan";
import { Logger } from "./public-interfaces";

export const defaultBunyan: Logger = createLogger({ name: "assistantjs-app" });
