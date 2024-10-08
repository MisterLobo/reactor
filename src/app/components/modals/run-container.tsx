import Button from '@mui/material/Button';
import Dialog, { DialogProps } from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Accordion, AccordionActions, AccordionDetails, AccordionSummary, Box, Checkbox, FormControlLabel, TextField } from '@mui/material';
import Grid from '@mui/material/Grid2';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { ContainerRunParams } from '../../lib/bindings/ContainerRunParams';
import { invoke } from '@tauri-apps/api/tauri';
import { ContainerRunResponse } from '../../lib/bindings/ContainerRunResponse';
import { LoadingButton } from '@mui/lab';

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

type RunContainerProps = Partial<RunContainerFormProps> & {
  visible: boolean,
  onClose: () => void,
}

export default function RunContainerDialog({ image, name, visible, onClose }: RunContainerProps) {
  const { register, formState, getValues } = useForm<RunContainerFormProps>({
    defaultValues: {
      image,
      name,
    },
  });
  const [_open, setOpen] = useState(visible);
  const [scroll, _setScroll] = useState<DialogProps['scroll']>('paper');
  const [actionInProgress, setActionInProgress] = useState(false);

  const handleClose = () => {
    setOpen(false);
    onClose();
  };

  const formOnSubmit = async () => {
    const data = getValues();
    console.log('[data]:', data);
    setActionInProgress(true);
    const params: ContainerRunParams = {
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
      env: data.env?.split(' ') ?? [],
      user: data.user || null,
      working_dir: data.workingDir || null,
      shell: data.shell ?? null,
    };
    console.log('[params]:', params);
    const res: ContainerRunResponse = await invoke('container_run', { params });
    console.log('[res]:', res);
    
    setActionInProgress(false);

    if (res.id) {
      handleClose();
    }
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
        <Accordion defaultExpanded>
          <AccordionSummary
            expandIcon={<ExpandMoreIcon />}
            aria-controls="panel3-content"
            id="panel3-header"
          >
            Volume Paths
          </AccordionSummary>
          <AccordionDetails>
            Lorem ipsum dolor sit amet, consectetur adipiscing elit. Suspendisse
            malesuada lacus ex, sit amet blandit leo lobortis eget.
          </AccordionDetails>
          <AccordionActions>
            <Button>Add</Button>
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
