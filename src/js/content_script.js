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
    this.indexes = {}
    this.nameCount = {}

    this.init()
  }

  init()
  {
    var ccache = {};
    var rcache = {};

    var increment = (type, name) => {
      if (name in this.nameCount === false) {
        this.nameCount[name] = { total: 0 }
      }
      this.nameCount[name].total++

      if (type in this.nameCount[name] === false) {
        this.nameCount[name][type] = 0
      }
      this.nameCount[name][type]++
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
      } else if (type == 'hidden') {
        increment('h', name)
      } else {
        increment('i', name)
      }
    })

    for (var name in ccache) {
      increment('c', name)
    }

    for (var name in rcache) {
      increment('r', name)
    }

    this.getElements('select')
    .filter((item) => (typeof item.name !== 'undefined' && item.name !== ''))
    .forEach((item) => {
      var name = item.name.toLowerCase()
      increment('s', name)
    })

    this.getElements('textarea')
    .filter((item) => (typeof item.name !== 'undefined' && item.name !== ''))
    .forEach((item) => {
      var name = item.name.toLowerCase()
      increment('t', name)
    })
  }

  getValues(element)
  {
    var names = this.buildInternalNamesFromElement(element)
    for (var i = 0; i < names.length; i++) {
      var name = names[i]
      if (name in this.values) {
        var ret = this.values[name]
        if (Array.isArray(ret)) {
          return ret
        }
        return [ ret ]
      }
    }
  }

  getValue(element)
  {
    var names = this.buildInternalNamesFromElement(element)
    for (var i = 0; i < names.length; i++) {
      var name = names[i]
      if (name in this.values) {
        var ret = this.values[name]
        if (Array.isArray(ret) && ret.length > 0) {
          return ret[0]
        }
        return ret
      }
    }
  }

  setValue(name, value)
  {
    if (!name)
      return

    if (name in this.values) {
      if (!Array.isArray(this.values[name])) {
        this.values[name] = [ this.values[name] ]
      }
      this.values[name].push(value)
    } else {
      this.values[name] = value
    }
  }

  buildInternalNameFromElement(element)
  {
    var names = this.buildInternalNamesFromElement(element)
    return names[names.length - 1]
  }

  buildInternalNamesFromElement(element)
  {
    var ret = []

    if (typeof element.id !== 'undefined' && element.id !== '') {
      ret.push('#' + element.id)
    }

    if (typeof element.name !== 'undefined' && element.name !== '') {
      var name = element.name.toLowerCase()
      var type = getInternalType(element)

      if (type in this.indexes === false) {
        this.indexes[type] = {}
      }

      if (type == 'c' || type == 'r' || (name in this.indexes[type]) === false) {
        this.indexes[type][name] = 0;
      } else {
        this.indexes[type][name]++;
      }
      var index = this.indexes[type][name]

      ret.push(type + ':' + name + '.' + index)
      if (index === 0) {
        ret.push(type + ':' + name)
      }

      if (this.nameCount[name].total === this.nameCount[name][type]) {
        ret.push(name + '.' + index)
        if (index === 0) {
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
      var type = getInputType(item)

      if (type == 'checkbox' || type == 'radio') {
        var values = this.getValues(item)
        if (values.indexOf(getCheckedValue(item)) === -1) {
          item.checked = false
        } else {
          item.checked = true
        }
      } else {
        item.value = this.getValue(item)
      }
    })
  }

  applySelect()
  {
    this.getElements('select').forEach((item) => {
      var values = this.getValues(item)
      var options = item.options
      for (var n = 0; n < options.length; n++) {
        var option = options[n]
        var value = getOptionValue(option)

        if (values.indexOf(value) === -1) {
          option.selected = false
        } else {
          option.selected = true
        }
      }
    })
  }

  applyTextArea()
  {
    this.getElements('textarea').forEach((item) => {
      item.value = this.getValue(item)
    })
  }

  apply()
  {
    this.indexes = {}
    this.applyInput()
    this.applySelect()
    this.applyTextArea()
  }

  collectInput()
  {
    this.getElements('input').forEach((item) => {
      var type = getInputType(item)
      var name = this.buildInternalNameFromElement(item)

      if (type == 'checkbox' || type == 'radio') {
        if (item.checked) {
          var value = getCheckedValue(item)
          this.setValue(name, item.value)
        }
      } else {
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
      for (var n = 0; n < options.length; n++) {
        var option = options[n]

        if (option.selected) {
          var value = getOptionValue(option)
          this.setValue(name, value)
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
    this.indexes = {}
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

      var url = URL.createObjectURL(new Blob([JSON.stringify(restorer.values, null, '  ')], {type: 'application/json'}))
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