var BADGE_ICON_ACTIVE = 'webex_icon.png';
var BADGE_ICON_INACTIVE = 'webex_icon_mono.png';
var WEBEX_IM_URL_PATTERN = 'https://im1.ciscowebex.com/webim/*';
var WEBEX_IM_SSO_LOGIN_URL = 'https://loginp.webexconnect.com/cas/FederatedSSO.do?type=webim&org=guidewire.com&target=https%3A%2F%2Floginp.webexconnect.com%2Fcas%2Fsso%2Fguidewire.com%2Fwebim.app';
var WEBEX_IM_POLL_ALARM_NAME = 'pollWebexWebIM';

chrome.browserAction.setBadgeBackgroundColor({color : '#ff0000'});

chrome.browserAction.onClicked.addListener(function() {
  chrome.browserAction.setBadgeText({'text' : ''})
  activateIMTab();
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
          activateIMTabOnNotificationClick(notificationId);
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
    queryWebexPage(retrieveIMs);
  }
});

function activateIMTab() {
  queryWebexPage(function(tab) {
    chrome.tabs.update(tab.id, {active : true});
    updateBadgeIconAndTextWithIMCount(0);
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
    } else if (tabs[0].active) { // Clear notifications if user is already on IM page.
      updateBadgeIconAndTextWithIMCount(0);
    } else {
      callback(tabs[0]);
    }
  });
}

function retrieveIMs(tab) {
  chrome.storage.sync.get('lastSeenIMs', function(data) {
    if (!data.lastSeenIMs) {
      data.lastSeenIMs = {};
    }

    chrome.tabs.sendMessage(tab.id, {'lastSeenIMs': data.lastSeenIMs}, function(response) {
      if(!response) {
        chrome.browserAction.setBadgeText({'text' : 'ERR'});
        return
      }

      var numIMs = 0;
      var newIMs = response.newIMs;
      var dataToUpdateInStore = data;

      for(var sender in newIMs) {
        var senderIMs = newIMs[sender];
        var numSenderIMs = senderIMs.length;
        numIMs += numSenderIMs;
        var latestIMFromSender = senderIMs[numSenderIMs - 1].text;

        dataToUpdateInStore.lastSeenIMs[sender] = latestIMFromSender;

        var notificationMessagesList = [];
        $(senderIMs).each(function(idx, im) {
          notificationMessagesList.push({
            title: im.timestamp,
            message: im.text
          });
        });

        chrome.notifications.create(
          '',
          {
            type: 'list',
            title : sender,
            message: '',
            iconUrl : BADGE_ICON_ACTIVE,
            items: notificationMessagesList,
            priority: 2
          },
          function(notificationId) {
            activateIMTabOnNotificationClick(notificationId);
          }
        );
      }

      chrome.storage.sync.set(dataToUpdateInStore, function() {});
      updateBadgeIconAndTextWithIMCount(numIMs);
    });
  });
}

function updateBadgeIconAndTextWithIMCount(numIMs) {
  var badgeIconUrl, badgeText;
  if (numIMs > 0) {
    badgeIconUrl = BADGE_ICON_ACTIVE;
    badgeText = String(numIMs);
  } else {
    badgeIconUrl = BADGE_ICON_INACTIVE;
    badgeText = '';
  }

  chrome.browserAction.setIcon({'path' : badgeIconUrl});
  chrome.browserAction.setBadgeText({'text' : badgeText});
}

function activateIMTabOnNotificationClick(notificationId) {
  chrome.notifications.onClicked.addListener(function(clickedNotificationId) {
    if (clickedNotificationId === notificationId) {
      activateIMTab();
    }
  });
}