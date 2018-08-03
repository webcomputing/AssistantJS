const gulp = require("gulp"),
  tsLint = require("tslint"),
  gulpLint = require("gulp-tslint"),
  tsc = require("gulp-typescript"),
  clean = require("gulp-clean"),
  shell = require("gulp-shell"),
  watch = require("gulp-watch"),
  sourcemaps = require("gulp-sourcemaps");

/** Folder containing the sources */
const SOURCES = ["src/**/*.ts"];

/** Folder containing the specs */
const SPECS = ["spec/**/*.ts"];

/**
 * For your specs-watcher: This function is called every time a file changed which doesn't end with '.spec.ts'.
 * The function's task is to return the fitting specs path of this file. If you have a solid structure, this is done
 * by applying '/spec/' to the file.
 * @param {vinyl} changedFile Vinyl object of changed file (see https://github.com/gulpjs/vinyl)
 * @return {string|undefined} Path to the specs file to execute or undefined if your watcher shouldn't do anything.
 */
function findSpecsFile(changedFile) {
  return changedFile.path.replace(__dirname, `${__dirname}/spec`).replace(".ts", ".spec.ts");
}

/**
 * Execute jasmine tests for given file name / path
 * @param {string} file Path to file
 * @return {void}
 */
function runJasmine(file) {
  // When sources are built
  shell.task(`jasmine-ts ${file}`, { verbose: true, quiet: false })();
}

/** Default task: Cleans build files, executes linter, builds project. Is executed automatically if using "gulp". Does not emit sourcefiles, good for deployment. */
gulp.task("default", ["build-sources", "build-dts", "test-coverage"]);

gulp.task("build", ["build-sources", "build-dts"]);

/** Cleans project: Removes build folders ("lib", "dts", ".nyc_output") */
gulp.task("clean", function() {
  return gulp.src(["js", "lib", "dts", ".nyc_output", "coverage"], { read: false }).pipe(clean());
});

/** Runs all tests. We dont need to emit sourcemaps here since jasmine-ts handles this for us. */
gulp.task("test", ["build-sources"], shell.task('jasmine-ts "**/*.spec.ts"'));
gulp.task("test-coverage", ["build-sources"], shell.task('nyc -e .ts -x "*.spec.ts" jasmine-ts "**/*.spec.ts"'));

/** Watches file changes in source or spec files and executes specs automatically */
gulp.task("specs-watcher", ["build-sources"], function() {
  return watch(SOURCES.concat(SPECS), { events: ["add", "change"] }, function(vinyl, event) {
    if (!vinyl.isDirectory()) {
      if (vinyl.basename.endsWith(".spec.ts")) {
        // We are dealing with a spec file here, so call jasmine!
        runJasmine(vinyl.path);
      } else {
        // Try to find out specs file
        const specFilePath = findSpecsFile(vinyl);
        if (typeof specFilePath === "string") {
          // Run Jasmine after rebuilding sources, but only build needed file
          shell.task(`BUILD_FILE=${vinyl.path} gulp overwrite-single`)(() => {
            runJasmine(specFilePath);
          });
        }
      }
    }
  });
});

/** Linter task: Opens local tslint.json and runs linter usinggul this configuration */
gulp.task("lint", function() {
  const program = tsLint.Linter.createProgram("./tsconfig.json");
  const config = { formatter: "verbose", program };

  return gulp
    .src(SOURCES.concat(SPECS))
    .pipe(gulpLint(config))
    .pipe(gulpLint.report({ emitError: process.env.CI ? true : false }));
});

const tsLibProject = tsc.createProject("tsconfig.json", { typescript: require("typescript") });

/** Build sources task: Opens local tsconfig.json and builds project into "js" or "lib". Emits source maps */
gulp.task("build-sources-and-maps", ["clean"], function() {
  return gulp
    .src(SOURCES)
    .pipe(sourcemaps.init())
    .pipe(tsLibProject())
    .on("error", function(err) {
      process.exit(1);
    })
    .js.pipe(sourcemaps.write(".", { includeContent: false, sourceRoot: "./" }))
    .pipe(gulp.dest(file => file.base));
});

/** Same as build-sources, but does not emit source maps. You need source maps for debugger. */
gulp.task("build-sources", ["clean"], function() {
  return gulp
    .src(SOURCES)
    .pipe(tsLibProject())
    .on("error", function(err) {
      process.exit(1);
    })
    .js.pipe(gulp.dest(file => file.base));
});

/**
 * Same as build-sources, but for a single file and does not emit source maps. You need source maps for debugger.
 * Won't clean. Give file to build via env variable "BUILD_FILE".
 */
gulp.task("overwrite-single", function() {
  return gulp
    .src([process.env["BUILD_FILE"]])
    .pipe(tsLibProject())
    .on("error", function(err) {
      process.exit(1);
    })
    .js.pipe(gulp.dest(file => file.base));
});

/** Build dts task: Opens local tsconfig.json and builds dts files into "dts". Only needed if you are building a library. */
const tsDtsProject = tsc.createProject("tsconfig.json", {
  declaration: true,
  noResolve: false,
  typescript: require("typescript"),
});

gulp.task("build-dts", ["clean"], function() {
  return gulp
    .src(SOURCES)
    .pipe(tsDtsProject())
    .on("error", function(err) {
      process.exit(1);
    })
    .dts.pipe(gulp.dest("dts"));
});
