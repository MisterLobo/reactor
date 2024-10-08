
import Button from '@mui/material/Button';
import Dialog, { DialogProps } from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import { useEffect, useState } from 'react';
import { Box, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from '@mui/material';
import { getSocket } from '../../lib/ws';
import { ContainerDiff } from '@/bindings/ContainerDiff';

type ContainerTopProps = {
  cid: string,
  name: string,
  visible: boolean,
  onClose: () => void,
  diffs?: ContainerDiff[],
}

export default function ContainerDiffDialog({ name, diffs, visible, onClose }: ContainerTopProps) {
  const [_open, setOpen] = useState(visible);
  const [scroll, _setScroll] = useState<DialogProps['scroll']>('paper');

  useEffect(() => {
    getSocket()
      .then(socket => {
        socket.on('container:top', ({ data }: any) => {
          console.log('[top]:', data);
        })
      })
    
  }, [])

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
      <DialogTitle id="scroll-dialog-title">Diff { name }</DialogTitle>
      <DialogContent dividers={scroll === 'paper'}>
        <Box sx={{ flexGrow: 1 }} className="h-full">
          <TableContainer component={Paper}>
            <Table sx={{ minWidth: 650 }} aria-label="top">
              <TableHead>
                <TableRow>
                  <TableCell>path</TableCell>
                  <TableCell>kind</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {diffs?.map((d, i) => (
                  <TableRow key={i}>
                    <TableCell component="th" scope="row">{ d.Kind }</TableCell>
                    <TableCell>{ d.Path }</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
}