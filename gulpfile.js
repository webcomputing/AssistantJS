var gulp        = require("gulp"),
    tslint      = require("gulp-tslint"),
    tsc         = require("gulp-typescript"),
    sourcemaps  = require("gulp-sourcemaps");

//******************************************************************************
//* LINT
//******************************************************************************
gulp.task("lint", function() {

    var config =  { formatter: "verbose", emitError: (process.env.CI) ? true : false };

    return gulp.src([
        "src/**/**.ts",
        "spec/**/**.spec.ts"
    ])
    .pipe(tslint(config))
    .pipe(tslint.report());

});

//******************************************************************************
//* BUILD
//******************************************************************************
var tsLibProject = tsc.createProject("tsconfig.json", { module : "commonjs", typescript: require("typescript") });

gulp.task('default', ['build-lib', 'build-dts']);

gulp.task("build-lib", function() {
    return gulp.src([
        "src/**/*.ts"
    ])
    .pipe(tsLibProject())
    .on("error", function (err) {
        process.exit(1);
    })
    .js.pipe(gulp.dest("lib/"));
});

var tsDtsProject = tsc.createProject("tsconfig.json", {
    declaration: true,
    noResolve: false,
    typescript: require("typescript")
});

gulp.task("build-dts", function() {
    return gulp.src([
        "src/**/*.ts"
    ])
    .pipe(tsDtsProject())
    .on("error", function (err) {
        process.exit(1);
    })
    .dts.pipe(gulp.dest("dts"));

});