import { defineConfig } from 'vitepress'
import type { DefaultTheme } from 'vitepress'

import pkg from '../../package.json'

export default defineConfig({
  lang: 'zh-CN',

  title: 'Sptr.js',

  head: [
    ['link', { rel: 'icon', type: 'image/svg+xml', href: '/vitepress-logo-mini.svg' }],
    ['link', { rel: 'icon', type: 'image/png', href: '/vitepress-logo-mini.png' }],
    ['meta', { name: 'theme-color', content: '#5f67ee' }],
    ['meta', { name: 'og:type', content: 'website' }],
    ['meta', { name: 'og:locale', content: 'en' }],
    ['meta', { name: 'og:site_name', content: 'VitePress' }],
    ['meta', { name: 'og:image', content: 'https://vitepress.dev/vitepress-og.jpg' }],
    ['script', { 'src': 'https://cdn.usefathom.com/script.js', 'data-site': 'AZBRSFGG', 'data-spa': 'auto', 'defer': '' }],
  ],

  themeConfig: {
    logo: { src: '/vitepress-logo-mini.svg', width: 24, height: 24 },

    nav: nav(),

    sidebar: {
      '/guide/': { base: '/guide/', items: sidebarGuide() },
      '/reference/': { base: '/reference/', items: sidebarApi() },
    },

    editLink: {
      pattern: 'https://github.com/sptrjs/sptr/edit/main/docs/:path',
      text: 'Edit this page on GitHub',
    },

    socialLinks: [
      { icon: 'github', link: 'https://github.com/sptrjs/sptr' },
    ],

    footer: {
      message: 'Released under the MIT License.',
      copyright: 'Copyright © 2019-present Evan You',
    },

    search: {
      provider: 'algolia',
      options: {
        appId: '8J64VVRP8K',
        apiKey: 'a18e2f4cc5665f6602c5631fd868adfd',
        indexName: 'vitepress',
      },
    },

    carbonAds: {
      code: 'CEBDT27Y',
      placement: 'vuejsorg',
    },
  },
})

function nav(): DefaultTheme.NavItem[] {
  return [
    {
      text: '指引',
      link: '/guide/index',
      activeMatch: '/guide/',
    },
    {
      text: '参考',
      link: '/api/index',
      activeMatch: '/api/',
    },
    {
      text: pkg.version,
      items: [
        {
          text: 'Changelog',
          link: 'https://github.com/vuejs/vitepress/blob/main/CHANGELOG.md',
        },
        {
          text: 'Contributing',
          link: 'https://github.com/vuejs/vitepress/blob/main/.github/contributing.md',
        },
      ],
    },
  ]
}

function sidebarGuide(): DefaultTheme.SidebarItem[] {
  return [
    { text: '开始', link: 'index' },
    { text: '命令行接口', link: 'cli' },
    { text: 'Javascript API', link: 'javascript-api' },

    {
      text: '基础',
      items: [
        { text: 'Markdown Extensions', link: 'markdown' },
        { text: 'Asset Handling', link: 'asset-handling' },
        { text: 'Frontmatter', link: 'frontmatter' },
        { text: 'Using Vue in Markdown', link: 'using-vue' },
        { text: 'Internationalization', link: 'i18n' },
      ],
    },

    {
      text: '进阶',
      items: [
        { text: 'Using a Custom Theme', link: 'custom-theme' },
        { text: 'Extending the Default Theme', link: 'extending-default-theme' },
        { text: 'Build-Time Data Loading', link: 'data-loading' },
        { text: 'SSR Compatibility', link: 'ssr-compat' },
        { text: 'Connecting to a CMS', link: 'cms' },
      ],
    },

    { text: '配置选项', link: 'configuration-options' },
    { text: '插件开发', link: 'plugin-development' },
  ]
}

function sidebarApi(): DefaultTheme.SidebarItem[] {
  return [
    {
      text: 'Reference',
      items: [
        { text: 'Site Config', link: 'site-config' },
        { text: 'Frontmatter Config', link: 'frontmatter-config' },
        { text: 'Runtime API', link: 'runtime-api' },
        { text: 'CLI', link: 'cli' },
        {
          text: 'Default Theme',
          base: '/reference/default-theme-',
          items: [
            { text: 'Overview', link: 'config' },
            { text: 'Nav', link: 'nav' },
            { text: 'Sidebar', link: 'sidebar' },
            { text: 'Home Page', link: 'home-page' },
            { text: 'Footer', link: 'footer' },
            { text: 'Layout', link: 'layout' },
            { text: 'Badge', link: 'badge' },
            { text: 'Team Page', link: 'team-page' },
            { text: 'Prev / Next Links', link: 'prev-next-links' },
            { text: 'Edit Link', link: 'edit-link' },
            { text: 'Last Updated Timestamp', link: 'last-updated' },
            { text: 'Search', link: 'search' },
            { text: 'Carbon Ads', link: 'carbon-ads' },
          ],
        },
      ],
    },
  ]
}
