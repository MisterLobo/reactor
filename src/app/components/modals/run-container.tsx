import Button from '@mui/material/Button';
import Dialog, { DialogProps } from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import React, { useCallback, useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Accordion, AccordionActions, AccordionDetails, AccordionSummary, Box, Checkbox, FormControlLabel, IconButton, TextField } from '@mui/material';
import Grid from '@mui/material/Grid2';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { ContainerRunParams } from '../../lib/bindings/ContainerRunParams';
import { invoke } from '@tauri-apps/api/core';
import { ContainerRunResponse } from '../../lib/bindings/ContainerRunResponse';
import { LoadingButton } from '@mui/lab';
import { Delete } from '@mui/icons-material';
import { PortBinding } from '@/bindings/PortBinding';
import { Struct } from '@/bindings/Struct';

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
  explorable?: boolean,
  enableSecureShell?: boolean,
}

type EnvFormProps = {
  envKey: string,
  envValue?: string,
  onSave?: (key: string, value?: string) => void,
  onRemove: (key: string) => void,
  onUpdateKey?: (key: string, newKey: string) => void,
  onUpdateValue?: (key: string, newValue?: string) => void,
}

type MountPointFormProps = {
  src?: string,
  dest?: string,
  onSave?: (src: string, dest: string) => void,
  onRemove: (src: string) => void,
  onUpdateSrc?: (src: string, newSrc: string) => void,
  onUpdateDest?: (src: string, newDest: string) => void,
}

type PortBindingFormProps = {
  containerPort: string,
  hostBindings: string,
  portBindings: PortBinding[],
  onSave?: (port: string, binding: string) => void,
  onRemove: (port: string) => void,
  onUpdatePort?: (port: string, newPort: string) => void,
  onUpdateBindings?: (port: string, hostBindings: PortBinding[]) => void,
}

type RunContainerProps = Partial<RunContainerFormProps> & {
  visible: boolean,
  onClose: () => void,
}
const hostBindingRx = /((\d{1,3}.\d{1,3}.\d{1,3}.\d{1,3})?:\d{2,5}(?=,?))+/g;
const getBindings = (portBindings: PortBinding[]) => portBindings.map(p => `${p.HostIp}:${p.HostPort}`).join(',');
const getPortBindings = (bindings: string) => {
  const items = bindings.split(',');
  const portBindings = items.filter(item => {
    const [hostIp, hostPort] = item.split(':');
    console.log('[host-1]:', hostIp, hostPort);

    const hostIpValid = hostIp === '' || /(\d{1,3}.\d{1,3}.\d{1,3}.\d{1,3})?/.test(hostIp);
    const hostPortValid = /\d{2,5}/.test(hostPort);
    console.log('[check]:', hostIpValid && hostPortValid);

    return hostPortValid && hostIpValid;
  }).map(item => {
    console.log('[host-2]:', item);
    const [hostIp, hostPort] = item.split(':');
    return {
      HostIp: hostIp,
      HostPort: hostPort,
    } as PortBinding;
  });
  return portBindings;
}

function EnvForm(props: EnvFormProps) {
  const [busy, _setBusy] = useState(false);
  const { register, getValues } = useForm<EnvFormProps>({
    defaultValues: {
      envKey: props.envKey,
      envValue: props.envValue,
    },
  })

  const keyOnBlur = () => {
    if (props.onUpdateKey) {
      const newKey = getValues('envKey');
      console.log('[new#key]:', newKey);

      props.onUpdateKey(props.envKey, newKey);
    }
  }

  const valueOnBlur = () => {
    if (props.onUpdateValue) {
      const key = getValues('envKey');
      const newValue = getValues('envValue');
      console.log('[newvalue]:', newValue);

      props.onUpdateValue(key, newValue);
    }
  }

  return (
    <>
    <TextField
      label="Key"
      sx={{ mb: 2 }}
      {...register('envKey', { required: true })}
      onBlur={keyOnBlur}
    />
    <TextField
      label="Value"
      sx={{ mb: 2 }}
      {...register('envValue')}
      onBlur={valueOnBlur}
    />
    <IconButton className="items-center" aria-label="remove" onClick={() => props.onRemove(props.envKey)} disabled={busy} size="large">
      <Delete color={busy ? 'disabled' : 'error'} />
    </IconButton>
    </>
  )
}

