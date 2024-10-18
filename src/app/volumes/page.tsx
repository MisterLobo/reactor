import Toolbar from '@mui/material/Toolbar';
import VolumeCard from '../components/volume-card';
import { AppBar, Box, Grid2 as Grid, Typography } from '@mui/material';
import { Search, SearchIconWrapper, StyledInputBase } from '../components/client';
import SearchIcon from '@mui/icons-material/Search';
import { useEffect, useState } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { VolumeSummary } from '../lib/bindings/VolumeSummary';

export default function VolumesPage() {
  const [volumes, setVolumes] = useState<VolumeSummary[]>([]);
  /* useEffect(() => {
    const subscribe = async () => {
      const subbed = await invoke('subscribe', { params: { id: 'sub' } }) as boolean;
      console.log('[subbed]:', subbed);
    }
    subscribe().catch(console.error)
  }, []) */
  useEffect(() => {
    const list_volumes = async () => {
      const volumes: VolumeSummary[] = await invoke('volume_list');
      setVolumes(volumes);
    }
    list_volumes().catch(console.error);
  }, [])

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
          <Typography
            variant="h6"
            noWrap
            component="div"
            sx={{ flexGrow: 1, display: { xs: 'none', sm: 'block' } }}
          >
            Volumes ({ volumes.length })
          </Typography>
          <Search>
            <SearchIconWrapper>
              <SearchIcon />
            </SearchIconWrapper>
            <StyledInputBase placeholder="Search..." inputProps={{ 'aria-label': 'search' }} />
          </Search>
        </Toolbar>
      </AppBar>
      <Box component="div" className="pb-5">
        <Grid container spacing={2}>
        {volumes.map((c: VolumeSummary) => (
          <VolumeCard key={c.name as string} id={c.id as string} name={c.name as string} mountPoint={c.mount_point as string} created={c.created as string} />
        ))}
        </Grid>
      </Box>
    </div>
  );
}