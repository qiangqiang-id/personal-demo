import { createBrowserRouter } from 'react-router-dom'
import Routes from '@/config/Routes'
import Layout from '@/layout'
import RichTextInsertBlock from '@/pages/RichTextInsertBlock'
import ScreenShot from '@/pages/ScreenShot'

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
        element: <ScreenShot />,
      },
    ],
  },
]

export default createBrowserRouter(routerData)
