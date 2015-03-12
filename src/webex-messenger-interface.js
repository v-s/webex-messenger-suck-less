var globalVarsAccessHackScript = document.createElement('script');
globalVarsAccessHackScript.src = chrome.extension.getURL('global_vars_access_hack.js');
document.head.appendChild(globalVarsAccessHackScript);
globalVarsAccessHackScript.onload = function() {
    globalVarsAccessHackScript.parentNode.removeChild(globalVarsAccessHackScript);
};

chrome.runtime.onMessage.addListener(
  function(request, sender, sendResponse) {
    var loggedInUser = $('#webim_main_showuser').attr('title');
  	var newMessages = {};

    $('div.IMDialog.webim_onDialogNewMsgReceived').each(function() {
      var thisElt = $(this);
      var sender = thisElt.find('div.userName').text();

      thisElt.find('div.msg').each(function() {
        var msgElt = $(this);

        if(msgElt.siblings('div.buddyName').text().match(new RegExp('^' + loggedInUser + '.*', 'i'))) {
          newMessages[sender] = [];
        } else {
          if (!newMessages[sender]) {
            newMessages[sender] = [];
          }

          var message = {};
          message.text = msgElt.find('span.msgText').text().trim();
          message.timestamp = msgElt.find('span.timeStamp').text().trim();
          newMessages[sender].push(message);
        }
      });
  	});

  	sendResponse({messages : newMessages});
  }
);