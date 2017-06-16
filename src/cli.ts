// Execute setup and get runner
import { AssistantJSSetup } from "./setup";

// Import possible main applications
import { GeneratorApplication } from "./components/root/app-generator";
import { ServerApplication } from "./components/root/app-server";

// Import commander
import * as commander from "commander";

// Get package.json data
const pjson = require("./package.json");

export function cli(argv) {

  // Create assistant js setup file
  let setup = new AssistantJSSetup();

  // Set version to CLI
  commander.version(pjson.version);

  // Register server command
  commander
    .command("server")
    .alias("s")
    .description("Starts the server")
    .action(() => setup.run(new ServerApplication()));

  // Register builder command
  commander
    .command("build")
    .alias("b")
    .description("Builds all platform configurations")
    .action(() => setup.run(new GeneratorApplication(process.cwd())));

  // Start commander
  commander.parse(argv);
}