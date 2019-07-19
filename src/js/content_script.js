'use strict';

function getInputType(element)
{
  return (element.type) ? element.type.toLowerCase() : 'text'
}

function getOptionValue(option)
{
  if (typeof option.value !== 'undefined') {
    return option.value
  }

  if (typeof option.textContent !== 'undefined') {
    return option.textContent
  }

  return ''
}

function getCheckedValue(element)
{
  return (typeof element.value === 'undefined') ? 'on' : element.value
}

function getTextValue(element)
{
  return (typeof element.value === 'undefined') ? '' : element.value
}

function getInternalType(element)
{
    var tag = element.tagName.toLowerCase()

    if (tag == 'input') {
      var type = getInputType(element)
      if (type == 'checkbox') {
        return 'c'
      } else if (type == 'radio') {
        return 'r'
      } else if (type == 'hidden') {
        return 'h'
      } else {
        return 'i'
      }
    } else if (tag == 'select') {
      return 's'
    } else if (tag == 'textarea') {
      return 't'
    }
    return ''
}

class Restorer {
  constructor(values = {}, excludeHidden = true)
  {
    this.values = values
    this.excludeHidden = excludeHidden
    this.indexes = { n: {}, c: {}, r: {} }
    this.nameCache = {}

    this.init()
  }

  init()
  {
    var ccache = {};
    var rcache = {};

    var increment = (name) => {
      if (name in this.nameCache === false) {
        this.nameCache[name] = 0
      }
      this.nameCache[name]++
    }

    this.getElements('input')
    .filter((item) => (typeof item.name !== 'undefined' && item.name !== ''))
    .forEach((item) => {
      var name = item.name.toLowerCase()
      var type = getInputType(item)
      if (type == 'checkbox') {
        ccache[name] = 1
      } else if (type == 'radio') {
        rcache[name] = 1
      } else {
        increment(name)
      }
    })

    for (var name in ccache) {
      increment(name)
    }

    for (var name in rcache) {
      increment(name)
    }

    this.getElements('select')
    .filter((item) => (typeof item.name !== 'undefined' && item.name !== ''))
    .forEach((item) => {
      var name = item.name.toLowerCase()
      increment(name)
    })

    this.getElements('textarea')
    .filter((item) => (typeof item.name !== 'undefined' && item.name !== ''))
    .forEach((item) => {
      var name = item.name.toLowerCase()
      increment(name)
    })
  }

  getValues(names)
  {
    for (var i = 0; i < names.length; i++) {
      var name = names[i]
      if (name in this.values) {
        var ret = this.values[name]
        if (Array.isArray(ret) === false) {
          ret = [ ret ]
        }
        return ret.filter((v) => v !== '')
      }
    }

    return null 
  }

  getValue(names)
  {
    for (var i = 0; i < names.length; i++) {
      var name = names[i]
      if (name in this.values) {
        var ret = this.values[name]
        if (Array.isArray(ret)) {
          return (ret.length) ? ret[0] : ''
        } else {
          return ret
        }
      }
    }
    return null
  }

  setValue(name, value)
  {
    if (!name)
      return

    if (name in this.values) {
      if (this.values[name] === '') {
        this.values[name] = value
        return
      }

      if (value !== '') {
        if (!Array.isArray(this.values[name])) {
          this.values[name] = [ this.values[name] ]
        }
        this.values[name].push(value)
      }
    } else {
      this.values[name] = value
    }
  }

  buildInternalNameFromElement(element)
  {
    var names = this.buildInternalNamesFromElement(element)
    return names[names.length - 1]
  }

  makeIndexedName(name, index)
  {
    var prefix = ''

    while (true) {
      var ret = name + '.' + prefix + index
      if (ret in this.nameCache === false)
        return ret

      prefix += '0'
    }
  }

  makeIdName(name)
  {
    var prefix = '#'

    while (true) {
      var ret = prefix + name
      if (ret in this.nameCache === false)
        return ret

      prefix += '#'
    }
  }

