import Button from '@mui/material/Button';
import Dialog, { DialogProps } from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Accordion, AccordionActions, AccordionDetails, AccordionSummary, Box, Checkbox, FormControlLabel, IconButton, TextField } from '@mui/material';
import Grid from '@mui/material/Grid2';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { ContainerRunParams } from '../../lib/bindings/ContainerRunParams';
import { invoke } from '@tauri-apps/api/core';
import { ContainerRunResponse } from '../../lib/bindings/ContainerRunResponse';
import { LoadingButton } from '@mui/lab';
import { PortBinding } from '@/app/lib/types';
import { Delete } from '@mui/icons-material';

type RunContainerFormProps = {
  image: string,
  name?: string,
  command?: string,
  tty?: boolean,
  stdout?: boolean,
  stdin?: boolean,
  stderr?: boolean,
  interactive?: boolean,
  privileged?: boolean,
  exposeAllPorts?: boolean,
  detach?: boolean,
  autoRemove?: boolean,
  ports?: Record<string, number>[],
  user?: string,
  env?: string,
  workingDir?: string,
  shell?: string,
}

type MountPointFormProps = {
  src?: string,
  dest?: string,
  onSave: (src: string, dest: string) => void,
  onRemove: (src: string) => void,
}

type PortBindingFormProps = {
  port: string,
  bindings: string,
  portBindings: PortBinding[],
  onSave: (port: string, binding: string) => void,
  onRemove: (port: string) => void,
}

type RunContainerProps = Partial<RunContainerFormProps> & {
  visible: boolean,
  onClose: () => void,
}

function PortBindingForm(props: PortBindingFormProps) {
  const [busy, _setBusy] = useState(false);
  const [bindings, setBindings] = useState<string>();
  const { register } = useForm<PortBindingFormProps>({
    defaultValues: {
      port: props.port,
    },
  });
  useEffect(() => {
    setBindings(props.portBindings.map(b => `${b.HostIp}:${b.HostPort}`).join(','));
  }, [props.bindings]);

  const bindingsOnBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setBindings(value);
  }

  return (
    <>
      <TextField
        label="Source"
        sx={{ mb: 2 }}
        {...register('port')}
      />
      <TextField
        label="Destination"
        sx={{ mb: 2 }}
        value={bindings}
        onBlur={bindingsOnBlur}
      />
      <IconButton className="items-center" aria-label="remove" onClick={() => props.onRemove(props.port)} disabled={busy} size="large">
        <Delete color={busy ? 'disabled' : 'error'} />
      </IconButton>
    </>
  )
}

function MountPointForm(props: MountPointFormProps) {
  const [busy, _setBusy] = useState(false);
  const { register } = useForm<MountPointFormProps>({
    defaultValues: {
      src: props.src,
      dest: props.dest,
    },
  });
  return (
    <>
      <TextField
        label="Source"
        sx={{ mb: 2 }}
        {...register('src')}
      />
      <TextField
        label="Destination"
        sx={{ mb: 2 }}
        {...register('dest')}
      />
      <IconButton className="items-center" aria-label="remove" onClick={() => props.onRemove(props.src as string)} disabled={busy} size="large">
        <Delete color={busy ? 'disabled' : 'error'} />
      </IconButton>
    </>
  )
}

