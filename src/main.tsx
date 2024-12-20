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
import { appDataDir } from '@tauri-apps/api/path'
import { Client, Store, Stronghold } from '@tauri-apps/plugin-stronghold'

const initStronghold = async () => {
  const vaultPath = `${await appDataDir()}/vault.hold`;
  console.log('[vault]:', vaultPath);
  
  const vaultPassword = 'password';
  const stronghold = await Stronghold.load(vaultPath, vaultPassword);

  let client: Client;
  const clientName = 'reactor';
  try {
    client = await stronghold.loadClient(clientName);
  } catch {
    client = await stronghold.createClient(clientName);
  }

  return {
    stronghold,
    client,
  };
}
const insertRecord = async (store: Store, key: string, value: string) => {
  const data = Array.from(new TextEncoder().encode(value));
  await store.insert(key, data);
}
const getRecord = async (store: Store, key: string) => {
  const data = await store.get(key) as Uint8Array;
  return new TextDecoder().decode(new Uint8Array(data));
}

const init = async () => {
  const { stronghold, client } = await initStronghold();

  const store = client.getStore();
  const key = 'my_key';

  insertRecord(store, key, 'secret');

  const value = await getRecord(store, key);
  console.log('[stronghold#value]:', value);

  await stronghold.save();
}

init();

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
