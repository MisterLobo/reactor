import ContainerCard from './components/container-card';
import Toolbar from '@mui/material/Toolbar';
import { AppBar, Grid2, Typography } from '@mui/material';
import { Search, SearchIconWrapper, StyledInputBase } from './components/client';
import SearchIcon from '@mui/icons-material/Search';
import { invoke } from '@tauri-apps/api/tauri';
import { useCallback, useEffect, useState } from 'react';
import { ContainerSummary } from './lib/bindings/ContainerSummary';
import { listen } from '@tauri-apps/api/event';

export default function HomePage() {
  const [containers, setContainers] = useState<ContainerSummary[]>([]);

  /* const test = useCallback(async () => {
    let permissionGranted = await isPermissionGranted();
    if (!permissionGranted) {
      const permission = await requestPermission();
      permissionGranted = permission === 'granted';
    }
    if (permissionGranted) {
      sendNotification({
        title: 'TEST',
        body: 'This is a test',
      });
    }
  }, []); */
  const list_containers = useCallback(async () => {
    const containers: ContainerSummary[] = await invoke('container_list', { params: { all: false }});
    // console.log('[c]:', containers);
    
    setContainers(containers);
  }, [])
  const listeners = useCallback(async () => {
    const l1 = listen<{ id: string, name: string, state: string }>('sub-started', ({ payload }) => {
      if (payload.id === 'sub') {
        console.log('[start#payload]:', payload);
        list_containers()
      }
    });
    const l2 = listen<{ id: string, name: string, state: string }>('sub-stopped', ({ payload }) => {
      if (payload.id === 'sub') {
        console.log('[stop#payload]:', payload);
        list_containers()
      }
    })
    const l3 = listen<{ id: string, name: string, state: string }>('sub-killed', ({ payload }) => {
      if (payload.id === 'sub') {
        list_containers()
      }
    })
    const l4 = listen<{ id: string, name: string, state: string }>('sub-restarted', ({ payload }) => {
      console.log('[restart#payload]:', payload);
      if (payload.id === 'sub') {
        list_containers()
      }
    })
    const returns = await Promise.all([
      l1,
      l2,
      l3,
      l4,
    ]);
    return returns;
  }, []);
  const subscribe = useCallback(async () => {
    const subbed = await invoke('subscribe', { params: { id: 'sub', ns: 'sub' } }) as boolean;
    console.log('[sub] subbed:', subbed);
  }, []);
  useEffect(() => {
    
    subscribe().catch(console.error)
  }, [])
  useEffect(() => {
    const unlisteners = listeners();
    Promise.all([
      list_containers(),
    ]).catch(console.error);
    return () => {
      unlisteners
        .then((p) => Promise.all(p))
        .catch(console.error);
    };
  }, []);

  return (
    <>
      <AppBar
        position="fixed"
        sx={{
          width: { sm: `calc(100% - ${240}px)` },
          ml: { sm: `${240}px` },
        }}
      >
        <Toolbar>
          <Typography
            variant="h6"
            noWrap
            component="div"
            sx={{ flexGrow: 1, display: { xs: 'none', sm: 'block' } }}
          >
            Dashboard ({ containers.length })
          </Typography>
          <Search>
            <SearchIconWrapper>
              <SearchIcon />
            </SearchIconWrapper>
            <StyledInputBase placeholder="Search..." inputProps={{ 'aria-label': 'search' }} />
          </Search>
        </Toolbar>
      </AppBar>
      <div className="w-full">
        <Grid2 container spacing={2}>
        {containers?.map((c: ContainerSummary) => (
          <ContainerCard key={c.id} name={c.name} command={c.command} id={c.id} created={c.created as string} status={c.status as string} state={c.state as string} image={c.image} />
        ))}
        </Grid2>
      </div>
    </>
  );
}
