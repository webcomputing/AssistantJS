// Execute setup and get runner
import { AssistantJSSetup } from "./setup";

// Import possible main applications
import { GeneratorApplication } from "./components/root/app-generator";
import { ServerApplication } from "./components/root/app-server";

// Import commander
import * as commander from "commander";

// Import node.js filesystem module
import * as fs from "fs";
import { Component } from "inversify-components";

// Get package.json data
const pjson = require("../package.json");

export function cli(argv, resolvedIndex) {
  // Grab local assistant js configuration / setup file
  const grabSetup: () => AssistantJSSetup = () => {
    if (!resolvedIndex) {
      throw new Error("Could not find your local js/index.js. Are you in the correct directory? Did you run 'tsc'?");
    } else {
      if (typeof resolvedIndex.assistantJs === "undefined") {
        throw new Error("Found your local js/index.js, but assistantJs attribute was undefined. Do you export 'assistantJs' in your js/index.js?");
      }

      // Configure and return setup
      const setup: AssistantJSSetup = resolvedIndex.assistantJs;

      // Register internal components if not done already
      if (!setup.allInternalComponentsAreRegistered()) setup.registerInternalComponents();
      setup.autobind();
      return setup;
    }
  };

  /** Copies a file from source to destination by replacing name */
  const copyAndReplace = function(name: string, source: string, destination: string) {
    const contents = fs.readFileSync(source, "utf8");
    fs.writeFileSync(destination, contents.replace(/\{\{__NAME__\}\}/g, name));
  };

  /** Initializes new assistantjs project (prototyped currently) */
  const createProject = function(name: string) {
    // Path to new project
    const projectPath = process.cwd() + "/" + name + "/";
    const scaffoldDir = __dirname + "/../scaffold/";

    // Create directories
    console.log("Creating project directory..");
    fs.mkdirSync(projectPath.substr(0, projectPath.length - 1));

    [
      "app",
      "app/filters",
      "app/states",
      "app/states/mixins",
      "builds",
      "config",
      "config/locales",
      "config/locales/en",
      "spec",
      "spec/helpers",
      "spec/support",
    ].forEach(directory => {
      console.log("Creating " + directory + "..");
      fs.mkdirSync(projectPath + directory);
    });

    // Create copyInstructions: [0] => source directory, [1] => target directory
    let copyInstructions = [
      ["components.ts", "config/components.ts"],
      ["jasmine.json", "spec/support/jasmine.json"],
      ["setup.js", "spec/helpers/setup.js"],
      ["application.ts", "app/states/application.ts"],
      ["main.ts", "app/states/main.ts"],
      ["example-filter.ts", "app/filters/example-filter.ts"],
    ];

    // Merge root files into array
    copyInstructions = copyInstructions.concat(
      [".gitignore", "index.ts", "tsconfig.json", "tslint.json", "README.md", "package.json"].map(rootFile => [rootFile, rootFile])
    );

    // Copy templates!
    copyInstructions.forEach(copyInstruction => {
      console.log("Creating " + copyInstruction[1] + "..");
      copyAndReplace(name, scaffoldDir + copyInstruction[0] + ".scaffold", projectPath + copyInstruction[1]);
    });

    // Create empty files
    ["builds/.keep"].forEach(touchableFile => {
      console.log("Touching " + touchableFile + "..");
      fs.closeSync(fs.openSync(projectPath + touchableFile, "w"));
    });

    // Create empty json files
    ["config/locales/en/translation.json", "config/locales/en/utterances.json"].forEach(filePath => {
      console.log("Creating " + filePath + "..");
      fs.writeFileSync(projectPath + filePath, "{}");
    });
  };

  const listComponents = function() {
    console.log("AVAILABLE COMPONENTS:");
    const assistantJSSetup: AssistantJSSetup = grabSetup();
    const components = assistantJSSetup.container.componentRegistry.registeredComponents as {
      [name: string]: Component<{}>;
    };

    for (const key in components) {
      if (components.hasOwnProperty(key)) {
        console.log(`component: '${key}'`);
      }
    }
    console.log("FINISHED LISTING COMPONENTS");
  };

  const listExtensionPoints = function(componentName?: string) {
    console.log("AVAILABLE EXTENSION POINTS:");
    if (componentName) {
      console.log(`filtering for '${componentName}'`);
    }
    const assistantJSSetup: AssistantJSSetup = grabSetup();
    const components = assistantJSSetup.container.componentRegistry.registeredComponents as {
      [name: string]: Component<{}>;
    };

    for (const outerKey in components) {
      if (components.hasOwnProperty(outerKey) && (componentName ? outerKey === componentName : true)) {
        const component = components[outerKey];
        const symbolArray = component.interfaces as {
          [name: string]: symbol;
        };
        if (Object.keys(symbolArray).length > 0) {
          console.log(`component: '${outerKey}'`);
        }
        for (const innerKey in symbolArray) {
          console.log(`\t--> extension point: '${innerKey}'`);
        }
      }
    }
    console.log("FINISHED LISTING EXTENSION POINTS");
  };

  // Set version to CLI
  commander.version(pjson.version);

  // Register server command
  commander
    .command("server")
    .alias("s")
    .description("Starts the server")
    .option("-p, --port [port]", "Makes the server listen at the given port")
    .action(cmd => {
      grabSetup().run(new ServerApplication(cmd.port ? cmd.port : 3000));
    });

  // Register generate command
  commander
    .command("generate")
    .alias("g")
    .description("Generates all platform configurations")
    .action(() => {
      grabSetup().run(new GeneratorApplication(process.cwd() + "/builds"));
    });

  // Register new command
  commander
    .command("new")
    .description("Creates a new and preconfigured assistantJS application")
    .arguments("[name]")
    .action(name => {
      createProject(name);
      console.log("Project created. Now run npm install and tsc!");
      console.log("Happy hacking :-)!");
      process.exit(0);
    });

  // Register new command
  commander
    .command("list-components")
    .alias("lc")
    .description("Lists all installed components")
    .action(() => {
      listComponents();
      process.exit(0);
    });

  // Register new command
  commander
    .command("list-extension-points")
    .alias("lep")
    .description("Lists available extension points (of component)")
    .arguments("[component]")
    .action(component => {
      listExtensionPoints(component);
      process.exit(0);
    });

  // Display help as default
  if (!argv.slice(2).length) {
    commander.outputHelp();
  }

  // Start commander
  commander.parse(argv);
}
