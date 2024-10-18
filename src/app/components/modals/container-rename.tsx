
import Button from '@mui/material/Button';
import Dialog, { DialogProps } from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import { useState } from 'react';
import { Box, TextField } from '@mui/material';
import Grid from '@mui/material/Grid2';
import { useForm } from 'react-hook-form';
import { invoke } from '@tauri-apps/api/core';
import { ContainerRenameParams } from '@/bindings/ContainerRenameParams';

type ContainerRenameProps = {
  cid: string,
  name?: string,
  visible: boolean,
  onClose: () => void,
}

type ContainerRenameFormProps = {
  new_name: string,
}

export default function ContainerRenameDialog({ cid, name, visible, onClose }: ContainerRenameProps) {
  const { register, formState, getValues } = useForm<ContainerRenameFormProps>();
  const [_open, setOpen] = useState(visible);
  const [scroll, _setScroll] = useState<DialogProps['scroll']>('paper');
  const [actionInProgress, setActionInProgress] = useState(false);

  const handleClose = () => {
    setOpen(false);
    onClose();
  };

  const rename = async () => {
    const newName = getValues('new_name');
    setActionInProgress(true);
    const params: ContainerRenameParams = {
      id: cid,
      new_name: newName,
    };
    const success = await invoke('container_rename', { params });
    if (success) {
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
      <DialogTitle id="scroll-dialog-title" sx={{ wordWrap: 'break-word' }}>Rename { name ?? cid }</DialogTitle>
      <DialogContent dividers={scroll === 'paper'}>
        <Box sx={{ flexGrow: 1 }}>
          <Grid container spacing={2}>
            <TextField
              autoFocus
              required
              fullWidth
              label="new name"
              {...register('new_name', { required: true })}
            />
          </Grid>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>Cancel</Button>
        <Button onClick={rename} disabled={!formState.isValid || actionInProgress}>Rename</Button>
      </DialogActions>
    </Dialog>
  );
}
