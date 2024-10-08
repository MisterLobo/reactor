import Toolbar from '@mui/material/Toolbar';
import NetworkCard from '../components/network-card';
import { AppBar, Grid2, Typography } from '@mui/material';
import { Search, SearchIconWrapper, StyledInputBase } from '../components/client';
import SearchIcon from '@mui/icons-material/Search';
import { useEffect, useState } from 'react';
import { invoke } from '@tauri-apps/api/tauri';
import { NetworkSummary } from '../lib/bindings/NetworkSummary';

export default function NetworksPage() {
  const [networks, setNetworks] = useState<NetworkSummary[]>([]);

  /* useEffect(() => {
    const subscribe = async () => {
      const subbed = await invoke('subscribe', { params: { id: 'sub' } }) as boolean;
      console.log('[subbed]:', subbed);
    }
    subscribe().catch(console.error)
  }, []) */
  useEffect(() => {
    const list_networks = async () => {
      const networks: NetworkSummary[] = await invoke('network_list');
      setNetworks(networks);
    }
    list_networks().catch(console.error)
  }, []);

  return (
    <div className="h-full">
      <AppBar
        position="fixed"
        sx={{
          width: { sm: `calc(100% - ${240}px)` },
          ml: { sm: `${240}px` },
        }}
      >
        <Toolbar>
          {/* <IconButton
            size="large"
            edge="start"
            color="inherit"
            aria-label="open drawer"
            sx={{ mr: 2 }}
          >
            <MenuIcon />
          </IconButton> */}
          <Typography
            variant="h6"
            noWrap
            component="div"
            sx={{ flexGrow: 1, display: { xs: 'none', sm: 'block' } }}
          >
            Networks ({ networks.length })
          </Typography>
          <Search>
            <SearchIconWrapper>
              <SearchIcon />
            </SearchIconWrapper>
            <StyledInputBase placeholder="Search..." inputProps={{ 'aria-label': 'search' }} />
          </Search>
        </Toolbar>
      </AppBar>
      <Grid2 container spacing={2}>
      {networks.map((c: NetworkSummary) => (
        <NetworkCard key={c.id} id={c.id as string} name={c.name as string} created={c.created as string} ports={c.ports as string[]} />
      ))}
      </Grid2>
    </div>
  );
}