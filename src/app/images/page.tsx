import Toolbar from '@mui/material/Toolbar';
import ImageCard from '../components/image-card';
import { AppBar, Box, Grid2 as Grid, Typography } from '@mui/material';
import { Search, SearchIconWrapper, StyledInputBase } from '../components/client';
import SearchIcon from '@mui/icons-material/Search';
import { ImageSummary } from '../lib/bindings/ImageSummary';
import { useCallback, useEffect, useState } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { useSnackbar } from 'notistack';
import { ImagePruneResponse } from '@/bindings/ImagePruneResponse';
import { listen } from '@tauri-apps/api/event';
import { ImagePruneReport } from '@/bindings/ImagePruneReport';

export default function ImagesPage() {
  const { enqueueSnackbar } = useSnackbar();
  const [images, setImages] = useState<ImageSummary[]>([]);
  const [_pruneReport, setPruneReport] = useState<ImagePruneReport>();
  /* useEffect(() => {
    const subscribe = async () => {
      const subbed = await invoke('subscribe', { params: { id: 'sub' } }) as boolean;
      console.log('[subbed]:', subbed);
    }
    subscribe().catch(console.error)
  }, []) */
  const list_images = useCallback(async () => {
    const images: ImageSummary[] = await invoke('image_list', { params: { all: false }});
    // console.log('[i]:', images);
    
    setImages(images);
  }, []);

  const listeners = useCallback(async () => {
    await listen<ImagePruneResponse>('images-prune', ({ payload }) => {
      setPruneReport(payload.report as ImagePruneReport);
      list_images().catch(console.error);
    });
  }, []);

  useEffect(() => {
    list_images().catch(console.error);
  }, [enqueueSnackbar]);
  useEffect(() => {
    listeners().catch(console.error);
  }, []);

  return (
    <>
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
            Images ({ images.length })
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
        {images.map((c: ImageSummary) => (
          <ImageCard key={c.id} id={c.id} repo={c.repo} size={c.size} created={c.created} />
        ))}
        </Grid>
      </Box>
    </div>
    </>
  );
}