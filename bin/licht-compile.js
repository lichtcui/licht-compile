#!/usr/bin/env node
process.argv.push("--cwd");
process.argv.push(process.cwd());
process.argv.push("--gulpfile");

// 会自动到 package.json 中调用 main 的值
process.argv.push(require.resolve(".."));

require("gulp/bin/gulp");
