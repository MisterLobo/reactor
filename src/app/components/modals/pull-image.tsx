
import Button from '@mui/material/Button';
import Dialog, { DialogProps } from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import { useEffect, useState } from 'react';
import { Box, LinearProgress, TextField, Typography } from '@mui/material';
import Grid from '@mui/material/Grid2';
import { useForm } from 'react-hook-form';
import { ImagePullParams } from '../../lib/bindings/ImagePullParams';
import { invoke } from '@tauri-apps/api/core';
import { getSocket } from '../../lib/ws';
import { ImagePullProgress } from '@/bindings/ImagePullProgress';
import { ImagePullStatus } from '@/app/lib/types';

type PullImageProps = {
  repo?: string,
  visible: boolean,
  onClose: () => void,
}

type PullImageFormProps = {
  repo: string,
}

export default function PullImageDialog({ repo, visible, onClose }: PullImageProps) {
  const { register, formState, getValues } = useForm<PullImageFormProps>({
    defaultValues: {
      repo,
    },
  });
  const [progressState, setProgressState] = useState<ImagePullProgress>();
  const [_open, setOpen] = useState(visible);
  const [scroll, _setScroll] = useState<DialogProps['scroll']>('paper');
  const [actionInProgress, setActionInProgress] = useState(false);

  useEffect(() => {
    getSocket()
      .then(socket => {
        socket.on('image:pull', ({ data }: any) => {
          console.log('[pull]:', data);
        })
      })
    
  }, [])

  const handleClose = () => {
    setOpen(false);
    onClose();
  };

  const pullImage = async () => {
    const data = getValues();
    const [repo, tag] = data.repo.split(':');
    const params: ImagePullParams = {
      repo,
      tag,
    };
    setProgressState(undefined);
    setActionInProgress(true);
    const logs: string[] = await invoke('pull_image', { params });
    console.log('[pull#res]:', logs);
    for (const log of logs) {
      try {
        const jlog = JSON.parse(log) as ImagePullProgress;
        console.log('[log]:', jlog);
        setTimeout(() => {
          setProgressState(jlog);
        }, 500);
      } catch {}
    }
    setActionInProgress(false);
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
      <DialogTitle id="scroll-dialog-title">Pull image from repository</DialogTitle>
      <DialogContent dividers={scroll === 'paper'}>
        <Box sx={{ flexGrow: 1 }}>
          <Grid container spacing={2}>
            <TextField
              autoFocus
              required
              fullWidth
              label="image:tag"
              {...register('repo', { required: true })}
            />
          </Grid>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Box sx={{ width: '100%', mr: 1 }}>
              {(actionInProgress && Number(progressState?.progressDetail?.total) > 0) && <LinearProgress variant="buffer" value={Number(progressState?.progressDetail?.current ?? 0)} valueBuffer={Number(progressState?.progressDetail?.total ?? 0)} />}
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                {progressState?.status}
              </Typography>
            </Box>
            <Box sx={{ minWidth: 35 }}>
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                {(progressState?.status as ImagePullStatus === 'Downloading' && (progressState?.progressDetail?.total ?? 0) > 0) && `${Math.round(Number(progressState?.progressDetail?.current ?? 0)/Number(progressState?.progressDetail?.total ?? 0))}`}
              </Typography>
            </Box>
          </Box>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>Cancel</Button>
        <Button onClick={pullImage} disabled={!formState.isValid || actionInProgress}>Pull</Button>
      </DialogActions>
    </Dialog>
  );
}
