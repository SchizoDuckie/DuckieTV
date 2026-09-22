describe('FormlyLoader request mappings', function() {
  var FormlyLoader, requests

  beforeEach(module('DuckieTV', function($provide) {
    requests = {}
    $provide.value('$http', {
      get: function(url) {
        var transform
        var request = {
          then: function(callback) {
            transform = callback
            return request
          },
          resolve: function(data) {
            return transform({ data: data })
          }
        }
        requests[url] = request
        return request
      }
    })
  }))

  beforeEach(inject(function(_FormlyLoader_) {
    FormlyLoader = _FormlyLoader_
  }))

  it('preserves function identity while traversing nested and null values', function() {
    var validator = function() { return true }
    FormlyLoader.load('Nested', {
      options: ['one'],
      validators: { unique: validator }
    })

    var fields = requests['templates/formly-forms/Nested.json'].resolve([{
      fieldGroup: [{
        nullable: null,
        templateOptions: { options: '$mappings.options' },
        validators: '$mappings.validators.unique',
        missing: '$mappings.notPresent'
      }]
    }])

    expect(fields[0].fieldGroup[0].nullable).toBeNull()
    expect(fields[0].fieldGroup[0].templateOptions.options).toEqual(['one'])
    expect(fields[0].fieldGroup[0].validators).toBe(validator)
    expect(fields[0].fieldGroup[0].missing).toBeUndefined()
  })

  it('keeps mappings isolated across overlapping loads', function() {
    FormlyLoader.load('First', { value: 'first' })
    FormlyLoader.load('Second', { value: 'second' })

    var second = requests['templates/formly-forms/Second.json'].resolve([{ value: '$mappings.value' }])
    var first = requests['templates/formly-forms/First.json'].resolve([{ value: '$mappings.value' }])

    expect(second[0].value).toBe('second')
    expect(first[0].value).toBe('first')
  })

  it('allows forms without mappings', function() {
    FormlyLoader.load('Plain')

    var fields = requests['templates/formly-forms/Plain.json'].resolve([{
      label: 'plain',
      unresolved: '$mappings.optional'
    }])

    expect(fields[0].label).toBe('plain')
    expect(fields[0].unresolved).toBeUndefined()
  })
})
