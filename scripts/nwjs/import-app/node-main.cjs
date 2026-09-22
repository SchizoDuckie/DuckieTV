'use strict'

const path = require('node:path')

global.DuckieTVMigrationRoot = path.resolve(__dirname, '..', '..', '..')
global.DuckieTVMigrationRequire = function(relativePath) {
  return require(path.join(global.DuckieTVMigrationRoot, relativePath))
}
