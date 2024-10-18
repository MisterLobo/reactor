'use client'

import './globals.css';
import '@fontsource/roboto/300.css';
import '@fontsource/roboto/400.css';
import '@fontsource/roboto/500.css';
import '@fontsource/roboto/700.css';
import theme from '../theme';
import { Alert, AlertTitle, Button, CssBaseline, ThemeProvider } from '@mui/material';
import Box from '@mui/material/Box';
import Drawer from '@mui/material/Drawer';
import Toolbar from '@mui/material/Toolbar';
import List from '@mui/material/List';
import Divider from '@mui/material/Divider';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Lan from '@mui/icons-material/Lan';
import RocketLaunch from '@mui/icons-material/RocketLaunch';
import Router from '@mui/icons-material/Router';
import Settings from '@mui/icons-material/Settings';
import Source from '@mui/icons-material/Source';
import Storage from '@mui/icons-material/Storage';
import { SpeedDialSection } from './components/client';
import { useSnackbar } from 'notistack';
import { useCallback, useEffect, useState } from 'react';
import Home from '@mui/icons-material/Home';
import SettingsDialog from './components/modals/settings';
import ManageConnectionsDialog from './components/modals/connections';
import { listen } from '@tauri-apps/api/event';
import { invoke } from '@tauri-apps/api/core';
import { isPermissionGranted, requestPermission, sendNotification } from '@tauri-apps/plugin-notification';