  buildInternalNamesFromElement(element)
  {
    var ret = []

    if (typeof element.id !== 'undefined' && element.id !== '') {
      ret.push(this.makeIdName(element.id))
    }

    if (typeof element.name !== 'undefined' && element.name !== '') {
      var name = element.name.toLowerCase()
      var type = getInternalType(element)

      var index = 0
      if (type == 'c' || type == 'r') {
        if (name in this.indexes[type] === false) {
          if (name in this.indexes.n === false) {
            this.indexes.n[name] = 0
          } else {
            this.indexes.n[name]++
          }
          this.indexes[type][name] = this.indexes.n[name]
        }
        index = this.indexes[type][name]
      } else {
        if (name in this.indexes.n === false) {
          this.indexes.n[name] = 0
        } else {
          this.indexes.n[name]++
        }

        index = this.indexes.n[name]
      }

      if (index === 0) {
        if (name in this.nameCache && this.nameCache[name] > 1) {
          ret.push(name)
        }
      }

      ret.push(this.makeIndexedName(name, index))

      if (index === 0) {
        if (name in this.nameCache === false || this.nameCache[name] === 1) {
          ret.push(name)
        }
      }
    }

    return ret
  }

  getElements(tag)
  {
    var list = document.getElementsByTagName(tag)
    return Array.prototype.slice.call(list).filter((item) => {
      if (typeof item.name === 'undefined' || item.name === '') {
        if (typeof item.id === 'undefined' || item.id === '') {
          return false
        }
      }

      if (tag == 'input') {
        var type = getInputType(item)
        if (type == 'file' || type == 'submit' || type == 'reset' || type == 'image' || type == 'button')
          return false
        
        if (type == 'hidden' && this.excludeHidden)
          return false
      }

      return true
    })
  }

  applyInput()
  {
    this.getElements('input').forEach((item) => {
      var names = this.buildInternalNamesFromElement(item)
      var type = getInputType(item)

      if (type == 'checkbox' || type == 'radio') {
        var values = this.getValues(names)
        if (values !== null) {
          if (values.indexOf(getCheckedValue(item)) === -1) {
            item.checked = false
          } else {
            item.checked = true
          }
        }
      } else {
        var value = this.getValue(names)
        if (value !== null)
          item.value = value
      }
    })
  }

  applySelect()
  {
    this.getElements('select').forEach((item) => {
      var names = this.buildInternalNamesFromElement(item)
      var values = this.getValues(names)

      if (values !== null) {
        var options = item.options
        if (options) {
          for (var n = 0; n < options.length; n++) {
            var option = options[n]
            var value = getOptionValue(option)

            if (values.indexOf(value) === -1) {
              option.selected = false
            } else {
              option.selected = true
            }
          }
        }
      }
    })
  }

  applyTextArea()
  {
    this.getElements('textarea').forEach((item) => {
      var names = this.buildInternalNamesFromElement(item)
      var value = this.getValue(names)
      if (value !== null)
        item.value = value
    })
  }

  apply()
  {
    this.indexes = { n: {}, c: {}, r: {} }
    this.applyInput()
    this.applySelect()
    this.applyTextArea()
  }

  collectInput()
  {
    this.getElements('input').forEach((item) => {
      var name = this.buildInternalNameFromElement(item)
      var type = getInputType(item)

      if (type == 'checkbox' || type == 'radio') {
        if (item.checked) {
          var value = getCheckedValue(item)
          this.setValue(name, item.value)
        } else {
          this.setValue(name, '')
        }
      } else if (type != 'hidden' || !this.excludeHidden) {
        var value = getTextValue(item)
        this.setValue(name, value)
      }
    })
  }

  collectSelect()
  {
    this.getElements('select').forEach((item) => {
      var name = this.buildInternalNameFromElement(item)

      var options = item.options
      if (options) {
        for (var n = 0; n < options.length; n++) {
          var option = options[n]

          if (option.selected) {
            var value = getOptionValue(option)
            this.setValue(name, value)
          }
        }
      }
    })
  }

  collectTextarea()
  {
    this.getElements('textarea').forEach((item) => {
      var name = this.buildInternalNameFromElement(item)

      var value = getTextValue(item)
      this.setValue(name, value)
    })
  }

  collect()
  {
    this.indexes = { n: {}, c: {}, r: {} }
    this.collectInput()
    this.collectSelect()
    this.collectTextarea()
  }
}

chrome.runtime.onMessage.addListener(
  function(request, sender, sendResponse) {
    if (request.type == 'save') {
      var restorer = new Restorer()
      restorer.collect()

      var url = URL.createObjectURL(new Blob([JSON.stringify(restorer.values, null, '  ')], { type: 'application/json' }))
      sendResponse({
        url: url
      })
    } else if (request.type == 'load') {
      var restorer = new Restorer(request.data)
      restorer.apply()
      sendResponse({})
    }
  }
)