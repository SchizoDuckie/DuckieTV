'use strict'

const path = require('node:path')

// Node 26's experimental process-global Web Storage shadows Chromium's
// origin-scoped localStorage in NW.js background pages. The node-main flag in
// package.json disables that Node API before any application scripts execute.
global.DuckieTVAppRoot = path.resolve(__dirname, '..', '..')
global.DuckieTVRequireFromRoot = function(relativePath) {
  return require(path.join(global.DuckieTVAppRoot, relativePath))
}
