
import Button from '@mui/material/Button';
import Dialog, { DialogProps } from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import { useEffect, useRef, useState } from 'react';
import { Box } from '@mui/material';
import { invoke } from '@tauri-apps/api/core';
import { Socket } from 'socket.io-client';
import { ContainerLogsResponse } from '@/bindings/ContainerLogsResponse';
import { Terminal } from '@xterm/xterm';

type ContainerLogsProps = {
  cid: string,
  visible: boolean,
  onClose: () => void,
}

export default function ContainerLogsDialog({ cid, visible, onClose }: ContainerLogsProps) {
  const [_open, setOpen] = useState(visible);
  const [scroll, _setScroll] = useState<DialogProps['scroll']>('paper');
  const [socket, _setSocket] = useState<Socket>();
  const termRef = useRef(null);
  const [terminal, setTerminal] = useState<Terminal>();
  const [logs, setLogs] = useState<string>();

  useEffect(() => {
    setTerminal(new Terminal({
      cursorBlink: true,
      cursorStyle: 'block',
      cols: 120,
      rows: 40,
      allowProposedApi: true
    }));
  }, [])

  useEffect(() => {
    if (terminal) {
      terminal.open(termRef.current as any);
      terminal.write(logs as string);
    }
  }, [terminal, logs]);

  useEffect(() => {
    // socket?.removeAllListeners('stats');
    /* if (visible) {
      getSocket()
        .then(socket => {
          setSocket(socket);
          socket.on(`logs`, (stats: ArrayBuffer) => {
            const dec = new TextDecoder('utf-8');
            console.log('[logs]:', JSON.parse(dec.decode(stats)));
          })
        });
    }
    return () => {
      socket?.removeAllListeners('logs');
    } */
    const getLogs = async () => {
      const { logs } = await invoke('container_logs', { params: { id: cid }}) as ContainerLogsResponse;
      // console.log('[logs]:', logs);
      setLogs(logs as string);
    }
    getLogs().catch(console.error);
  }, [cid, visible])

  const handleClose = () => {
    socket?.removeAllListeners('logs');
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
      <DialogTitle id="scroll-dialog-title">Logs</DialogTitle>
      <DialogContent dividers={scroll === 'paper'}>
        <Box ref={termRef}>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
}
