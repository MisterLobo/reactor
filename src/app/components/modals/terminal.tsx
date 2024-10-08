
import Button from '@mui/material/Button';
import Dialog, { DialogProps } from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import { useEffect, useRef, useState } from 'react';
import { Box } from '@mui/material';
import { Terminal } from '@xterm/xterm';
import '@xterm/xterm/css/xterm.css';
import { ContainerExecParams } from '@/bindings/ContainerExecParams';
import { invoke } from '@tauri-apps/api';

type TerminalProps = {
  cid: string,
  visible: boolean,
  onClose: () => void,
  execParams?: ContainerExecParams,
}

export default function TerminalDialog({ cid, execParams, visible, onClose }: TerminalProps) {
  const [_open, setOpen] = useState(visible);
  const [scroll, _setScroll] = useState<DialogProps['scroll']>('paper');
  const termRef = useRef(null);
  const [terminal, setTerminal] = useState<Terminal>();
  const [command, setCommand] = useState('');
  const pmt = useRef('root@localhost:/$ ');
  /* const command = useMemo(() => {
    return execParams?.cmd?.join(' ');
  }, [execParams]) */

  useEffect(() => {
    setTerminal(new Terminal({
      cursorBlink: true,
      cursorStyle: 'block',
      cols: 150,
      rows: 40,
      allowProposedApi: true
    }));
  }, [])

  useEffect(() => {
    if (terminal) {
      /* getSocket()
        .then(socket => {
          socket.on('exec:result', async ({ id, payload }: { id: string, payload: any }) => {
            console.log('[exec:result]:', id, payload);
          })
        }) */
      terminal.open(termRef.current as any);
      prompt(terminal);
      terminal.clear();
      /* terminal.onKey(({ key }, ev) => {
        console.log('[key]:', key, key.charCodeAt(0));
        if (key.charCodeAt(0) === 13) {
          terminal.write('\n');
        } else if (key.charCodeAt(0) === 127) {
          terminal.write('\x1b[2K\r\u001b[32mscm> \u001b[37m');
        }
        terminal.write(key);
      }) */
      terminal.onData((a1, a2) => {
        console.log('[data]:', a1, a2);
        switch(a1) {
          case '\u0003': // Ctrl+C
            terminal.write('^C');
            break;
          case '\u007F': // Backspace (DEL)
            if (terminal.buffer.normal.length > pmt.current.length) {
              terminal.write('\b \b');
              if (command.length > 0) {
                setCommand(command.substring(0, command.length - 1));
              }
            }
            break;
          case '\r': // Enter
            terminal.write('\r');
            break;
          case '\x1b[D': // Left arrow key
            if (terminal.buffer.active.length > pmt.current.length) {
              console.log('left');
              terminal.write('\x9BD')
            }
            break;
          case '\x1b[C': // Right arrow key
          if (terminal.buffer.active.length > pmt.current.length) {
              console.log('right');
              terminal.write('\x9BC')
            }
            break;
          case '\x1b[A': // Up arrow key
            console.log('up');
            break;
          case '\x1b[B': // Down arrow key
            console.log('down');
            break;
          default:
            terminal.write(a1)
        }
      })
      // terminal.write(command as string);
    }
  }, [terminal])

  useEffect(() => {
    if (cid && terminal) {
      invoke('container_run_exec', { params: execParams }).catch(console.error);
    }
  }, [cid, terminal])


  const prompt = (term: Terminal) => {
    setCommand('');
    term.write(`\r\n${pmt.current}`);
  }


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
      sx={{ height: '100vh' }}
    >
      <DialogTitle id="scroll-dialog-title">Terminal</DialogTitle>
      <DialogContent dividers={scroll === 'paper'}>
        <Box ref={termRef}>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>Cancel</Button>
      </DialogActions>
    </Dialog>
  );
}
