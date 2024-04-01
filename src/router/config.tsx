import { createBrowserRouter } from 'react-router-dom'
import Layout from '@/layout'

const routerData = [
  {
    path: '/',
    element: <Layout />,
    children: [],
  },
]

export default createBrowserRouter(routerData)
