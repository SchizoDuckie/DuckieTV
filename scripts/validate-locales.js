const fs = require('fs')
const path = require('path')
const descriptors = require('../js/app.localeDescriptors.js')

const root = path.resolve(__dirname, '..')
const flags = fs.readFileSync(path.join(root, 'css', 'flags.css'), 'utf8')
const seenIds = Object.create(null)
const checkedTranslations = Object.create(null)
const errors = []
const genreKeys = ['action', 'adventure', 'animation', 'anime', 'biography', 'children', 'comedy', 'crime', 'disaster', 'documentary', 'drama', 'eastern', 'family', 'fan-film', 'fantasy', 'film-noir', 'food', 'game-show', 'history', 'holiday', 'home-and-garden', 'horror', 'indie', 'mini-series', 'music', 'musical', 'mystery', 'news', 'none', 'reality', 'road', 'romance', 'science-fiction', 'short', 'soap', 'special-interest', 'sports', 'sporting-event', 'superhero', 'suspense', 'talk-show', 'thriller', 'travel', 'tv-movie', 'war', 'western']
const statusKeys = ['canceled', 'ended', 'in-production', 'returning-series', 'planned']

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
  if (!checkedTranslations[descriptor.translation]) {
    checkedTranslations[descriptor.translation] = true
    const table = JSON.parse(fs.readFileSync(path.join(root, '_locales', `${descriptor.translation}.json`), 'utf8'))
    genreKeys.forEach(key => {
      if (typeof table[`GENRE.${key}`] !== 'string') errors.push(`Missing GENRE.${key} in ${descriptor.translation}`)
    })
    statusKeys.forEach(key => {
      if (typeof table[`STATUS.${key}`] !== 'string') errors.push(`Missing STATUS.${key} in ${descriptor.translation}`)
    })
    if ('GENRELIST' in table || 'STATUSLIST' in table) errors.push(`Positional series metadata remains in ${descriptor.translation}`)
  }
  requireFile(`_locales/angular-locale_${descriptor.angular}.js`, false)
  if (descriptor.chrome) requireFile(`_locales/${descriptor.chrome}/messages.json`, true)
  if (!flags.includes(`.flag.flag-${descriptor.flag}`)) errors.push(`Missing flag class ${descriptor.flag}`)
})

const semanticSpotChecks = {
  it_it: { 'GENRE.music': 'Musica', 'GENRE.mystery': 'Mistero', 'GENRE.science-fiction': 'Fantascienza' },
  ja_jp: { 'GENRE.anime': 'アニメ', 'GENRE.biography': 'バイオグラフィー', 'GENRE.superhero': 'スーパーヒーロー', 'GENRE.travel': '旅行', 'GENRE.tv-movie': 'テレビ映画' },
  ko_kr: { 'GENRE.disaster': '재앙', 'GENRE.documentary': '다큐멘터리', 'GENRE.family': '가족', 'GENRE.fan-film': '팬 영화', 'GENRE.superhero': '슈퍼히어로' }
}
Object.keys(semanticSpotChecks).forEach(locale => {
  const table = JSON.parse(fs.readFileSync(path.join(root, '_locales', `${locale}.json`), 'utf8'))
  Object.keys(semanticSpotChecks[locale]).forEach(key => {
    if (table[key] !== semanticSpotChecks[locale][key]) errors.push(`Incorrect ${key} in ${locale}`)
  })
})

if (errors.length > 0) {
  errors.forEach(error => console.error(error))
  process.exitCode = 1
} else {
  console.log(`Validated ${descriptors.length} locale descriptors`)
}
