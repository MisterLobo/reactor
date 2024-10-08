
import Button from '@mui/material/Button';
import Dialog, { DialogProps } from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import { useEffect, useState } from 'react';
import { Box, Checkbox, FormControlLabel, Grid2 as Grid, TextField } from '@mui/material';
import '@xterm/xterm/css/xterm.css';
import { useForm } from 'react-hook-form';
import { ContainerExecParams } from '@/bindings/ContainerExecParams';
import { invoke } from '@tauri-apps/api';
import { getSocket } from '../../../app/lib/ws';
import TerminalDialog from './terminal';

type ContainerExecProps = {
  cid: string,
  visible: boolean,
  onClose: () => void,
}

type ContainerExecFormProps = {
  id: string,
  cmd?: string,
  stdout?: boolean,
  stderr?: boolean,
  stdin?: boolean,
  tty?: boolean,
  detach?: boolean,
  stream?: boolean,
  socket?: boolean,
  env?: string,
  workdir?: string,
  demux?: boolean,
  user?: string,
  privileged?: boolean,
}

export default function ContainerExecDialog({ cid, visible, onClose }: ContainerExecProps) {
  const { register, getValues, formState, reset } = useForm<ContainerExecFormProps>({
    defaultValues: {
      id: cid,
    },
  });
  const [_open, setOpen] = useState(visible);
  const [scroll, _setScroll] = useState<DialogProps['scroll']>('paper');
  const [actionInProgress, setActionInProgress] = useState(false);
  const [termVisible, setTermVisible] = useState(false);
  const [execParams, setExecParams] = useState<ContainerExecParams>();

  useEffect(() => {
    getSocket()
      .then(socket => {
        socket
          .on('container:exec_die', async ({ id, response }: { id: string, response: any }) => {
            if (id === cid) {
              console.log('[exec:result]:', response);
            }
          })
      })
  }, [])

  const handleClose = () => {
    reset();
    setOpen(false);
    onClose();
  };

  const execRun = async () => {
    const values = getValues();
    console.log('[exec#params]:', values);
    
    const params = {
      id: cid,
      cmd: values.cmd,
      stdout: values.stdout,
      stdin: values.stdin,
      stderr: values.stderr,
      tty: values.tty,
      detach: values.detach,
      stream: values.stream,
      socket: values.socket,
      privileged: values.privileged,
      demux: values.demux,
      workdir: values.workdir,
      user: values.user,
      environment: values.env,
    } as ContainerExecParams;
    console.log('[exec#params]:', params);
    
    if (values.stdin && values.tty) {
      setExecParams(params);
      setTermVisible(true);
      return;
    }
    setActionInProgress(true);
    const statusOk = await invoke('container_run_exec', { params });
    if (statusOk) {
      setActionInProgress(false);
    }
  }

  return (
    <>
    <Dialog
      open={visible}
      onClose={handleClose}
      scroll={scroll}
      aria-labelledby="scroll-dialog-title"
      aria-describedby="scroll-dialog-description"
      fullWidth
      maxWidth="md"
    >
      <DialogTitle id="scroll-dialog-title">Exec Options</DialogTitle>
      <DialogContent dividers={scroll === 'paper'}>
        <Box component="form" sx={{ flex: 1 }}>
          <Grid container spacing={2}>
            <Grid size={12}>
              <TextField
                autoFocus
                required
                fullWidth
                label="command"
                {...register('cmd', { required: true })}
              />
            </Grid>
            <Grid size={12}>
              <TextField
                fullWidth
                label="env"
                {...register('env')}
              />
            </Grid>
            <Grid size={6}>
              <TextField
                fullWidth
                label="workdir"
                {...register('workdir')}
              />
            </Grid>
            <Grid size={6}>
              <TextField
                fullWidth
                label="user"
                {...register('user')}
              />
            </Grid>
            <Grid size={6}>
              <FormControlLabel control={<Checkbox {...register('stdout')} />} label="stdout" className="flex w-full" />
              <FormControlLabel control={<Checkbox {...register('stderr')} />} label="stderr" className="flex w-full" />
              <FormControlLabel control={<Checkbox {...register('stdin')} />} label="stdin" className="flex w-full" />
              <FormControlLabel control={<Checkbox {...register('tty')} />} label="tty" className="flex w-full" />
              {/* <FormControlLabel control={<Checkbox {...register('socket')} />} label="socket" className="flex w-full" /> */}
            </Grid>
            <Grid size={6}>
              <FormControlLabel control={<Checkbox {...register('detach')} />} label="detach" className="flex w-full" />
              {/* <FormControlLabel control={<Checkbox {...register('stream')} />} label="stream" className="flex w-full" />
              <FormControlLabel control={<Checkbox {...register('demux')} />} label="demux" className="flex w-full" /> */}
              <FormControlLabel control={<Checkbox {...register('privileged')} />} label="privileged" className="flex w-full" />
            </Grid>
          </Grid>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>Cancel</Button>
        <Button className="disabled:pointer-events-none disabled:opacity-50" onClick={execRun} disabled={!formState.isValid || actionInProgress}>Run</Button>
      </DialogActions>
    </Dialog>
    {termVisible && <TerminalDialog cid={cid} execParams={execParams} visible={termVisible} onClose={() => setTermVisible(false)} />}
    </>
  );
}
