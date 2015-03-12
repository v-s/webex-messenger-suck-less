var WEBEX_IM_URL_PATTERN = 'https://im1.ciscowebex.com/webim/*';
var WEBEX_IM_SSO_LOGIN_URL = 'https://loginp.webexconnect.com/cas/FederatedSSO.do?type=webim&org=guidewire.com&target=https%3A%2F%2Floginp.webexconnect.com%2Fcas%2Fsso%2Fguidewire.com%2Fwebim.app';
var WEBEX_IM_POLL_ALARM_NAME = 'pollWebexWebIM';

chrome.browserAction.setBadgeBackgroundColor({color : '#ff0000'});

chrome.browserAction.onClicked.addListener(function() {
  chrome.browserAction.setBadgeText({'text' : ''})
  activateMessengerTab();
});

chrome.runtime.onInstalled.addListener(function(details) {
  chrome.tabs.query({url : WEBEX_IM_URL_PATTERN}, function(tabs) {
    if (tabs && tabs.length > 0) {
      chrome.notifications.create(
        '',
        {
          type: 'basic',
          title : 'Webex Messenger Suck-Less',
          message: 'You seem to have a Webex Messenger tab already open.\n You need to reload it for the extension to work!',
          iconUrl : 'blue_important_icon.png',
          priority: 2
        },
        function(notificationId) {
          activateMessengerTabOnNotificationClick(notificationId);
        }
      );
    }
  });

  chrome.alarms.create(WEBEX_IM_POLL_ALARM_NAME, {
    delayInMinutes: 1,
    periodInMinutes : 1
  });
});

chrome.alarms.onAlarm.addListener(function(alarm) {
  if (alarm.name == WEBEX_IM_POLL_ALARM_NAME) {
    queryWebexPage(retrieveMessages);
  }
});

function activateMessengerTab() {
  queryWebexPage(function(tab) {
    chrome.tabs.update(tab.id, {active : true});
  });
}

function queryWebexPage(callback) {
  chrome.tabs.query({url : WEBEX_IM_URL_PATTERN}, function(tabs) {
    if (!tabs || tabs.length == 0) {
      chrome.tabs.create({
        active: false,
        index: 0,
        url: WEBEX_IM_SSO_LOGIN_URL
      }, callback);
    } else if (!tabs[0].active) { // Don't notify if user is already on IM page.
      callback(tabs[0]);
    }
  });
}

function retrieveMessages(tab) {
  var tabID = tab.id
  chrome.tabs.sendMessage(tabID, {}, function(response) {
    if(!response) {
      chrome.browserAction.setBadgeText({'text' : 'ERR'})
      return
    }

    chrome.storage.sync.get(null, function(data) {
      var numMessages = 0;
      var iconUrl = 'webex_icon_mono.png';
      var badgeText = '';

      var newMessages = response.messages;
      var dataToUpdateInStore = {};
      for(var sender in newMessages) {
        var senderMessages = newMessages[sender];
        var numSenderMessages = senderMessages.length;
        numMessages += numSenderMessages;
        var latestMsgFromSender = senderMessages[numSenderMessages - 1].text;

        if (data[sender] && latestMsgFromSender === data[sender]) {
          continue;
        }

        dataToUpdateInStore[sender] = latestMsgFromSender;

        var notificationMessagesList = [];
        $(senderMessages).each(function(idx, message) {
          notificationMessagesList.push({
            title: message.timestamp,
            message: message.text
          });
        });

        chrome.notifications.create(
          '',
          {
            type: 'list',
            title : sender,
            message: '',
            iconUrl : 'webex_icon.png',
            items: notificationMessagesList,
            priority: 2
          },
          function(notificationId) {
            activateMessengerTabOnNotificationClick(notificationId);
          }
        );
      }

      chrome.storage.sync.set(dataToUpdateInStore, function() {});

      if(numMessages > 0) {
        iconUrl = 'webex_icon.png'
        badgeText = String(numMessages)
      }

      chrome.browserAction.setIcon({'path' : iconUrl})
      chrome.browserAction.setBadgeText({'text' : badgeText})
    });
  });
}

function activateMessengerTabOnNotificationClick(notificationId) {
  chrome.notifications.onClicked.addListener(function(clickedNotificationId) {
    if (clickedNotificationId === notificationId) {
      activateMessengerTab();
    }
  });
}