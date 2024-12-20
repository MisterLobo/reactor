
import Button from '@mui/material/Button';
import Dialog, { DialogProps } from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import { useState } from 'react';
import { TextField } from '@mui/material';
import Grid from '@mui/material/Grid2';
import { useForm } from 'react-hook-form';
type SettingsProps = {
  visible: boolean,
  onClose: () => void,
}

type SettingsFormProps = {
  hostname: string,
  port: number,
}

export default function SettingsDialog({ visible, onClose }: SettingsProps) {
  const { register, formState } = useForm<SettingsFormProps>({
    defaultValues: {
      hostname: 'http://localhost',
    },
  });
  const [_open, setOpen] = useState(visible);
  const [scroll, _setScroll] = useState<DialogProps['scroll']>('paper');

  const handleClose = () => {
    setOpen(false);
    onClose();
  };

  // const saveSettings = async (confirm = false) => {
  //   const data = getValues();
  //   setActionInProgress(true);
  //   console.log('[save]:', data);
  //   setActionInProgress(false);
    
  //   if (confirm) {
  //     handleClose();
  //   }
  // }

  return (
    <Dialog
      open={visible}
      onClose={handleClose}
      scroll={scroll}
      aria-labelledby="scroll-dialog-title"
      aria-describedby="scroll-dialog-description"
      fullWidth
      maxWidth="md"
    >
      <DialogTitle id="scroll-dialog-title">Settings</DialogTitle>
      <DialogContent dividers={scroll === 'paper'}>
        <Grid container spacing={2}>
          <TextField
            autoFocus
            required
            label="API hostname"
            className="w-full"
            sx={{ flex: 1, flexShrink: 1 }}
            {...register('hostname', { required: true, validate: v => /^https?:\/\/[a-zA-Z0-9]+(([\.\-\+]?[a-zA-Z0-9]+)*)(:[0-9]{2,5})?$/.test(v) })}
          />
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>Cancel</Button>
        <Button disabled={!formState.isValid} sx={{ ":disabled": { pointerEvents: 'none', opacity: 50 } }}>Apply</Button>
        <Button disabled={!formState.isValid} sx={{ ":disabled": { pointerEvents: 'none', opacity: 50 } }}>Confirm</Button>
      </DialogActions>
    </Dialog>
  );
}
