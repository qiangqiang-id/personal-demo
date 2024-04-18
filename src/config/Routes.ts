const Routes = {
  /** 富文本插块 */
  RichTextInsertBlock: {
    key: 'richTextInsertBlock',
    path: '/rich-text-insert-block',
    label: '富文本插块',
  },

  /** 截屏 */
  ScreenShot: {
    key: 'screenShot',
    path: '/screen-shot',
    label: '截屏',
  },

  /** 分片下载 */
  FragmentDownload: {
    key: 'fragmentDownload',
    path: '/fragment-download',
    label: '分片下载',
  },
} as const

export default Routes
