/**
 * Applies torrent acceptance rules without reading settings or mutating results.
 * Callers resolve their settings into an explicit policy before calling filter.
 */
DuckieTV.factory('TorrentResultPolicy', [function() {
  function words(value, stripSearchPunctuation) {
    value = (value || '').toString().toLowerCase()
    if (stripSearchPunctuation) value = value.replace(/["\+]/g, ' ')
    return value.trim().split(/\s+/).filter(function(part) { return part.length > 0 })
  }

  function releaseName(item) {
    return (item.releasename || '').toString().toLowerCase()
  }

  function matchesScore(item, policy) {
    var name = releaseName(item)
    return words(policy.scoreQuery, policy.stripSearchPunctuation).every(function(part) {
      return (policy.negativeTermsPass && part[0] === '-') || name.indexOf(part) > -1
    })
  }

  function matchesRequired(item, policy) {
    if (!policy.requireAny) return true
    var required = words(policy.requiredKeywords)
    if (required.length === 0) return true
    var name = releaseName(item)
    return required.some(function(part) { return name.indexOf(part) > -1 })
  }

  function excludesIgnored(item, policy) {
    var ignored = words(policy.ignoredKeywords)
    if (ignored.length === 0) return true
    var protectedQuery = (policy.primaryQuery || '').toString().toLowerCase()
    var name = releaseName(item)
    return !ignored.some(function(part) {
      return protectedQuery.indexOf(part) === -1 && name.indexOf(part) > -1
    })
  }

  function matchesSize(item, policy) {
    if (item.size === null || typeof item.size === 'undefined' || item.size === 'n/a') return true
    var size = parseFloat(item.size)
    if (isNaN(size)) return true
    var minimum = policy.sizeMin === null || typeof policy.sizeMin === 'undefined' ? 0 : Number(policy.sizeMin)
    var maximum = policy.sizeMax === null || typeof policy.sizeMax === 'undefined' ? Number.MAX_SAFE_INTEGER : Number(policy.sizeMax)
    return size >= minimum && size <= maximum
  }

  function matchesSeeders(item, policy) {
    if (!policy.minSeedersEnabled || item.seeders === 'n/a' || item.seeders === null || typeof item.seeders === 'undefined') return true
    return parseInt(item.seeders, 10) >= Number(policy.minSeeders)
  }

  function deduplicate(items) {
    var byKey = Object.create(null)
    var keys = []
    items.forEach(function(item) {
      var key = item.detailUrl || item.releasename
      if (!(key in byKey)) keys.push(key)
      byKey[key] = item
    })
    return keys.map(function(key) { return byKey[key] })
  }

  var filters = {
    score: matchesScore,
    required: matchesRequired,
    ignored: excludesIgnored,
    size: matchesSize,
    seeders: matchesSeeders
  }

  return {
    filter: function(results, policy) {
      var items = (results || []).slice()
      var counts = {}
      var snapshots = {}
      var stages = policy.stages || ['score', 'seeders', 'required', 'ignored', 'size', 'duplicates']
      stages.forEach(function(stage) {
        if (stage === 'duplicates') {
          if (policy.deduplicate) items = deduplicate(items)
        } else {
          items = items.filter(function(item) { return filters[stage](item, policy) })
        }
        counts[stage] = items.length
        snapshots[stage] = items.slice()
      })
      return { items: items, counts: counts, snapshots: snapshots }
    }
  }
}])
