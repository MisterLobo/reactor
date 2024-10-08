
import Button from '@mui/material/Button';
import Dialog, { DialogProps } from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import { useEffect, useState } from 'react';

type ContainerExplorerProps = {
  cid: string,
  visible: boolean,
  onClose: () => void,
}

export default function ContainerExplorerDialog({ visible, onClose }: ContainerExplorerProps) {
  const [_open, setOpen] = useState(visible);
  const [scroll, _setScroll] = useState<DialogProps['scroll']>('paper');

  useEffect(() => {}, [])

  const handleClose = () => {
    setOpen(false);
    onClose();
  };

  return (
    <Dialog
      open={visible}
      onClose={handleClose}
      scroll={scroll}
      aria-labelledby="scroll-dialog-title"
      aria-describedby="scroll-dialog-description"
      fullWidth
      maxWidth="xl"
    >
      <DialogTitle id="scroll-dialog-title">Container Explorer</DialogTitle>
      <DialogContent dividers={scroll === 'paper'}>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>Cancel</Button>
        <Button disabled>Import</Button>
        <Button disabled>Export</Button>
      </DialogActions>
    </Dialog>
  );
}
