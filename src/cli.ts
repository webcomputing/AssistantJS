// Execute setup and get runner
import { AssistantJSSetup } from "./setup";

// Import possible main applications
import { GeneratorApplication } from "./components/root/app-generator";
import { ServerApplication } from "./components/root/app-server";

// Import commander
import * as commander from "commander";

// Get package.json data
const pjson = require("../package.json");

export function cli(argv, resolvedIndex) {
  // Grab local assistant js configuration / setup file
  let grabSetup: () => AssistantJSSetup = () => {
    if (!resolvedIndex) {
      throw new Error("Could not find your local js/index.js. Are you in the correct directory?");
    } else {
      if (typeof resolvedIndex.assistantJs === "undefined")
        throw new Error("Found your local js/index.js, but assistantJs attribute was undefined. Do you export 'assistantJs' in your js/index.js?");

      // Configure and return setup
      let setup: AssistantJSSetup = resolvedIndex.assistantJs;
      setup.registerInternalComponents();
      setup.autobind();
      return setup;
    }
  }
  
  // Set version to CLI
  commander.version(pjson.version);

  // Register server command
  commander
    .command("server")
    .alias("s")
    .description("Starts the server")
    .action(() => grabSetup().run(new ServerApplication()));

  // Register generate command
  commander
    .command("generate")
    .alias("g")
    .description("Generates all platform configurations")
    .action(() => grabSetup().run(new GeneratorApplication(process.cwd() + "/builds")));
  
  // Register new command
  commander
    .command("new")
    .description("Creates a new and preconfigured assistantJS application")
    .arguments('[name]')
    .action(name => {
      console.log("TODO: Build a nice and friendly generator for '"+ name +"' :-)");
    });

  // Display help as default
  if (!argv.slice(2).length) {
    commander.outputHelp();
  }

  // Start commander
  commander.parse(argv);
}