import Button from '@mui/material/Button';
import Dialog, { DialogProps } from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import { useState } from 'react';
import { Box, Grid2 as Grid, TextField } from '@mui/material';
import { useForm } from 'react-hook-form';
import { invoke } from '@tauri-apps/api/tauri';
import { open } from '@tauri-apps/api/dialog';
import { homeDir } from '@tauri-apps/api/path';
import { ImageBuildParams } from '../../lib/bindings/ImageBuildParams';
import { LoadingButton } from '@mui/lab';
import { isPermissionGranted, requestPermission, sendNotification } from '@tauri-apps/api/notification';

type PullImageProps = {
  visible: boolean,
  onClose: () => void,
}

type PullImageFormProps = {
  path: string,
  tag?: string,
}

export default function BuildImageDialog({ visible, onClose }: PullImageProps) {
  const { register, setValue, reset, getValues } = useForm<PullImageFormProps>();
  const [scroll, _setScroll] = useState<DialogProps['scroll']>('paper');
  const [actionInProgress, setActionInProgress] = useState(false);
  const [selectedPath, setSelectedPath] = useState<string>();

  const handleClose = () => {
    onClose();
  };
  const notify = async (title: string, body: string) => {
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
  };

  const buildImage = async () => {
    const values = getValues();
    console.log('[values]:', values);
    
    setActionInProgress(true);
    const params: ImageBuildParams = {
      path: selectedPath as string,
      tag: null,
      quiet: null,
    };
    if (values.tag) {
      params.tag = values.tag;
    }

    const statusOk = await invoke('build_image', { params });
    setActionInProgress(!statusOk);
    if (statusOk) {
      await notify('NOTICE', 'Image built successfully!')
    }
    reset();
  }

  const uploadFile = async () => {
    const selected = await open({
      multiple: false,
      defaultPath: await homeDir(),
    });
    if (selected) {
      setValue('path', selected as string);
      setSelectedPath(selected as string);
    }
  }

  return (
    <Dialog
      open={visible}
      onClose={handleClose}
      scroll={scroll}
      aria-labelledby="scroll-dialog-title"
      aria-describedby="scroll-dialog-description"
      fullWidth
      maxWidth="sm"
    >
      <DialogTitle id="scroll-dialog-title">Build image from path</DialogTitle>
      <DialogContent dividers={scroll === 'paper'}>
        <form>
          <Box sx={{ flexGrow: 1 }}>
            <Grid container spacing={2}>
              <TextField
                autoFocus
                fullWidth
                label="image tag (optional)"
                {...register('tag')}
              />
              <Button onClick={uploadFile}>{ selectedPath ?? 'Select Dockerfile' }</Button>
            </Grid>
          </Box>
        </form>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>Cancel</Button>
        <LoadingButton onClick={buildImage} sx={{ ':disabled': 'pointer-events-none cursor-not-allowed opacity-50' }} disabled={!selectedPath || actionInProgress} loading={actionInProgress}>Build Image</LoadingButton>
      </DialogActions>
    </Dialog>
  );
}
