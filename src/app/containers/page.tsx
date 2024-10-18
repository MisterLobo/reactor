import { useCallback, useEffect, useMemo, useState } from 'react';
import ContainerCard from '../components/container-card';
import Toolbar from '@mui/material/Toolbar';
import { AppBar, Box, Grid2 as Grid, Typography } from '@mui/material';
import { Search, SearchIconWrapper, StyledInputBase } from '../components/client';
import SearchIcon from '@mui/icons-material/Search';
import { invoke } from '@tauri-apps/api/core';
import { ContainerSummary } from '../lib/bindings/ContainerSummary';
import { useSearchParams } from 'react-router-dom';
import ContainerDetails from '../components/container';
import { listen } from '@tauri-apps/api/event';
import _ from 'lodash';

export default function ContainersPage() {
  const [searchParams] = useSearchParams();
  const [containers, setContainers] = useState<ContainerSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [changeName, _setChangeName] = useState<string>();
  const { showDetails, containerId } = useMemo(() => {
    const showDetails = searchParams.has('cid');
    const containerId = searchParams.get('cid') as string;
    return { showDetails, containerId };
  }, [searchParams]);

  const subscribe = useCallback(async () => {
    const subbed = await invoke('subscribe', { params: { id: 'sub', ns: '/sub' } }) as boolean;
    console.log('[containers] subbed:', subbed);
  }, []);
  const list_containers = useCallback(async () => {
    const containers: ContainerSummary[] = await invoke('container_list', { params: { all: true }});
    setContainers(containers);
    setLoading(false);
  }, [])
  const listeners = useCallback(async () => {
    await listen<{ id: string, name: string, state: string }>('sub-started', ({ payload }) => {
      if (payload.id === 'sub') {
        list_containers().catch(console.error);
      }
    });
    await listen<{ id: string, name: string, state: string }>('sub-stopped', ({ payload }) => {
      if (payload.id === 'sub') {
        list_containers().catch(console.error);
      }
    });
    await listen<{ id: string, name: string, state: string }>('sub-killed', ({ payload }) => {
      if (payload.id === 'sub') {
        list_containers().catch(console.error);
      }
    });
    await listen<{ id: string, name: string }>('sub-removed', ({ payload }) => {
      if (payload.id === 'sub') {
        list_containers().catch(console.error);
      }
    });
    await listen<{ id: string, name: string }>('sub-renamed', ({ payload }) => {
      if (payload.id === 'sub') {
        list_containers().catch(console.error);
      }
    });
  }, [list_containers])

  useEffect(() => {
    subscribe().catch(console.error)
  }, [])
  useEffect(() => {
    setLoading(true)
    Promise.all([
      listeners(),
      list_containers(),
    ]).catch(console.error);
  }, [changeName]);

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
            Containers ({ containers.length })
          </Typography>
          <Search>
            <SearchIconWrapper>
              <SearchIcon />
            </SearchIconWrapper>
            <StyledInputBase placeholder="Search..." inputProps={{ 'aria-label': 'search' }} />
          </Search>
        </Toolbar>
      </AppBar>
      {showDetails ?
      <ContainerDetails id={containerId} /> :
      <Box component="div" className="pb-5">
        <Grid container spacing={2}>
        {loading ? <p>loading</p> : containers?.map((c: ContainerSummary) => (
          <ContainerCard key={c.id} name={c.name} command={c.command} id={c.id} created={c.created as string} status={c.status as string} state={c.state as string} image={c.image} />
        ))}
        </Grid>
      </Box>}
    </>
  );
}