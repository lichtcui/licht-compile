#!/usr/bin/env node

// mac 需要权限
// chmod 755 licht-pages.js

// 重新 link
// yarn unlink
// yarn link

process.argv.push("--cwd");
process.argv.push(process.cwd());
process.argv.push("--gulpfile");

// 会自动到 package.json 中调用 main 的值
process.argv.push(require.resolve(".."));

require("gulp/bin/gulp");
