import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { createHashRouter, RouterProvider } from 'react-router-dom'
import HomePage from './app/page.tsx'
import ContainersPage from './app/containers/page.tsx'
import ImagesPage from './app/images/page.tsx'
import VolumesPage from './app/volumes/page.tsx'
import NetworksPage from './app/networks/page.tsx'
import ContainerDetails from './app/components/container.tsx'

const router = createHashRouter([
  {
    path: '/',
    element: <App />,
    children: [
      {
        path: '',
        index: true,
        element: <HomePage />,
      },
      {
        path: 'containers',
        element: <ContainersPage />,
        children: [
          {
            path: 'details',
            element: <ContainerDetails />
          }
        ],
      },
      {
        path: 'images',
        element: <ImagesPage />,
      },
      {
        path: 'volumes',
        element: <VolumesPage />,
      },
      {
        path: 'networks',
        element: <NetworksPage />,
      },
    ],
  },
])

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
)