export default function RunContainerDialog({ image, name, visible, onClose }: RunContainerProps) {
  const { register, formState, getValues } = useForm<RunContainerFormProps>({
    defaultValues: {
      image,
      name,
    },
  });
  const mountPointForm = useForm<MountPointFormProps>();
  const portBindingForm = useForm<PortBindingFormProps>();
  const [_open, setOpen] = useState(visible);
  const [scroll, _setScroll] = useState<DialogProps['scroll']>('paper');
  const [actionInProgress, setActionInProgress] = useState(false);
  const [mountPoints, setMountPoints] = useState<Map<string, string>>(new Map());
  const [portBindings, setPortBindings] = useState<Map<string, PortBinding[]>>(new Map());

  const handleClose = () => {
    setOpen(false);
    onClose();
  };

  const formOnSubmit = async () => {
    const data = getValues();
    console.log('[data]:', data);
    setActionInProgress(true);
    const params = {
      image: data.image,
      name: data.name || null,
      cmd: data.command || null,
      detach: data.detach ?? false,
      stderr: data.stderr ?? false,
      stdin: data.stdin ?? false,
      stdout: data.stdout ?? false,
      tty: data.tty ?? false,
      expose_all_ports: data.exposeAllPorts ?? false,
      interactive: data.interactive ?? false,
      auto_remove: data.autoRemove ?? false,
      env: data.env?.split(',') ?? [],
      user: data.user || null,
      working_dir: data.workingDir || null,
      shell: data.shell ?? null,
    } as ContainerRunParams;
    console.log('[params]:', params);
    const res: ContainerRunResponse = await invoke('container_run', { params });
    console.log('[res]:', res);
    
    setActionInProgress(false);

    if (res.id) {
      handleClose();
    }
  }

  const addMountPoint = async () => {
    const values = mountPointForm.getValues();
    mountPointForm.resetField('src');
    mountPointForm.resetField('dest');
    mountPointForm.setValue('src', undefined);
    mountPointForm.setValue('dest', undefined);
    const src = values.src as string;
    const dest = values.dest as string;
    setMountPoints(old => {
      const map = new Map(old);
      map.set(src, dest);
      return map;
    });
  }

  /* const addPortBindings = () => {
    const values = portBindingForm.getValues();
    portBindingForm.resetField('port');
    portBindingForm.resetField('bindings');
    const port = values.port;
    const portBindings = getPortBindings(values.bindings);
    setPortBindings(old => {
      const map = new Map(old);
      map.set(port, portBindings);
      return map;
    });
  } */

  const onSaveMountPoint = (src: string, dest: string) => ({ src, dest })
  const onRemoveMountPoint = (src: string) => {
    setMountPoints(old => {
      const map = new Map(old);
      map.delete(src);
      return map;
    });
  }

  const onSavePortBinding = (port: string, bindings: string) => {
    const portBindings = getPortBindings(bindings);
    return { port, portBindings };
  }
  const onRemovePortBinding = (port: string) => {
    setPortBindings(old => {
      const map = new Map(old);
      map.delete(port);
      return map;
    });
  }

  // const onSavePorts = () => {}

  const getBindings = (portBindings: PortBinding[]) => portBindings.map(p => `${p.HostIp}:${p.HostPort}`).join(',');
  const getPortBindings = (bindings: string) => {
    const items = bindings.split(',');
    const portBindings = items.map(item => {
      const [hostIp, hostPort] = item.split(':');
      return {
        HostIp: hostIp,
        HostPort: hostPort,
      } as PortBinding;
    })
    return portBindings;
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
      <DialogTitle id="scroll-dialog-title">Run Container</DialogTitle>
      <DialogContent dividers={scroll === 'paper'}>
        <form className="space-y-5">
          <Box sx={{ flexGrow: 1 }}>
            <Grid container spacing={2}>
              <Grid size={6}>
                <TextField
                  autoFocus
                  required
                  fullWidth
                  label="Image"
                  {...register('image', { required: true })}
                />
              </Grid>
              <Grid size={6}>
                <TextField
                  fullWidth
                  label="Name"
                  {...register('name')}
                />
              </Grid>
              <Grid size={6}>
                <FormControlLabel control={<Checkbox {...register('tty')} />} label="tty" className="flex w-full" />
                <FormControlLabel control={<Checkbox {...register('stdout')} />} label="stdout" className="flex w-full" />
                <FormControlLabel control={<Checkbox {...register('stdin')} />} label="stdin" className="flex w-full" />
                <FormControlLabel control={<Checkbox {...register('stderr')} />} label="stderr" className="flex w-full" />
                <FormControlLabel control={<Checkbox {...register('interactive')} />} label="interactive" className="flex w-full" />
              </Grid>
              <Grid size={6}>
                <FormControlLabel control={<Checkbox {...register('detach')} />} label="detach" className="flex w-full" />
                <FormControlLabel control={<Checkbox {...register('autoRemove')} />} label="auto remove" className="flex w-full" />
                <FormControlLabel control={<Checkbox {...register('exposeAllPorts')} />} label="expose all ports" className="flex w-full" />
                <FormControlLabel control={<Checkbox {...register('privileged')} />} label="privileged" className="flex w-full" />
              </Grid>
              <Grid size={12}>
                <TextField
                  fullWidth
                  label="Command"
                  {...register('command')}
                  sx={{ mt: 2 }}
                />
              </Grid>
              <Grid size={12}>
                <TextField
                  fullWidth
                  label="Environment"
                  placeholder="KEY=VALUE pairs separated by comma"
                  {...register('env')}
                />
              </Grid>
              <Grid size={6}>
                <TextField
                  fullWidth
                  label="User"
                  {...register('user')}
                  sx={{ mb: 2 }}
                />
              </Grid>
              <Grid size={6}>
                <TextField
                  fullWidth
                  label="Working Directory"
                  {...register('workingDir')}
                  sx={{ mb: 2 }}
                />
              </Grid>
              <Grid size={6}>
                <TextField
                  fullWidth
                  label="Shell"
                  {...register('shell')}
                  sx={{ mb: 2 }}
                />
              </Grid>
            </Grid>
          </Box>
        </form>
        <Accordion>
          <AccordionSummary
            expandIcon={<ExpandMoreIcon />}
            aria-controls="panel1-content"
            id="panel1-header"
          >
            Ports
          </AccordionSummary>
          <AccordionDetails>
            <Grid container spacing={2}>
              {Array.from(portBindings.entries()).map(([k, v]) => (
                <Box component="div" key={k}>
                  <PortBindingForm port={k} bindings={getBindings(v)} portBindings={v} onSave={onSavePortBinding} onRemove={onRemovePortBinding} />
                </Box>
              ))}
              <Box component="div" className="w-full items-center justify-center">
                <TextField
                  fullWidth
                  label="Port"
                  sx={{ mb: 2, flex: 1}}
                  {...portBindingForm.register('port', { required: true })}
                />
                <TextField
                  fullWidth
                  label="Enter host IP:PORT separated by comma"
                  sx={{ mb: 2, flex: 1}}
                  {...portBindingForm.register('bindings', { required: true })}
                />
              </Box>
            </Grid>
          </AccordionDetails>
          <AccordionActions>
            <Button>Add</Button>
          </AccordionActions>
        </Accordion>
        <Accordion>
          <AccordionSummary
            expandIcon={<ExpandMoreIcon />}
            aria-controls="panel2-content"
            id="panel2-header"
          >
            Environment Variables
          </AccordionSummary>
          <AccordionDetails>
            Lorem ipsum dolor sit amet, consectetur adipiscing elit. Suspendisse
            malesuada lacus ex, sit amet blandit leo lobortis eget.
          </AccordionDetails>
          <AccordionActions>
            <Button>Add</Button>
          </AccordionActions>
        </Accordion>
        <Accordion>
          <AccordionSummary
            expandIcon={<ExpandMoreIcon />}
            aria-controls="panel3-content"
            id="panel3-header"
          >
            Volume Paths
          </AccordionSummary>
          <AccordionDetails>
            <Grid container spacing={2}>
              {Array.from(mountPoints.entries()).map(([k, v]) => (
                <Box component="div" key={k} className="flex flex-row w-full items-center justify-center space-x-2">
                  <MountPointForm src={k} dest={v} onSave={onSaveMountPoint} onRemove={onRemoveMountPoint} />
                </Box>
              ))}
              <Box component="div" className="w-full items-center justify-center">
                <TextField
                  fullWidth
                  label="Source"
                  sx={{ mb: 2, flex: 1 }}
                  {...mountPointForm.register('src', { required: true })}
                />
                <TextField
                  fullWidth
                  label="Destination"
                  sx={{ mb: 2, flex: 1 }}
                  {...mountPointForm.register('dest', { required: true })}
                />
              </Box>
            </Grid>
          </AccordionDetails>
          <AccordionActions>
            <Button className="disabled:opacity-50 disabled:pointer-events-none" onClick={addMountPoint} disabled={!mountPointForm.formState.isValid}>Add</Button>
          </AccordionActions>
        </Accordion>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>Cancel</Button>
        <LoadingButton loading={actionInProgress} disabled={!formState.isValid} onClick={formOnSubmit}>Run</LoadingButton>
      </DialogActions>
    </Dialog>
  );
}
