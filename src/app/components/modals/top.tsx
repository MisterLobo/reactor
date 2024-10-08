
import Button from '@mui/material/Button';
import Dialog, { DialogProps } from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import { useEffect, useState } from 'react';
import { Box, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from '@mui/material';
import { getSocket } from '../../lib/ws';
import { ContainerTopBody } from '@/bindings/ContainerTopBody';

type ContainerTopProps = {
  cid: string,
  name: string,
  visible: boolean,
  onClose: () => void,
  top: ContainerTopBody,
}

export default function ContainerTopDialog({ name, top, visible, onClose }: ContainerTopProps) {
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
      <DialogTitle id="scroll-dialog-title">Top { name }</DialogTitle>
      <DialogContent dividers={scroll === 'paper'}>
        <Box sx={{ flexGrow: 1 }} className="h-full">
          <TableContainer component={Paper}>
            <Table sx={{ minWidth: 650 }} aria-label="top">
              <TableHead>
                <TableRow>
                  {top.titles.map((t, i) => (
                    <TableCell key={i}>{ t }</TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {top.processes.map((p, i) => (
                  <TableRow key={i}>
                    <TableCell component="th" scope="row">{ p[0] }</TableCell>
                    <TableCell>{ p[1] }</TableCell>
                    <TableCell>{ p[2] }</TableCell>
                    <TableCell>{ p[3] }</TableCell>
                    <TableCell>{ p[4] }</TableCell>
                    <TableCell>{ p[5] }</TableCell>
                    <TableCell>{ p[6] }</TableCell>
                    <TableCell>{ p[7] }</TableCell>
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
