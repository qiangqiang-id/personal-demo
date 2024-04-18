import { createBrowserRouter } from 'react-router-dom'
import Routes from '@/config/Routes'
import Layout from '@/layout'
import RichTextInsertBlock from '@/pages/RichTextInsertBlock'
import Screenshot from '@/pages/Screenshot'
import FragmentDownload from '@/pages/FragmentDownload'

const routerData = [
  {
    path: '/',
    element: <Layout />,
    children: [
      {
        ...Routes.RichTextInsertBlock,
        element: <RichTextInsertBlock />,
      },

      {
        ...Routes.ScreenShot,
        element: <Screenshot />,
      },

      {
        ...Routes.FragmentDownload,
        element: <FragmentDownload />,
      },
    ],
  },
]

export default createBrowserRouter(routerData)
