
import Button from '@mui/material/Button';
import Dialog, { DialogProps } from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import { useEffect, useState } from 'react';
import { Box, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from '@mui/material';
import { Socket } from 'socket.io-client';
import { ContainerStats } from '@/app/lib/types';

type ContainerStatsProps = {
  cid: string,
  name: string,
  visible: boolean,
  onClose: () => void,
  stats: ContainerStats,
}

export default function ContainerStatsDialog({ cid, name, stats, visible, onClose }: ContainerStatsProps) {
  const [_open, setOpen] = useState(visible);
  const [scroll, _setScroll] = useState<DialogProps['scroll']>('paper');
  const [socket, _setSocket] = useState<Socket>();

  useEffect(() => {
    // socket?.removeAllListeners('stats');
    if (visible) {
      /* getSocket()
        .then(socket => {
          setSocket(socket);
          socket.on(`stats`, (stats: ArrayBuffer) => {
            const dec = new TextDecoder('utf-8');
            console.log('[stats]:', JSON.parse(dec.decode(stats)));
          })
        }); */
    }
    return () => {
      socket?.removeAllListeners('stats');
    }
  }, [cid, visible])

  const handleClose = () => {
    socket?.removeAllListeners('stats');
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
      <DialogTitle id="scroll-dialog-title">Stats { name }</DialogTitle>
      <DialogContent dividers={scroll === 'paper'}>
        <Box sx={{ flexGrow: 1 }}>
          <TableContainer component={Paper} className="my-2">
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>cpus</TableCell>
                  <TableCell>usage</TableCell>
                  <TableCell>usermode</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                <TableRow>
                  <TableCell>{ stats.cpu_stats.online_cpus }</TableCell>
                  <TableCell>{ stats.cpu_stats.cpu_usage.total_usage }</TableCell>
                  <TableCell>{ stats.cpu_stats.cpu_usage.usage_in_usermode }</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </TableContainer>
          <TableContainer component={Paper} className="my-2">
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>stats</TableCell>
                  <TableCell>usage</TableCell>
                  <TableCell>limit</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                <TableRow>
                  <TableCell></TableCell>
                  <TableCell>{ stats.memory_stats.usage }</TableCell>
                  <TableCell>{ stats.memory_stats.limit }</TableCell>
                </TableRow>
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
