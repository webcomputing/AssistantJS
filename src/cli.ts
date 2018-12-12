// tslint:disable:no-console
// tslint:disable:no-var-requires

// Execute setup and get runner
import { AssistantJSSetup } from "./setup";

// Import commander
import * as commander from "commander";

// Import ts-node
import Jasmine = require("jasmine");
import JasmineCmd = require("jasmine/lib/command");
import { register } from "ts-node";

// Import node.js filesystem module
import * as fs from "fs";
import { Component } from "inversify-components";
import * as path from "path";
import { AssistantJSApplicationInitializer } from "./components/joined-interfaces";

// Get package.json data
const pjson = require("../package.json");

export function cli(argv, resolvedApplicationInitializer) {
  /** Creates an instance of local application initializer */
  const grabInitializer: () => AssistantJSApplicationInitializer = () => {
    if (!resolvedApplicationInitializer) {
      throw new Error("Could not find your local js/application-initializer.js. Are you in the correct directory? Did you run 'tsc'?");
    } else {
      if (typeof resolvedApplicationInitializer.ApplicationInitializer !== "function") {
        throw new Error(
          "Found your local js/application-initializer.js, but there is no ApplicationInitializer attribute. Do you export an 'ApplicationInitializer' class in your js/application-initializer.js?"
        );
      }

      // Try to create an instance or throw exception
      try {
        return new resolvedApplicationInitializer.ApplicationInitializer();
      } catch (e) {
        // tslint:disable-next-line:no-console
        console.error("Couldn't create an instance of your application initializer. Was calling: new ApplicationInitializer(). Throwing original exception...");
        throw e;
      }
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
      "spec/app",
      "spec/app/states",
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
      ["handler.ts", "config/handler.ts"],
      ["this-context.ts", "spec/support/this-context.ts"],
      ["main.spec.ts", "spec/app/states/main.spec.ts"],
      ["entities.ts", "config/locales/en/entities.ts"],
      ["multi-platform.ts", "spec/support/multi-plattform.ts"],
    ];

    // Merge root files into array
    copyInstructions = copyInstructions.concat(
      [".gitignore", "application-initializer.ts", "tsconfig.json", "tslint.json", "README.md", "package.json"].map(rootFile => [rootFile, rootFile])
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
    const assistantJSSetup: AssistantJSSetup = grabInitializer().createAssistantJsSetup();
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
    const assistantJSSetup: AssistantJSSetup = grabInitializer().createAssistantJsSetup();
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

  const startIntegrationTests = function(specs?: string) {
    const commandArgs: string[] = [];
    const jasmine = new Jasmine({ projectBaseDir: path.resolve() });
    const examplesDir = path.join("node_modules", "jasmine-core", "lib", "jasmine-core", "example", "node_example");
    const command = new JasmineCmd(path.resolve(), examplesDir, console.log);
    const configPath = process.env.JASMINE_CONFIG_PATH || "spec/support/jasmine.json";

    // Function to initialize optional reporters
    const initReporters = (config: any) => {
      if (config.reporters && config.reporters.length > 0) {
        jasmine.env.clearReporters();
        config.reporters.forEach((reporter: { name: string; options: any }) => {
          const parts = reporter.name.split("#");
          const name = parts[0];
          const member = parts[1];
          const reporterClass = member ? require(name)[member] : require(name);
          jasmine.addReporter(new reporterClass(reporter.options));
        });
      }
    };

    // Read and parse jasmine config
    const jasmineConfig = JSON.parse(fs.readFileSync(path.resolve(configPath), "utf8"));
    initReporters(jasmineConfig);

    // Validate specs
    if (specs) {
      commandArgs.push(specs);
    } else {
      commandArgs.push("spec/**/*e2e.spec.ts");
    }

    // Register ts-node
    register();

    // Run Jasmine via ts-node
    command.run(jasmine, commandArgs);
  };

  // Set version to CLI
  commander.version(pjson.version);

  // Register server command
  commander
    .command("server")
    .alias("s")
    .description("Starts the server")
    .option("-p, --port [port]", "Makes the server listen at the given port")
    .action(cmd => grabInitializer().runServer(cmd.port));

  // Register generate command
  commander
    .command("generate")
    .alias("g")
    .description("Generates all platform configurations")
    .action(() => grabInitializer().runGenerator());

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

  commander
    .command("e2e")
    .description("Executes end-to-end specs by running jasmine")
    .arguments("[specs]")
    .action(specs => {
      startIntegrationTests(specs);
    });

  // Display help as default
  if (!argv.slice(2).length) {
    commander.outputHelp();
  }

  // Start commander
  commander.parse(argv);
}
