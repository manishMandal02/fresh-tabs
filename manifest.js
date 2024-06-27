/**
 * After changing, please reload the extension at `chrome://extensions`
 * @type {chrome.runtime.ManifestV3}
 */
const manifest = {
  manifest_version: 3,
  name: 'Fresh Tabs',
  version: '0.0.1',
  description: 'Manage tabs like pro',
  permissions: [
    'sidePanel',
    'tabs',
    'storage',
    'bookmarks',
    'favicon',
    'alarms',
    'scripting',
    'activeTab',
    'topSites',
    'history',
    'search',
    'tabGroups',
    'contextMenus',
    'webNavigation',
    'notifications',
    'system.display',
  ],
  commands: {
    cmdE: {
      suggested_key: {
        default: 'Ctrl+E',
        mac: 'Command+E',
      },
      description: 'Set above ☝️',
      global: true,
    },
    // new tab shortcut
    newTab: {
      suggested_key: {
        default: 'Ctrl+T',
        mac: 'Command+T',
      },
      description: 'New Tab to Right',
    },
    cmdPalette: {
      suggested_key: {
        default: 'Ctrl+Period',
        mac: 'Command+Period',
      },
      description: 'Command Palette',
      global: true,
    },
  },
  // chrome_url_overrides: {
  //   newtab: 'src/pages/new-tab/index.html',
  // },
  side_panel: {
    default_path: 'src/pages/sidepanel/index.html',
  },
  options_page: 'src/pages/options/index.html',
  background: {
    service_worker: 'src/pages/background/index.js',
    type: 'module',
  },
  action: {
    default_icon: 'icon-34.png',
    default_title: 'open Fresh Tabs',
  },
  content_scripts: [
    {
      matches: ['http://*/*', 'https://*/*', '<all_urls>'],
      js: ['src/pages/content/index.js'],
      world: 'ISOLATED',
    },
  ],
  icons: {
    128: 'icon-128.png',
  },
  web_accessible_resources: [
    {
      resources: ['assets/js/*.js', 'assets/css/*.css', 'icon-128.png', 'icon-34.png'],
      matches: ['*://*/*'],
    },
  ],
};

export default manifest;
