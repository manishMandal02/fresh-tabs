/**
 * After changing, please reload the extension at `chrome://extensions`
 * @type {chrome.runtime.ManifestV3}
 */
const manifest = {
  manifest_version: 3,
  name: 'Fresh Tabs',
  version: '0.0.1',
  description: 'Manage tabs like pro',
  permissions: ['sidePanel', 'tabs', 'storage', 'bookmarks', 'favicon'],
  commands: {
    cmdE: {
      suggested_key: {
        default: 'Ctrl+E',
        mac: 'Command+E',
      },
      description: 'Set ☝️ to open FreshTabs',
    },
  },
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
