/*
  Most of the juicy stuff that we don't to do via this extension, are only possible by accessing the global 'webim' javascript object created by Webex IM. Unfortunately (and for good reason), Chrome doesn't allow Content Scripts to access variables outside their own sandbox. Enter this well known hack (thanks SO!) which enables us to circumvent this restriction.
*/
setInterval(function() {
  // Ping the server in all possible ways every 30 seconds, to prevent session timeout.
  webim.IPresenceService.SendDirectPresence(webim.main.userName);
  webim.ILDAPService.SearchUsersByKey('Han', 'Solo' + new Date().getTime(), '', '1', function(a) {});
}, 30000);

// TODO: Put this whole abomination to a worthwile cause. Hook into webim's MessageManager.OnMsgReceived event to get
// notified of (and thus handle) new messages. This would beat the hell out of the current UI-scrapping approach.
/*setTimeout(function() {
  webim.util.subscribe("????",this,"myMessageHandler");
  document.dispatchEvent(new CustomEvent('webexMessengerSuckLess_globalVarAccessHack', {
      detail: {'newMessage': {foo: bar}},
      bubbles: true,
      cancelable: false
  }));
}, 0);*/