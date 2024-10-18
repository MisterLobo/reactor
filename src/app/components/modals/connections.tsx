
import Button from '@mui/material/Button';
import Dialog, { DialogProps } from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import { SyntheticEvent, useCallback, useEffect, useState } from 'react';
import { Box, FormControl, FormControlLabel, FormLabel, Radio, RadioGroup, Tab, TextField, Typography } from '@mui/material';
import { SubmitHandler, useForm } from 'react-hook-form';
import { TabContext, TabList, TabPanel } from '@mui/lab';
import { invoke } from '@tauri-apps/api/core';
import { DockerConnection } from '@/bindings/DockerConnection';
import { ConnectionCreateParams } from '@/bindings/ConnectionCreateParams';
import { ConnectionUpdateParams } from '@/bindings/ConnectionUpdateParams';
import { getSocket } from '../../../app/lib/ws';
import { ConnectionTestParams } from '@/bindings/ConnectionTestParams';
import { useSnackbar } from 'notistack';
import { ConnectionTestResponse } from '@/bindings/ConnectionTestResponse';

/* const blue = {
  100: '#DAECFF',
  200: '#80BFFF',
  400: '#3399FF',
  500: '#007FFF',
  600: '#0072E5',
  700: '#0059B2',
};

const grey = {
  50: '#F3F6F9',
  100: '#E5EAF2',
  200: '#DAE2ED',
  300: '#C7D0DD',
  400: '#B0B8C4',
  500: '#9DA8B7',
  600: '#6B7A90',
  700: '#434D5B',
  800: '#303740',
  900: '#1C2025',
}; */

/* const StyledInputRoot = styled('div')(
  ({ theme }) => `
  font-family: 'IBM Plex Sans', sans-serif;
  font-weight: 400;
  border-radius: 8px;
  color: ${theme.palette.mode === 'dark' ? grey[300] : grey[900]};
  background: ${theme.palette.mode === 'dark' ? grey[900] : '#fff'};
  border: 1px solid ${theme.palette.mode === 'dark' ? grey[700] : grey[200]};
  box-shadow: 0px 2px 4px ${
    theme.palette.mode === 'dark' ? 'rgba(0,0,0, 0.5)' : 'rgba(0,0,0, 0.05)'
  };
  display: grid;
  grid-template-columns: 1fr 19px;
  grid-template-rows: 1fr 1fr;
  overflow: hidden;
  column-gap: 8px;
  padding: 4px;

  &.${numberInputClasses.focused} {
    border-color: ${blue[400]};
    box-shadow: 0 0 0 3px ${theme.palette.mode === 'dark' ? blue[700] : blue[200]};
  }

  &:hover {
    border-color: ${blue[400]};
  }

  // firefox
  &:focus-visible {
    outline: 0;
  }
`,
);

const StyledInputElement = styled('input')(
  ({ theme }) => `
  font-size: 0.875rem;
  font-family: inherit;
  font-weight: 400;
  line-height: 1.5;
  grid-column: 1/2;
  grid-row: 1/3;
  color: ${theme.palette.mode === 'dark' ? grey[300] : grey[900]};
  background: inherit;
  border: none;
  border-radius: inherit;
  padding: 8px 12px;
  outline: 0;
`,
);

const StyledButton = styled('button')(
  ({ theme }) => `
  display: flex;
  flex-flow: row nowrap;
  justify-content: center;
  align-items: center;
  appearance: none;
  padding: 0;
  width: 19px;
  height: 19px;
  font-family: system-ui, sans-serif;
  font-size: 0.875rem;
  line-height: 1;
  box-sizing: border-box;
  background: ${theme.palette.mode === 'dark' ? grey[900] : '#fff'};
  border: 0;
  color: ${theme.palette.mode === 'dark' ? grey[300] : grey[900]};
  transition-property: all;
  transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
  transition-duration: 120ms;

  &:hover {
    background: ${theme.palette.mode === 'dark' ? grey[800] : grey[50]};
    border-color: ${theme.palette.mode === 'dark' ? grey[600] : grey[300]};
    cursor: pointer;
  }

  &.${numberInputClasses.incrementButton} {
    grid-column: 2/3;
    grid-row: 1/2;
    border-top-left-radius: 4px;
    border-top-right-radius: 4px;
    border: 1px solid;
    border-bottom: 0;
    border-color: ${theme.palette.mode === 'dark' ? grey[700] : grey[200]};
    background: ${theme.palette.mode === 'dark' ? grey[900] : grey[50]};
    color: ${theme.palette.mode === 'dark' ? grey[200] : grey[900]};

    &:hover {
      cursor: pointer;
      color: #FFF;
      background: ${theme.palette.mode === 'dark' ? blue[600] : blue[500]};
      border-color: ${theme.palette.mode === 'dark' ? blue[400] : blue[600]};
    }
  }

  &.${numberInputClasses.decrementButton} {
    grid-column: 2/3;
    grid-row: 2/3;
    border-bottom-left-radius: 4px;
    border-bottom-right-radius: 4px;
    border: 1px solid;
    border-color: ${theme.palette.mode === 'dark' ? grey[700] : grey[200]};
    background: ${theme.palette.mode === 'dark' ? grey[900] : grey[50]};
    color: ${theme.palette.mode === 'dark' ? grey[200] : grey[900]};
  }

  &:hover {
    cursor: pointer;
    color: #FFF;
    background: ${theme.palette.mode === 'dark' ? blue[600] : blue[500]};
    border-color: ${theme.palette.mode === 'dark' ? blue[400] : blue[600]};
  }

  & .arrow {
    transform: translateY(-1px);
  }

  & .arrow {
    transform: translateY(-1px);
  }
`,
); */

