
import Button from '@mui/material/Button';
import Dialog, { DialogProps } from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import { useCallback, useState } from 'react';
import { LoadingButton } from '@mui/lab';
import { invoke } from '@tauri-apps/api/core';
import { ImagePruneResponse } from '@/bindings/ImagePruneResponse';
import { ContainerPruneResponse } from '@/bindings/ContainerPruneResponse';

type PullImageProps = {
  repo?: string,
  visible: boolean,
  onClose: () => void,
}

export default function PruneDialog({ visible, onClose }: PullImageProps) {
  const [_open, setOpen] = useState(visible);
  const [scroll, _setScroll] = useState<DialogProps['scroll']>('paper');
  const [actionInProgress, setActionInProgress] = useState(false);
  const [pruningContainers, setPruningContainers] = useState(false);
  const [pruningImages, setPruningImages] = useState(false);
  const [pruningVolumes, setPruningVolumes] = useState(false);
  const [pruningNetworks, setPruningNetworks] = useState(false);

  const handleClose = () => {
    setOpen(false);
    onClose();
  };

  const pruneContainers = useCallback(async () => {
    setPruningContainers(true);
    setActionInProgress(true);

    const { report } = await invoke('containers_prune') as ContainerPruneResponse;
    console.log('[prune#report]:', report);

    setPruningContainers(false);
    setActionInProgress(false);

    onClose();
  }, []);

  const pruneImages = useCallback(async () => {
    setPruningImages(true);
    setActionInProgress(true);

    const { report } = await invoke('images_prune') as ImagePruneResponse;
    console.log('[prune#report]:', report);

    setPruningImages(false);
    setActionInProgress(false);

    onClose();
  }, []);

  const pruneVolumes = useCallback(async () => {
    setActionInProgress(true);
    setPruningVolumes(true);
  }, []);

  const pruneNetworks = useCallback(async () => {
    setActionInProgress(true);
    setPruningNetworks(true);
  }, []);

  return (
    <Dialog
      open={visible}
      onClose={handleClose}
      scroll={scroll}
      aria-labelledby="scroll-dialog-title"
      aria-describedby="scroll-dialog-description"
      fullWidth
      maxWidth="xs"
    >
      <DialogTitle id="scroll-dialog-title">Prune</DialogTitle>
      <DialogContent dividers={scroll === 'paper'}>
        <div className="flex w-full items-center flex-col">
          <LoadingButton loading={pruningContainers} disabled={actionInProgress} onClick={pruneContainers}>Prune Containers</LoadingButton>
          <LoadingButton loading={pruningImages} disabled={actionInProgress} onClick={pruneImages}>Prune Images</LoadingButton>
          <LoadingButton loading={pruningVolumes} disabled={actionInProgress} onClick={pruneVolumes}>Prune Volumes</LoadingButton>
          <LoadingButton loading={pruningNetworks} disabled={actionInProgress} onClick={pruneNetworks}>Prune Networks</LoadingButton>
        </div>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>Cancel</Button>
        {/* <Button onClick={prune} disabled={!formState.isValid || actionInProgress}>Accept</Button> */}
      </DialogActions>
    </Dialog>
  );
}