function PortBindingForm(props: PortBindingFormProps) {
  const [busy, _setBusy] = useState(false);
  const [bindings, setBindings] = useState<string>();
  const [_hostBindings, setHostBindings] = useState<PortBinding[]>([]);
  const { register, setValue, getValues } = useForm<PortBindingFormProps>({
    defaultValues: {
      containerPort: props.containerPort,
      hostBindings: bindings,
    },
  });

  useEffect(() => {
    const bindings = getBindings(props.portBindings);
    setBindings(bindings);
    setHostBindings(props.portBindings ?? []);
    setValue('hostBindings', bindings);
  }, [props.hostBindings])

  const portOnBlur = useCallback(() => {
    if (props.onUpdatePort) {
      const newPort = getValues('containerPort');
      props.onUpdatePort(props.containerPort, newPort);
    }
  }, [props])
  const bindingsOnBlur = useCallback((e: React.FocusEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setBindings(value);
    if (props.onUpdateBindings) {
      const port = getValues('containerPort');
      const bindings = getPortBindings(value);
      setHostBindings(bindings);
      props.onUpdateBindings(port, bindings);
    }
  }, [props])

  return (
    <>
      <TextField
        label="Container Port"
        sx={{ mb: 2 }}
        {...register('containerPort')}
        onBlur={portOnBlur}
      />
      <TextField
        label="Host IP:PORT separated by comma"
        sx={{ mb: 2 }}
        {...register('hostBindings', { required: true })}
        onBlur={bindingsOnBlur}
      />
      <IconButton className="items-center" aria-label="remove" onClick={() => props.onRemove(props.containerPort)} disabled={busy} size="large">
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
  const envForm = useForm<EnvFormProps>();
  const [_open, setOpen] = useState(visible);
  const [scroll, _setScroll] = useState<DialogProps['scroll']>('paper');
  const [actionInProgress, setActionInProgress] = useState(false);
  const [mountPoints, setMountPoints] = useState<Map<string, string>>(new Map());
  const [portBindings, setPortBindings] = useState<Map<string, PortBinding[]>>(new Map());
  const [envs, setEnvs] = useState<Map<string, string>>(new Map());

  const handleClose = () => {
    setOpen(false);
    onClose();
  };

  const formOnSubmit = async () => {
    const binds = Array.from(mountPoints.entries()).map(([k, v]) => `${k}:${v}`);
    const ports: Record<string, PortBinding[]> = {};
    const exposedPorts: Record<string, Struct> = {};
    Array.from(portBindings.entries()).forEach(([k, v]) => {
      ports[k] = v;
      exposedPorts[k] = {};
    });
    const envEntries = Array.from(envs.entries()).map(([k, v]) => `${k}=${v}`);
    const data = getValues();
    console.log('[data]:', data, binds, ports);
    if (data.explorable) {
      ports['45500/tcp'] = [
        {
          HostIp: '',
          HostPort: '',
        },
      ];
      exposedPorts['45500/tcp'] = {};
    }
    if (data.enableSecureShell) {
      ports['2222/tcp'] = [
        {
          HostIp: '',
          HostPort: '',
        },
      ];
      exposedPorts['2222/tcp'] = {};
    }
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
      env: envEntries, // !!data.env ? data.env?.split(',') : [],
      user: data.user || null,
      working_dir: data.workingDir || null,
      shell: data.shell ?? null,
      binds,
      port_bindings: ports,
      exposed_ports: exposedPorts,
      explorable: data.explorable ?? false,
      ssh: data.enableSecureShell ?? false,
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

  const addPortBindings = () => {
    const values = portBindingForm.getValues();
    portBindingForm.resetField('containerPort');
    portBindingForm.resetField('hostBindings');
    const port = values.containerPort;
    const portBindings = getPortBindings(values.hostBindings) as PortBinding[];
    console.log('[port#bindings]:', port, portBindings);
    
    setPortBindings(old => {
      const map = new Map(old);
      map.set(port, portBindings);
      return map;
    });
  }

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

  // const getBindings = (portBindings: PortBinding[]) => portBindings.map(p => `${p.HostIp}:${p.HostPort}`).join(',');
  /* const getPortBindings = (bindings: string) => {
    const items = bindings.split(',');
    const portBindings = items.filter(item => {
      const [hostIp, hostPort] = item.split(':');
      console.log('[host-1]:', hostIp, hostPort);

      const hostIpValid = /\d{1,3}.\d{1,3}.\d{1,3}.\d{1,3}/.test(hostIp);
      const hostPortValid = /\d{2,5}/.test(hostPort);
      return hostIpValid && hostPortValid;
    }).map(item => {
      console.log('[host-2]:', item);
      const [hostIp, hostPort] = item.split(':');
      return {
        HostIp: hostIp,
        HostPort: hostPort,
      } as PortBinding;
    });
    return portBindings;
  } */

  const cPortUpdated = (port: string, newPort: string) => {
    console.log('[port#update]:', port, newPort);
    
    setPortBindings(old => {
      const map = new Map(old);
      const portBindings = map.get(port) ?? [];
      map.delete(port);
      map.set(newPort, portBindings);
      return map;
    })
  }

  const portBindingsUpdated = (port: string, newBindings: PortBinding[]) => {
    console.log('[bindings#update]:', port, newBindings);

    setPortBindings(old => {
      const map = new Map(old);
      map.set(port, newBindings);
      return map;
    })
  }

  const mountPointSrcUpdated = (oldSrc: string, newSrc: string) => {
    console.log('[src#update]:', oldSrc, newSrc);

    setMountPoints(old => {
      const map = new Map(old);
      const dest = map.get(oldSrc) as string;
      map.delete(oldSrc);
      map.set(newSrc, dest);
      return map;
    })
  }

  const mountPointDestUpdated = (src: string, newDest: string) => {
    console.log('[dest#update]:', src, newDest);

    setMountPoints(old => {
      const map = new Map(old);
      map.set(src, newDest);
      return map;
    })
  }

  const addEnv = () => {
    // const key = envForm.getValues('key');
    // const value = envForm.getValues('value');
    const values = envForm.getValues();

    envForm.resetField('envKey');
    envForm.resetField('envValue');
    console.log('[env]:', values);
    setEnvs(old => {
      const map = new Map(old);
      map.set(values.envKey, values.envValue as string);
      return map;
    })
  }

  const envKeyUpdated = (oldKey: string, newKey: string) => {
    console.log('[key#update]:', oldKey, newKey);

    setEnvs(old => {
      const map = new Map(old);
      const value = map.get(oldKey) as string;
      map.delete(oldKey);
      map.set(newKey, value);
      return map;
    })
  }

  const envValueUpdated = (key: string, newValue?: string) => {
    console.log('[value#update]:', key, newValue);

    setEnvs(old => {
      const map = new Map(old);
      map.set(key, newValue as string);
      return map;
    })
  }

  // const envSaved = (key: string, value?: string) => {}

  const envRemoved = (key: string) => {
    setEnvs(old => {
      const map = new Map(old);
      map.delete(key);
      return map;
    })
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
                <FormControlLabel control={<Checkbox {...register('enableSecureShell')} />} label="enable ssh" className="flex w-full" />
              </Grid>
              <Grid size={6}>
                <FormControlLabel control={<Checkbox {...register('detach')} />} label="detach" className="flex w-full" />
                <FormControlLabel control={<Checkbox {...register('autoRemove')} />} label="auto remove" className="flex w-full" />
                <FormControlLabel control={<Checkbox {...register('exposeAllPorts')} />} label="expose all ports" className="flex w-full" />
                <FormControlLabel control={<Checkbox {...register('privileged')} />} label="privileged" className="flex w-full" />
                <FormControlLabel control={<Checkbox {...register('explorable')} />} label="browsable" className="flex w-full" />
              </Grid>
              <Grid size={12}>
                <TextField
                  fullWidth
                  label="Command"
                  {...register('command')}
                  sx={{ mt: 2 }}
                />
              </Grid>
              {/* <Grid size={12}>
                <TextField
                  fullWidth
                  label="Environment"
                  placeholder="KEY=VALUE pairs separated by comma"
                  {...register('env')}
                />
              </Grid> */}
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
                <Box component="div" key={k} className="flex flex-row w-full items-center justify-center space-x-2">
                  <PortBindingForm containerPort={k} hostBindings={getBindings(v)} portBindings={v} onSave={onSavePortBinding} onRemove={onRemovePortBinding} onUpdatePort={cPortUpdated} onUpdateBindings={portBindingsUpdated} />
                </Box>
              ))}
              <Box component="div" className="w-full items-center justify-center">
                <TextField
                  fullWidth
                  label="Container Port"
                  sx={{ mb: 2, flex: 1}}
                  placeholder="<port>/<tcp|udp|sctp>"
                  {...portBindingForm.register('containerPort', { required: true, validate: v => /\d{2,5}(?=\/(tcp|udp|sctp))/.test(v) })}
                />
                <TextField
                  fullWidth
                  label="Enter host IP:PORT separated by comma"
                  sx={{ mb: 2, flex: 1}}
                  {...portBindingForm.register('hostBindings', { required: true, validate: v => hostBindingRx.test(v) })}
                />
              </Box>
            </Grid>
          </AccordionDetails>
          <AccordionActions>
            <Button className="disabled:opacity-50 disabled:pointer-events-none" onClick={addPortBindings} disabled={!portBindingForm.formState.isValid}>Add</Button>
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
            <Grid container spacing={2}>
              {Array.from(envs.entries()).map(([k, v], i) => (
                <Box component="div" key={i} className="flex flex-row w-full items-center justify-center space-x-2">
                  <EnvForm envKey={k} envValue={v} onRemove={envRemoved} onUpdateKey={envKeyUpdated} onUpdateValue={envValueUpdated} />
                </Box>
              ))}
              <Box component="div" className="w-full items-center justify-center">
                <TextField
                  fullWidth
                  label="Key"
                  sx={{ mb: 2, flex: 1 }}
                  {...envForm.register('envKey', { required: true })}
                />
                <TextField
                  fullWidth
                  label="Value"
                  sx={{ mb: 2, flex: 1 }}
                  {...envForm.register('envValue')}
                />
              </Box>
            </Grid>
            {/* <TextField
              fullWidth
              label="Enter KEY=VALUE separated by comma"
              sx={{ mb: 2, flex: 1}}
            /> */}
          </AccordionDetails>
          <AccordionActions>
            <Button className="disabled:opacity-50 disabled:pointer-events-none" onClick={addEnv} disabled={!envForm.formState.isValid}>Add</Button>
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
                  <MountPointForm src={k} dest={v} onSave={onSaveMountPoint} onRemove={onRemoveMountPoint} onUpdateSrc={mountPointSrcUpdated} onUpdateDest={mountPointDestUpdated} />
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
