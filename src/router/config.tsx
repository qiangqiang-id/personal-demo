import { createBrowserRouter } from 'react-router-dom'
import Routes from '@/config/Routes'
import Layout from '@/layout'
import RichTextInsertBlock from '@/pages/RichTextInsertBlock'
import Screenshot from '@/pages/Screenshot'

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
    ],
  },
]

export default createBrowserRouter(routerData)
