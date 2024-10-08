import Toolbar from '@mui/material/Toolbar';
import ImageCard from '../components/image-card';
import { AppBar, Grid2, Typography } from '@mui/material';
import { Search, SearchIconWrapper, StyledInputBase } from '../components/client';
import SearchIcon from '@mui/icons-material/Search';
import { ImageSummary } from '../lib/bindings/ImageSummary';
import { useEffect, useState } from 'react';
import { invoke } from '@tauri-apps/api/tauri';
import { useSnackbar } from 'notistack';

export default function ImagesPage() {
  const { enqueueSnackbar } = useSnackbar();
  const [images, setImages] = useState<ImageSummary[]>([]);
  /* useEffect(() => {
    const subscribe = async () => {
      const subbed = await invoke('subscribe', { params: { id: 'sub' } }) as boolean;
      console.log('[subbed]:', subbed);
    }
    subscribe().catch(console.error)
  }, []) */
  useEffect(() => {
    const list_images = async () => {
      const images: ImageSummary[] = await invoke('image_list', { params: { all: false }});
      // console.log('[i]:', images);
      
      setImages(images);
    }
    list_images().catch(console.error);
  }, [enqueueSnackbar]);

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
      <Grid2 container spacing={2}>
      {images.map((c: ImageSummary) => (
        <ImageCard key={c.id} id={c.id} repo={c.repo} size={c.size} created={c.created} />
      ))}
      </Grid2>
    </div>
    </>
  );
}