const drawerWidth = 240;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const links: Record<string, { path: string, icon?: JSX.Element, action?: () => void, }> = {
    dashboard: { path: '#', icon: <Home className="mr-2" />, },
    containers: { path: '#containers', icon: <RocketLaunch className="mr-2" />, },
    images: { path: '#images', icon: <Source className="mr-2" />, },
    volumes: { path: '#volumes', icon: <Storage className="mr-2" />, },
    networks: { path: '#networks', icon: <Lan className="mr-2" />, },
  };
  const systemLinks: Record<string, { path?: string, icon?: JSX.Element, action: () => void, }> = {
    connections: { icon: <Router className="mr-2" />, action: () => setShowConnectionsModal(true) },
    settings: { icon: <Settings className="mr-2" />, action: () => setShowSettingsModal(true) },
  };
  const { enqueueSnackbar } = useSnackbar();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [_isClosing, setIsClosing] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showConnectionsModal, setShowConnectionsModal] = useState(false);
  const [error, setError] = useState<string>();
  
  const notify = useCallback(async (title: string, body: string) => {
    let permissionGranted = await isPermissionGranted();
    if (!permissionGranted) {
      const permission = await requestPermission();
      permissionGranted = permission === 'granted';
    }
    if (permissionGranted) {
      sendNotification({
        title,
        body,
      });
    }
  }, []);
  const listeners = useCallback(async () => {
    await listen<{ ok: string, error?: string }>('ping', ({ payload }) => {
      // console.log('[ping]:', payload);
      if (!payload.ok) {
        setError(payload.error)
        notify('Error', payload.error as string)
      }
    })
    await listen<{ id: string }>('subbed', ({ payload }) => {
      console.log('[sub]:', payload);
    })
    await listen<{ error?: string, status?: string }>('apierror', ({ payload }) => {
      console.log('[error]:', payload);
      setError(payload.error)
      notify('Error', payload.error as string)
    })
    const started = listen<{ name: string }>('sub-started', ({ payload }) => {
      // test('Reactor', `Container started: ${payload?.name}`)
      enqueueSnackbar({
        message: `Container started: ${payload?.name}`,
      })
    });
    const stopped = listen<{ id: string, name: string, state: string }>('sub-stopped', ({ payload }) => {
      // test('Reactor', `Container stopped: ${payload?.name}`)
      enqueueSnackbar({
        message: `Container stopped: ${payload?.name}`,
      })
    });
    const killed = listen<{ id: string, name: string, state: string }>('sub-killed', ({ payload }) => {
      // test('Reactor', `Container started: ${payload?.name}`)
      enqueueSnackbar({
        message: `Container killed: ${payload?.name}`,
      })
    });
    const removed = listen<{ id: string, name: string }>('sub-removed', ({ payload }) => {
      // test('Reactor', `Container removed: ${payload?.name}`)
      enqueueSnackbar({
        message: `Container removed: ${payload.name}`,
      })
    });
    const paused = listen<{ id: string, name: string }>('sub-paused', ({ payload }) => {
      notify('Reactor', `Container paused: ${payload?.name}`)
      enqueueSnackbar({
        message: `Container paused: ${payload.name}`,
      })
    });
    const unpaused = listen<{ id: string, name: string }>('sub-unpaused', ({ payload }) => {
      // test('Reactor', `Container unpaused: ${payload?.name}`)
      enqueueSnackbar({
        message: `Container unpaused: ${payload.name}`,
      })
    });
    const restarted = listen<{ id: string, name: string }>('sub-restarted', ({ payload }) => {
      // test('Reactor', `Container restarted: ${payload?.name}`)
      enqueueSnackbar({
        message: `Container restarted: ${payload.name}`,
      })
    });

    const unlisteners = await Promise.all([
      started,
      stopped,
      killed,
      removed,
      paused,
      unpaused,
      restarted,
    ]);
    return () => {
      Promise.all(unlisteners).catch(console.error);
    }
  }, [notify])
  const subscribe = useCallback(async () => {
    await invoke('subscribe', { params: { id: 'sub', ns: 'sub' } }) as boolean;
  }, [])

  /* const connectSocket = useCallback(async () => {
    await invoke('connect_socket');
  }, []) */
  useEffect(() => {
    Promise.all([
      notify('TEST', 'test'),
      subscribe(),
      listeners(),
    ]).catch(console.error)
  }, [subscribe, listeners, notify])

  const handleDrawerClose = () => {
    setIsClosing(true);
    setMobileOpen(false);
  };

  const handleDrawerTransitionEnd = () => {
    setIsClosing(false);
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ display: 'flex' }} className="h-full">
        <Box
          component="nav"
          sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}
        >
          <Drawer
            variant="temporary"
            open={mobileOpen}
            onTransitionEnd={handleDrawerTransitionEnd}
            onClose={handleDrawerClose}
            ModalProps={{
              keepMounted: true,
            }}
            sx={{
              display: { xs: 'block', sm: 'none' },
              '& .MuiDrawer-paper': { width: drawerWidth, boxSizing: 'border-box' },
            }}
          >
            <Toolbar />
            <Box sx={{ overflow: 'auto' }}>
              <List>
                {Object.entries(links).map(([key, value]) => (
                  <ListItem key={key} disablePadding>
                    <ListItemButton href={value.path}>
                      <ListItemIcon>
                        {value.icon}
                      </ListItemIcon>
                      <ListItemText primary={key} className="capitalize" />
                    </ListItemButton>
                  </ListItem>
                ))}
              </List>
              <Divider />
              <List>
                {Object.entries(systemLinks).map(([key, value]) => (
                  <ListItem key={key} disablePadding>
                    <ListItemButton onClick={() => value.action()}>
                      <ListItemIcon>
                        {value.icon}
                      </ListItemIcon>
                      <ListItemText primary={key} className="capitalize" />
                    </ListItemButton>
                  </ListItem>
                ))}
              </List>
            </Box>
          </Drawer>
          <Drawer
            variant="permanent"
            sx={{
              display: { xs: 'none', sm: 'block' },
              '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
            }}
            open
          >
            <Toolbar />
            <Box sx={{ overflow: 'auto' }}>
              <List>
                {Object.entries(links).map(([key, value]) => (
                  <ListItem key={key} disablePadding>
                    <ListItemButton href={value.path}>
                      <ListItemIcon>
                        {value.icon}
                      </ListItemIcon>
                      <ListItemText primary={key} className="capitalize" />
                    </ListItemButton>
                  </ListItem>
                ))}
              </List>
              <Divider />
              <List>
                {Object.entries(systemLinks).map(([key, value]) => (
                  <ListItem key={key} disablePadding>
                    <ListItemButton onClick={() => value.action()}>
                      <ListItemIcon>
                        {value.icon}
                      </ListItemIcon>
                      <ListItemText primary={key} className="capitalize" />
                    </ListItemButton>
                  </ListItem>
                ))}
              </List>
            </Box>
          </Drawer>
        </Box>
        <Box component="main" sx={{ flexGrow: 1, p: 3 }} className="mt-16 overflow-auto">
          {error && <Alert
            severity="error"
            action={
              <Button color="inherit" size="small">Retry</Button>
            }
          >
            <AlertTitle>Error</AlertTitle>
            { error }
          </Alert>}
          {children}
        </Box>
        <SpeedDialSection />
        <SettingsDialog visible={showSettingsModal} onClose={() => setShowSettingsModal(false)} />
        <ManageConnectionsDialog visible={showConnectionsModal} onClose={(() => setShowConnectionsModal(false))} />
      </Box>
    </ThemeProvider>
  );
}
