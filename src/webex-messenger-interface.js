var globalVarsAccessHackScript = document.createElement('script');
globalVarsAccessHackScript.src = chrome.extension.getURL('global_vars_access_hack.js');
document.head.appendChild(globalVarsAccessHackScript);
globalVarsAccessHackScript.onload = function() {
    globalVarsAccessHackScript.parentNode.removeChild(globalVarsAccessHackScript);
};

document.addEventListener('webexMessengerSuckLess_globalVarAccessHack', function(e) {
  var loggedInUser = e.detail.loggedInUser;

  chrome.runtime.onMessage.addListener(
    function(request, sender, sendResponse) {
      var lastSeenIMs = request.lastSeenIMs;
    	var newIMs = {};

      $('div.IMDialog').each(function() {
        var thisElt = $(this);
        var imSender = thisElt.find('div.userName').text();
        var lastSeenIMFromSender = lastSeenIMs[imSender];

        thisElt.find('div.msg').each(function() {
          var imElt = $(this);
          var currentIMSender = imElt.siblings('div.buddyName').attr('jid');
          var imText = imElt.find('span.msgText').text().trim();
          
          // Skip outgoing messages and already seen incoming messages.
          if((currentIMSender === loggedInUser) || (lastSeenIMFromSender && imText === lastSeenIMFromSender)) {
            newIMs[imSender] = [];
          } else {
            if (!newIMs[imSender]) {
              newIMs[imSender] = [];
            }

            var im = {};
            im.text = imText;
            im.timestamp = imElt.find('span.timeStamp').text().trim();
            newIMs[imSender].push(im);
          }
        });
    	});

    	sendResponse({'newIMs' : newIMs});
    }
  );
});