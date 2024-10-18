
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
import { ImagePullResponse } from '../../lib/bindings/ImagePullResponse';
import { invoke } from '@tauri-apps/api/core';
import { getSocket } from '../../lib/ws';

type PullImageProps = {
  repo?: string,
  visible: boolean,
  onClose: () => void,
}

type PullImageFormProps = {
  repo: string,
}

export default function PullImageDialog({ repo, visible, onClose }: PullImageProps) {
  const { register, formState, getValues, reset } = useForm<PullImageFormProps>({
    defaultValues: {
      repo,
    },
  });
  const [progressTotal, setProgressTotal] = useState(0);
  const [progressCurrent, setProgressCurrent] = useState(0);
  const [progressStatus, _setProgressStatus] = useState('ready');
  const [progressId, _setProgressId] = useState<string>();
  const [_open, setOpen] = useState(visible);
  const [scroll, _setScroll] = useState<DialogProps['scroll']>('paper');
  const [actionInProgress, setActionInProgress] = useState(false);

  useEffect(() => {
    getSocket()
      .then(socket => {
        socket.on('image:pull', ({ data }: any) => {
          console.log('[pull]:', data);
          setProgressCurrent(data.progressDetail?.current);
          setProgressTotal(data.progressDetail?.total);
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
    setActionInProgress(true);
    const image: ImagePullResponse = await invoke('pull_image', { params });
    if (image.status === 'ok') {
      reset();
      setActionInProgress(false);
      handleClose();
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
          {actionInProgress &&
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Box sx={{ width: '100%', mr: 1 }}>
              {progressCurrent && progressTotal && <LinearProgress variant="buffer" value={progressCurrent} valueBuffer={progressTotal} />}
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                {`${progressId}: ${progressStatus}`}
              </Typography>
            </Box>
            <Box sx={{ minWidth: 35 }}>
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                {progressTotal > 0 ? `${Math.round(progressCurrent/progressTotal)}` : '0%'}
              </Typography>
            </Box>
          </Box>
          }
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>Cancel</Button>
        <Button onClick={pullImage} disabled={!formState.isValid || actionInProgress}>Pull</Button>
      </DialogActions>
    </Dialog>
  );
}