/* const CustomNumberInput = forwardRef(function CustomNumberInput(
  props: NumberInputProps,
  ref: React.ForwardedRef<HTMLDivElement>,
) {
  return (
    <BaseNumberInput
      slots={{
        root: StyledInputRoot,
        input: StyledInputElement,
        incrementButton: StyledButton,
        decrementButton: StyledButton,
      }}
      slotProps={{
        incrementButton: {
          children: '▴',
        },
        decrementButton: {
          children: '▾',
        },
      }}
      {...props}
      ref={ref}
    />
  );
}); */

type ConnectionsProps = {
  visible: boolean,
  onClose: () => void,
}

type ConnectionsFormProps = {
  id?: string,
  name?: string,
  socketAddress?: string,
  socketType: 'unix' | 'tcp',
  isDefault: boolean,
  onSave?: (payload?: DockerConnection, is_default?: boolean) => void,
}

function ConnectionForm({ id, name, socketAddress, socketType, isDefault, onSave }: ConnectionsFormProps) {
  const { register, setValue, getValues, formState, handleSubmit, reset, trigger } = useForm<ConnectionsFormProps>({
    defaultValues: {
      name,
      socketType,
      socketAddress,
      isDefault,
    },
  });
  const { enqueueSnackbar } = useSnackbar();

  const [sockType, setSockType] = useState(socketType);
  const [saving, setSaving] = useState(false);
  const [statusOk, setStatusOk] = useState<boolean>();
  const [message, setMessage] = useState<string>();

  useEffect(() => {
    getSocket()
      .then(socket => {
        socket.on('error', ({ message }) => {
          setMessage(message);
          setSaving(false);
        });
      })
  }, [])

  /* const notify = useCallback(async (title: string, body: string) => {
    let permissionGranted = await isPermissionGranted();
    if (!permissionGranted) {
      const permission = await requestPermission();
      permissionGranted = permission === 'granted';
    }
    if (permissionGranted) {
      sendNotification({
        title,
        body,
      });
    }
  }, []); */
  const saveForm: SubmitHandler<ConnectionsFormProps> = async (values: ConnectionsFormProps) => {
    console.log('[values]:', values);
    setMessage(undefined);
    setSaving(true);
    let data: DockerConnection | undefined;
    if (id) {
      const params = {
        id,
        name: values.name as string,
        socket_type: values.socketType,
        socket_address: values.socketAddress as string,
        is_default: values.isDefault,
      } as ConnectionUpdateParams;
      data = await invoke('update_connection', { params }) as DockerConnection;
    } else {
      const params = {
        name: values.name as string,
        socket_type: values.socketType,
        socket_address: values.socketAddress as string,
        is_default: values.isDefault,
      } as ConnectionCreateParams;
      data = await invoke('new_connection', { params }) as DockerConnection;
    }
    setSaving(false);
    reset();
    if (onSave) {
      onSave(data);
    }
  }

  const resetForm = () => {
    reset();
    trigger();
  }

  const changeSocketType = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value as any;
    setSockType(value);
    setValue('socketType', value);
  }

  const makeDefault = async () => {
    const resId = await invoke('set_default_connection', { params: { id } })
    if (resId === id && onSave) {
      onSave({ id } as DockerConnection, true)
    }
  }

  const testClicked = async () => {
    const values = getValues()
    const connection_string = `${sockType}://${values.socketAddress}`;
    const params = {} as ConnectionTestParams;
    if (id) {
      params.connection = id;
      params.exact = false;
    } else {
      params.connection = connection_string;
      params.exact = true;
    }
    const res: ConnectionTestResponse = await invoke('connection_test', { params })
    console.log('[testOk]:', res);
    const message = res.ok ? 'Connection test OK' : res.error;
    setStatusOk(res.ok as boolean)
    setMessage(message as string)
    enqueueSnackbar({
      message,
    })
  }

  return (
    <Box component="form" sx={{ width: '100%', }} onSubmit={handleSubmit(saveForm)}>
      <Typography component="p" sx={{ mb: 2, color: 'green' }}>{ id }</Typography>
      <FormControl sx={{ flex: 1, width: '100%', my: 2 }}>
        <TextField
          autoFocus
          required
          label="Name"
          className="w-full"
          sx={{ display: 'flex', width: '100%' }}
          {...register('name', { required: true, minLength: 2, maxLength: 15 })}
        />
      </FormControl>
      <FormControl sx={{ flex: 1, width: '100%', my: 2 }}>
        <FormLabel>Socket Type</FormLabel>
        <RadioGroup
          row
          name="socketType"
          value={sockType}
          onChange={changeSocketType}
        >
          <FormControlLabel value="unix" control={<Radio />} label="Unix" />
          <FormControlLabel value="tcp" control={<Radio />} label="TCP" />
        </RadioGroup>
      </FormControl>
      <FormControl sx={{ flex: 1, width: '100%', my: 2 }}>
        <TextField
          autoFocus
          required
          label="socket address"
          className="w-full"
          sx={{ display: 'flex', width: '100%' }}
          {...register('socketAddress', { required: true })}
        />
      </FormControl>
      <Box component="div" width="100%" sx={{ flex: 1, width: '100%' }} className="space-x-2">
        <Button variant="contained" type="submit" disabled={!formState.isValid || saving}>Save changes</Button>
        <Button type="button" onClick={testClicked}>Test</Button>
        <Button type="reset" onClick={resetForm}>Reset</Button>
        {(id && !isDefault) && <Button className="float-right" disabled={!formState.isValid || saving} onClick={makeDefault}>Make default</Button>}
      </Box>
      {message &&
      <Typography component="p" sx={{ my: 5, color: statusOk ? 'green' : 'red' }}>{ message }</Typography>
      }
    </Box>
  )
}

