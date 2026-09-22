const fs = require('fs')
const path = require('path')
const descriptors = require('../js/app.localeDescriptors.js')

const root = path.resolve(__dirname, '..')
const flags = fs.readFileSync(path.join(root, 'css', 'flags.css'), 'utf8')
const seenIds = Object.create(null)
const errors = []

function requireFile(relativePath, parseJson) {
  const absolutePath = path.join(root, relativePath)
  if (!fs.existsSync(absolutePath)) {
    errors.push(`Missing ${relativePath}`)
    return
  }
  if (parseJson) {
    try {
      JSON.parse(fs.readFileSync(absolutePath, 'utf8'))
    } catch (error) {
      errors.push(`Invalid JSON ${relativePath}: ${error.message}`)
    }
  }
}

descriptors.forEach(descriptor => {
  if (seenIds[descriptor.id]) errors.push(`Duplicate locale id ${descriptor.id}`)
  seenIds[descriptor.id] = true
  requireFile(`_locales/${descriptor.translation}.json`, true)
  requireFile(`_locales/angular-locale_${descriptor.angular}.js`, false)
  if (descriptor.chrome) requireFile(`_locales/${descriptor.chrome}/messages.json`, true)
  if (!flags.includes(`.flag.flag-${descriptor.flag}`)) errors.push(`Missing flag class ${descriptor.flag}`)
})

if (errors.length > 0) {
  errors.forEach(error => console.error(error))
  process.exitCode = 1
} else {
  console.log(`Validated ${descriptors.length} locale descriptors`)
}
