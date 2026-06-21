'use strict';

function shareLink(data) {
	const mailtoParams = {};
	if (data.url && data.text) {
		mailtoParams.body = `${data.url}\n${data.text}`;
	} else {
		mailtoParams.body = data.url;
	}
	if (data.subject) {
		mailtoParams.subject = data.subject;
	}

	if (Object.keys(mailtoParams).length > 0) {
		const mailtoUrl = `mailto:?${
				Object.entries(mailtoParams)
				.map(([key, value]) => `${key}=${encodeURIComponent(value)}`)
				.join('&')
			}`;
		browser.tabs.getCurrent().then(
			() => browser.tabs.update({ url: mailtoUrl })
		);
	}
}

async function handleMenuClick(info) {
	switch (info.menuItemId) {
		case 'emailLink':
			shareLink({ url: info.linkUrl });
			break;
		case 'emailPageLink': {
			const data = {
				url: info.pageUrl,
				text: info.selectionText,
			};
			const tabs = await browser.tabs.query({ url: data.url });
			if (tabs.length > 0) {
				data.subject = tabs[0].title;
			}
			shareLink(data);
			break;
		}
		case 'emailFrameLink':
			shareLink({ url: info.frameUrl });
			break;
		case 'emailImageLink':
			shareLink({ url: info.srcUrl });
			break;
		case 'emailAudioLink':
			shareLink({ url: info.srcUrl });
			break;
		case 'emailVideoLink':
			shareLink({ url: info.srcUrl });
			break;
	}
}

function addContextMenus(browserInfo) {
	browser.contextMenus.create({
		id: 'emailLink',
		type: 'normal',
		title: browser.i18n.getMessage('emailLinkContextMenu'),
		contexts: ['link'],
	});

	const pageLinkContexts = ['page', 'selection'];
	if (browserInfo && browserInfo.vendor === 'Mozilla') {
		pageLinkContexts.push('tab');
	}

	browser.contextMenus.create({
		id: 'emailPageLink',
		type: 'normal',
		title: browser.i18n.getMessage('emailPageLinkContextMenu'),
		contexts: pageLinkContexts,
	});

	browser.contextMenus.create({
		id: 'emailFrameLink',
		type: 'normal',
		title: browser.i18n.getMessage('emailFrameLinkContextMenu'),
		contexts: ['frame'],
	});

	browser.contextMenus.create({
		id: 'emailImageLink',
		type: 'normal',
		title: browser.i18n.getMessage('emailImageLinkContextMenu'),
		contexts: ['image'],
	});

	browser.contextMenus.create({
		id: 'emailAudioLink',
		type: 'normal',
		title: browser.i18n.getMessage('emailAudioLinkContextMenu'),
		contexts: ['audio'],
	});

	browser.contextMenus.create({
		id: 'emailVideoLink',
		type: 'normal',
		title: browser.i18n.getMessage('emailVideoLinkContextMenu'),
		contexts: ['video'],
	});
}

async function addPageAction() {
	browser.tabs.query({}).then((tabs) =>
		tabs.forEach((tab) => chrome.pageAction.show(tab.id))
	);
	browser.tabs.onUpdated.addListener((tabId, changeInfo) => {
		if (changeInfo.status === 'complete') {
			chrome.pageAction.show(tabId);
		}
	});
	browser.pageAction.onClicked.addListener((tab) =>
		shareLink({ url: tab.url, subject: tab.title })
	);
}

browser.contextMenus.onClicked.addListener(handleMenuClick);

(async function init() {
	let browserInfo;
	if (browser.runtime.getBrowserInfo) {
		browserInfo = await browser.runtime.getBrowserInfo();
	}
	addContextMenus(browserInfo);
	addPageAction();
})();
