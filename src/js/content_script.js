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

    var list = document.getElementsByTagName('input')
    for(var i = 0; i < list.length; i++) {
      var item = list[i]

      if (typeof item.name == 'undefined') {
        continue
      }

      var name = item.name.toLowerCase()
      var type = getInputType(item)
      if (type == 'checkbox') {
        ccache[name] = 1
      } else if (type == 'radio') {
        rcache[name] = 1
      } else if (type == 'hidden' && this.excludeHidden === false) {
        increment('h', name)
      } else {
        increment('i', name)
      }
    }

    for (var name in ccache) {
      increment('c', name)
    }

    for (var name in rcache) {
      increment('r', name)
    }

    var list = document.getElementsByTagName('select')
    for(var i = 0; i < list.length; i++) {
      var item = list[i]
      if (typeof item.name == 'undefined') {
        continue
      }

      var name = item.name.toLowerCase()
      increment('s', name)
    }

    var list = document.getElementsByTagName('textarea')
    for(var i = 0; i < list.length; i++) {
      var item = list[i]
      if (typeof item.name == 'undefined') {
        continue
      }

      var name = item.name.toLowerCase()
      increment('t', name)
    }
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
    if (names.length === 0)
      return ''
    return names[names.length - 1]
  }

  buildInternalNamesFromElement(element)
  {
    var tag = element.tagName.toLowerCase()
    var name = element.name.toLowerCase()

    if (tag == 'input') {
      var type = getInputType(element)
      if (type == 'checkbox') {
        return this.buildInternalNames('c', name)
      } else if (type == 'radio') {
        return this.buildInternalNames('r', name)
      } else if (type == 'hidden' && this.excludeHidden === false) {
        return this.buildInternalNames('h', name)
      } else {
        return this.buildInternalNames('i', name)
      }
    } else if (tag == 'select') {
      return this.buildInternalNames('s', name)
    } else if (tag == 'textarea') {
      return this.buildInternalNames('t', name)
    }

    return []
  }

  buildInternalNames(type, name)
  {
    if (typeof name === 'undefined' || name === '') {
      return []
    }

    if (type in this.indexes === false) {
      this.indexes[type] = {}
    }

    if (type == 'c' || type == 'r' || (name in this.indexes[type]) === false) {
      this.indexes[type][name] = 0;
    } else {
      this.indexes[type][name]++;
    }
    var index = this.indexes[type][name]

    var ret = []
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
    return ret
  }

  applyInput()
  {
    var list = document.getElementsByTagName('input')
    for (var i = 0; i < list.length; i++) {
      var item = list[i]
      var type = getInputType(item)

      if (type == 'checkbox' || type == 'radio') {
        var values = this.getValues(item)
        if (values.indexOf(getCheckedValue(item)) === -1) {
          item.checked = false
        } else {
          item.checked = true
        }
      } else if (type != 'hidden' || this.excludeHidden === false) {
        item.value = this.getValue(item)
      }
    }
  }

  applySelect()
  {
    var list = document.getElementsByTagName('select')
    for (var i = 0; i < list.length; i++) {
      var item = list[i]

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
    }
  }

  applyTextArea()
  {
    var list = document.getElementsByTagName('textarea')
    for (var i = 0; i < list.length; i++) {
      var item = list[i]

      item.value = this.getValue(item)
    }
  }

  apply()
  {
    this.applyInput()
    this.applySelect()
    this.applyTextArea()
  }

  collectInput()
  {
    var list = document.getElementsByTagName('input')
    for (var i = 0; i < list.length; i++) {
      var item = list[i]
      var type = getInputType(item)

      var name = this.buildInternalNameFromElement(item)
      if (name === '')
        continue

      if (type == 'checkbox' || type == 'radio') {
        if (item.checked) {
          var value = getCheckedValue(item)
          this.setValue(name, item.value)
        }
      } else if (type != 'hidden' || this.excludeHidden === false) {
        var value = getTextValue(item)
        this.setValue(name, value)
      }
    }
  }

  collectSelect()
  {
    var list = document.getElementsByTagName('select')
    for (var i = 0; i < list.length; i++) {
      var item = list[i]

      var name = this.buildInternalNameFromElement(item)
      if (name === '')
        continue

      var options = item.options
      for (var n = 0; n < options.length; n++) {
        var option = options[n]

        if (option.selected) {
          var value = getOptionValue(option)
          this.setValue(name, value)
        }
      }
    }
  }

  collectTextarea()
  {
    var list = document.getElementsByTagName('textarea')
    for (var i = 0; i < list.length; i++) {
      var item = list[i]

      var name = this.buildInternalNameFromElement(item)
      if (name === '')
        continue

      var value = getTextValue(item)
      this.setValue(name, value)
    }
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