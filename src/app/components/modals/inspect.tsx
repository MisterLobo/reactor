import { Button, Dialog, DialogActions, DialogContent, DialogProps, DialogTitle } from '@mui/material'
import JsonView from '@uiw/react-json-view';
import { vscodeTheme } from '@uiw/react-json-view/vscode';
import { useState } from 'react';

type InspectObjectProps = {
  json: Record<string, any>,
  visible: boolean,
  onClose: () => void,
}

export default function InspectObjectDialog({ json, visible, onClose }: InspectObjectProps) {
  const [_open, setOpen] = useState(visible);
  const [scroll, _setScroll] = useState<DialogProps['scroll']>('paper');

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
      maxWidth="lg"
    >
      <DialogTitle>Inspect</DialogTitle>
      <DialogContent>
        <JsonView value={json} style={vscodeTheme} className="break-all" />
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>Close</Button>
      </DialogActions>
    </Dialog>
  )
}