export default function ManageConnectionsDialog({ visible, onClose }: ConnectionsProps) {
  const [_open, setOpen] = useState(visible);
  const [scroll, _setScroll] = useState<DialogProps['scroll']>('paper');
  const [defaultConnection, setDefaultConnection] = useState<DockerConnection>();
  const [currentTab, setCurrentTab] = useState('new');
  const [connections, setConnections] = useState<Map<string, DockerConnection>>(new Map());

  const listConnections = useCallback(async () => {
    const connections: { list: DockerConnection[] } = await invoke('list_connections');
    const list = connections.list;
    const def = list.find(v => v.is_default);
    console.log('[default]:', def);
    
    setDefaultConnection(def);
    if (def) {
      setCurrentTab(defaultConnection?.id as string);
    }
    const map = new Map<string, DockerConnection>(list.map(l => ([l.id, l])))
    setConnections(map);
  }, [])

  useEffect(() => {
    if (defaultConnection?.id) {
      setCurrentTab(defaultConnection?.id);
    }
  }, [defaultConnection])

  useEffect(() => {
    /* getSocket()
      .then(socket => {
        socket.on('connection', ({ id, op, payload }: { id: string, op: 'new' | 'upd' | 'del', payload?: DockerConnection }) => {
          console.log('[payload]:', id, op, payload);
          if (op === 'new' || op === 'upd') {
            setConnections((old) => {
              const newMap = new Map(old);
              newMap.set(id, payload as DockerConnection);
              return newMap;
            })
          } else if (op === 'del') {
            setConnections(old => {
              const newMap = new Map(old);
              newMap.delete(id);
              return newMap;
            })
          }
        })
      }) */
    if (visible) {
      listConnections().catch(console.error);
    }
  }, [visible])

  const handleOnChange = (_e: SyntheticEvent, newValue: string) => {
    setCurrentTab(newValue);
  }

  const handleClose = () => {
    setOpen(false);
    onClose();
  }

  const onSave = async (payload?: DockerConnection, is_default = false) => {
    // await listConnections();
    if (!is_default) {
      setConnections((old) => {
        const newConns = new Map<string, DockerConnection>(old);
        newConns.set(payload?.id as string, payload as DockerConnection);
        return newConns;
      })
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
      maxWidth="lg"
    >
      <DialogTitle id="scroll-dialog-title">Connections</DialogTitle>
      <DialogContent dividers={scroll === 'paper'} sx={{ height: 600 }}>
        <TabContext value={currentTab ?? 'new'}>
          <Box
            sx={{ flexGrow: 1, bgcolor: 'background.paper', display: 'flex', height: '100%' }}
          >
            <TabList
              orientation="vertical"
              variant="scrollable"
              onChange={handleOnChange}
              scrollButtons="auto"
              sx={{ borderRight: 1, borderColor: 'divider' }}
            >
              {Array.from(connections.entries()).map(([k ,v]) => (
                <Tab key={k} label={v.name} value={k} />
              ))}
              <Tab label="Add New" value="new" sx={{ color: 'yellow' }} />
            </TabList>
            {Array.from(connections.entries()).map(([k, v]) => (
              <TabPanel key={k} value={k}>
                <ConnectionForm id={v.id} name={v.name} socketType={v.socket_type as any} socketAddress={v.socket_address as string} isDefault={v.is_default} onSave={onSave} />
              </TabPanel>
            ))}
            <TabPanel value="new">
              <ConnectionForm socketType="unix" isDefault={false} onSave={onSave} />
            </TabPanel>
          </Box>
        </TabContext>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
}
