'ues strict';


document.addEventListener("DOMContentLoaded", function(ev) {
  var saveBtn = document.getElementById('save')
  var loadBtn = document.getElementById('load')
  var uploadInput = document.getElementById('upload')

  saveBtn.addEventListener('click', function(ev) {
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
      if (tabs.length === 0)
        return

      chrome.tabs.sendMessage(tabs[0].id, {type: "save"}, function(response) {
        if (response.url) {
          chrome.downloads.download({
            url: response.url,
            filename: "form.json",
            saveAs: true
          }, function (id) {
            var listener = (delta) => {
              if (delta.id === id && typeof delta.state !== 'undefined') {
                if (delta.state.current === 'interrupted' || delta.state.current === 'complete') {
                  chrome.downloads.onChanged.removeListener(listener)
                  window.close()
                }
              }
            }
            chrome.downloads.onChanged.addListener(listener)
          });
        }
      });
    });
  });

  loadBtn.addEventListener('click', function(ev) {
    uploadInput.click()
  })

  uploadInput.addEventListener('change', function(ev) {
    var files = ev.target.files

    if (files.length === 0)
      return

    var file = files[0]
    var reader = new FileReader()

    reader.onload = function(ev) {
      var data = null;
      try {
        data = JSON.parse(ev.target.result)
      } catch (ex) {
        // TODO parse error
        console.log('parse error')
        return
      }

      var msg = {
        type: 'load',
        data: data
      }

      chrome.tabs.query({active: true, currentWindow: true}, function (tabs) {
        if (tabs.length === 0)
          return

        chrome.tabs.sendMessage(tabs[0].id, msg, function (response) {
          console.log('load done')
          window.close()
        })
      })
    }

    reader.onerror = function (ev) {
      // TODO read error
      console.log('read error')
    }

    reader.readAsText(file)
  })
});