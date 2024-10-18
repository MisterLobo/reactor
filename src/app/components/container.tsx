import { TabContext, TabList, TabPanel } from '@mui/lab';
import { 
  Accordion,
  AccordionDetails,
  AccordionSummary,
  AppBar,
  Box,
  Button,
  Card,
  CardActions,
  CardContent,
  Grid2 as Grid,
  IconButton,
  Paper,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Toolbar,
  Tooltip,
  Typography,
} from '@mui/material';
import { SyntheticEvent, useCallback, useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Search, SearchIconWrapper, StyledInputBase } from '../components/client';
import SearchIcon from '@mui/icons-material/Search';
import { invoke } from '@tauri-apps/api/core';
import { ContainerSummary } from '@/bindings/ContainerSummary';
import { InspectObjectResponse } from '@/bindings/InspectObjectResponse';
import JsonView from '@uiw/react-json-view';
import { vscodeTheme } from '@uiw/react-json-view/vscode';
import { ContainerJson, ContainerStats } from '../lib/types';
import {
  Dangerous,
  Delete,
  Difference,
  PlayCircleFilled,
  RestartAlt,
  Stop,
  Terminal,
  BookmarkBorder,
  FolderOpen,
  FolderZip,
  Edit,
  ArrowDownward,
  Code,
  Source,
  Schedule,
  Info,
  Today,
} from '@mui/icons-material';
import { ContainerStartResponse } from '@/bindings/ContainerStartResponse';
import { ContainerStopResponse } from '@/bindings/ContainerStopResponse';
import { listen } from '@tauri-apps/api/event';
import ContainerExplorerDialog from './modals/container-explorer';
import ContainerRenameDialog from './modals/container-rename';
import ContainerExecDialog from './modals/container-exec';
import ContainerDiffDialog from './modals/container-diff';
import { ContainerExportParams } from '@/bindings/ContainerExportParams';
import { save } from '@tauri-apps/plugin-dialog';
import { ContainerRestartParams } from '@/bindings/ContainerRestartParams';
import { ContainerKillParams } from '@/bindings/ContainerKillParams';
import { ContainerRemoveParams } from '@/bindings/ContainerRemoveParams';
import { ContainerStatsParams } from '@/bindings/ContainerStatsParams';
import { ContainerStatsResponse } from '@/bindings/ContainerStatsResponse';
import { ContainerTopBody } from '@/bindings/ContainerTopBody';
import { ContainerTopParams } from '@/bindings/ContainerTopParams';
import { ContainerTopResponse } from '@/bindings/ContainerTopResponse';

export default function ContainerDetails({ id, name }: { id?: string, name?: string }) {
  const location = useLocation();
  const [value, setValue] = useState<string>('info');
  const [container, setContainer] = useState<ContainerSummary>();
  const [containerJson, setContainerJson] = useState<ContainerJson>();
  const [statsJson, setStatsJson] = useState<ContainerStats>();
  const [topBody, setTopBody] = useState<ContainerTopBody>();
  const [inspecting, setInspecting] = useState(false);
  const [containerId, setContainerId] = useState(id);
  const [containerName, setContainerName] = useState(name);
  const [containerState, setContainerState] = useState<string>();
  const [containerStatus, setContainerStatus] = useState<string>();
  const [actionInProgress, setActionInProgress] = useState(false);
  const [execVIsible, setExecVisible] = useState(false);
  const [diffVisible, setDiffVisible] = useState(false);
  const [explorerVisible, setExplorerVisible] = useState(false);
  const [renameVisible, setRenameVisible] = useState(false);
  const exposedPorts = useMemo(() => Object.keys(containerJson?.Config?.ExposedPorts ?? {}), [containerJson]);

  useEffect(() => {
    const search = new URLSearchParams(location.search)
    const id = search.get('cid');
    setContainerId(id as string);
  }, [location])

  useEffect(() => {
    if (containerId) {
      (async () => {
        const container = await invoke('container_get', { params: { id: containerId }}) as ContainerSummary;
        // console.log('[info]:', container);
        const name = container.name.replace('/', '');
        setContainer(container);
        setContainerName(name);
        setContainerState(container.state as string);
        setContainerStatus(container.status as string);
        await Promise.all([
          inspect(),
          stats(),
          top(),
        ]);
      })()
    }
  }, [containerId])

  useEffect(() => {
    const listeners = async () => {
      await listen<{ id: string, cid: string }>('subbed', ({ payload }) => {
        if (payload.cid === containerId) {
          // console.log('[subbed#backend]:', payload);
        }
      });
      await listen<{ id: string, state: string, status: string }>('started', ({ payload }) => {
        if (payload.id === containerId) {
          console.log('[started]:', payload);
          setContainerState(payload.state);
          setContainerStatus(payload.status)
          setActionInProgress(false);
        }
      });
      await listen<{id: string, state: string, status: string }>('stopped', ({ payload }) => {
        if (payload.id === containerId) {
          console.log('[stopped]:', payload);
          setContainerState(payload.state);
          setContainerStatus(payload.status);
          setActionInProgress(false);
        }
      });
      await listen<{id: string, state: string }>('killed', ({ payload }) => {
        if (payload.id === id) {
          setContainerState(payload.state as string)
          setActionInProgress(false);
        }
      });
      await listen<{id: string, state: string }>('restarted', ({ payload }) => {
        if (payload.id === id) {
          setContainerState(payload.state);
          setActionInProgress(false);
        }
      });
      await listen<{id: string, name: string}>('renamed', ({ payload }) => {
        console.log('[renamed]:', payload);
        if (payload.id === id) {
          setContainerName(payload.name);
        }
      });
    }
    const subscribe = async () => {
      const subbed = await invoke('subscribe_container', { params: { id: containerId, ns: '/container' } }) as boolean;
      // setSubscribed(subbed);
  
      return subbed;
    }
    if (containerId) {
      listeners();
      subscribe()
        .then(subbed => {
          console.log('[subbed#api]:', subbed);
        })
        .catch(console.error)
    }
  }, [containerId])

  const start = useCallback(async () => {
    const res: ContainerStartResponse = await invoke('container_start', { params: { id: containerId } });
    console.log('[start#res]:', res);
    // setContainerState(res.status as string)
    // setActionInProgress(false)
  }, [containerId])
  const stop = useCallback(async () => {
    const res: ContainerStopResponse = await invoke('container_stop', { params: { id: containerId }});
    console.log('[stop#res]:', res);
    // setContainerState(res.status as string)
    // setActionInProgress(false);
  }, [containerId])
  const restart = useCallback(async () => {
    const params: ContainerRestartParams = {
      id: containerId as string,
    };
    await invoke('container_restart', { params });
  }, [containerId])
  const kill = useCallback(async () => {
    const params: ContainerKillParams = {
      id: containerId as string,
    };
    await invoke('container_kill', { params });
    /* if (res) {
      setActionInProgress(true);
    } */
  }, [containerId]);
  const remove = useCallback(async () => {
    const params: ContainerRemoveParams = {
      id: containerId as string,
      force: false,
    };
    await invoke('container_remove', { params });
  }, [containerId])
  const stats = useCallback(async () => {
    const params = {
      id,
    } as ContainerStatsParams;
    const { stats = '{}' } = await invoke('container_stats', { params }) as ContainerStatsResponse;
    const sjson = JSON.parse(stats ?? '{}') as ContainerStats;
    console.log('[stats]:', sjson);
    setStatsJson(sjson);
    setActionInProgress(false);
  }, [containerId])
  const top = useCallback(async () => {
    const params = {
      id,
    } as ContainerTopParams;
    const { top } = await invoke('container_top', { params }) as ContainerTopResponse;
    console.log('[top]:', top);
    setTopBody(top as ContainerTopBody);
    setActionInProgress(false);
  }, [containerId])

  const onTabChange = (_event: SyntheticEvent, newvalue: string) => {
    setValue(newvalue);
    /* switch (newvalue) {
      case 'stats': {
        statsOnClicked();
        break;
      }
      case 'top': {
        topOnClicked();
        break;
      }
    } */
  }

  const inspect = async () => {
    try {
      setInspecting(true);
      const res = await invoke('container_inspect', { params: { id: containerId }}) as InspectObjectResponse;
      const cjson = JSON.parse(res.json);
      console.log('[cjson]:', cjson);
      
      setInspecting(false);
      setContainerJson(cjson);
    } catch (e) {}
  }

  const containerExport = useCallback(async () => {
    const filePath = await save({
      title: 'Export container',
      filters: [
        {
          name: 'export',
          extensions: ['tar', 'zip', 'bin'],
        },
      ],
    });

    if (filePath) {
      const params: ContainerExportParams = {
        id: containerId as string,
        file_path: filePath,
      };
      invoke('container_export', { params });
    }
  }, [id])

  const startOnClicked = async () => {
    setActionInProgress(true);
    start().catch(console.error);
  }

  const stopOnClicked = async () => {
    setActionInProgress(true);
    stop().catch(console.error);
  }

  const killOnClicked = async () => {
    setActionInProgress(true);
    kill().catch(console.error);
  }

  const restartOnClicked = async () => {
    setActionInProgress(true);
    restart().catch(console.error);
  }

  const removeOnClicked = async () => {
    setActionInProgress(true);
    remove().catch(console.error)
  }

  return (
    <>
    <AppBar
      position="fixed"
      sx={{
        width: { sm: `calc(100% - ${240}px)` },
        ml: { sm: `${240}px` },
      }}
    >
      <Toolbar>
        <Typography
          variant="h6"
          noWrap
          component="div"
          sx={{ flexGrow: 1, display: { xs: 'none', sm: 'block' } }}
        >
          Container Details
        </Typography>
        <Search>
          <SearchIconWrapper>
            <SearchIcon />
          </SearchIconWrapper>
          <StyledInputBase placeholder="Search..." inputProps={{ 'aria-label': 'search' }} />
        </Search>
      </Toolbar>
    </AppBar>
    <Grid container spacing={2}>
      <Grid size={3}>
        <Card className="w-100 h-80">
          <CardContent className="h-64">
            <Box component="div" className="space-y-2">
              <Typography variant="h4" className="text-xl">{ containerName }</Typography>
              <Typography variant="body2" className="break-all">
                <Info className="mr-2" />
                { containerId }
              </Typography>
              {container &&
              <>
              <Typography variant="body2" className="break-all">
                <Code className="mr-2" />
                { container.command }
              </Typography>
              <Typography variant="body2" className="break-all">
                <Source className="mr-2" />
                { container.image }
              </Typography>
              <Typography variant="body2" className="break-all">
                <Today className="mr-2" />
                { container.created }
              </Typography>
              <Typography variant="body2" className="break-all">
                <Schedule className="mr-2" />
                { containerState } { containerStatus }
              </Typography>
              </>
              }
            </Box>
          </CardContent>
          <CardActions className="h-16">
            <Box component="div">
            {containerState === 'running' ?
              <>
              <Tooltip title="stop">
                <IconButton aria-label="stop" color="error" onClick={stopOnClicked} disabled={actionInProgress}>
                  <Stop />
                </IconButton>
              </Tooltip>
              <Tooltip title="kill">
                <IconButton aria-label="kill" color="error" onClick={killOnClicked} disabled={actionInProgress}>
                  <Dangerous />
                </IconButton>
              </Tooltip>
              <Tooltip title="restart">
                <IconButton aria-label="restart" color="success" onClick={restartOnClicked} disabled={actionInProgress}>
                  <RestartAlt />
                </IconButton>
              </Tooltip>
              <Tooltip title="exec">
                <IconButton aria-label="exec" disabled={actionInProgress}>
                  <Terminal />
                </IconButton>
              </Tooltip>
              <Tooltip title="diff">
                <IconButton aria-label="diff" disabled={actionInProgress}>
                  <Difference />
                </IconButton>
              </Tooltip>
              </> :
              <>
              <Tooltip title="start">
                <IconButton aria-label="start" onClick={startOnClicked} disabled={actionInProgress}>
                  <PlayCircleFilled />
                </IconButton>
              </Tooltip>
              <Tooltip title="remove">
                <IconButton aria-label="remove" onClick={removeOnClicked} disabled={actionInProgress}>
                  <Delete color={actionInProgress ? 'disabled' : 'error'} />
                </IconButton>
              </Tooltip>
              </>
            }
            <Tooltip title="bookmark">
              <IconButton aria-label="bookmark">
                <BookmarkBorder />
              </IconButton>
            </Tooltip>
            <Tooltip title="explorer">
              <IconButton aria-label="explorer" disabled={actionInProgress}>
                <FolderOpen />
              </IconButton>
            </Tooltip>
            <Tooltip title="export">
              <IconButton aria-label="export" onClick={containerExport} disabled={actionInProgress}>
                <FolderZip />
              </IconButton>
            </Tooltip>
            <Tooltip title="rename">
              <IconButton aria-label="rename" onClick={() => setRenameVisible(true)} disabled={actionInProgress}>
                <Edit />
              </IconButton>
            </Tooltip>
          </Box>
          </CardActions>
        </Card>
      </Grid>
      <Grid size={3}>
        <Card className="w-100 h-80">
          <CardContent>
          </CardContent>
          <CardActions></CardActions>
        </Card>
      </Grid>
      <Grid size={3}>
        <Card className="w-100 h-80">
          <CardContent>
          </CardContent>
          <CardActions></CardActions>
        </Card>
      </Grid>
      <Grid size={3}>
        <Card className="w-100 h-80">
          <CardContent>
          </CardContent>
          <CardActions></CardActions>
        </Card>
      </Grid>
      <Grid size={12}>
        <Card sx={{ flex: 1, width: '100%', height: '100vh' }}>
          <CardContent className="p-5">
            <TabContext value={value}>
              <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                <TabList onChange={onTabChange}>
                  <Tab label="INFO" value="info" />
                  <Tab label="LOGS" value="logs" />
                  <Tab label="STATS" value="stats" />
                  <Tab label="TOP" value="top" />
                  <Tab label="TERMINAL" value="term" />
                </TabList>
              </Box>
              <TabPanel value="info" className="h-full overflow-auto px-5">
                <Box sx={{ height: '90vh', overflow: 'auto' }}>
                  <Accordion>
                    <AccordionSummary
                      expandIcon={<ArrowDownward />}
                      aria-controls="panel1-content"
                      id="panel1-header"
                    >
                      <Typography>Exposed Ports</Typography>
                    </AccordionSummary>
                    <AccordionDetails>
                    {exposedPorts.map((p, i) => (
                      <Typography key={i} variant="body2" className="text-lg">{ p }</Typography>
                    ))}
                    </AccordionDetails>
                  </Accordion>
                  <Accordion>
                    <AccordionSummary
                      expandIcon={<ArrowDownward />}
                      aria-controls="panel2-content"
                      id="panel2-header"
                    >
                      <Typography>Mounts</Typography>
                    </AccordionSummary>
                    <AccordionDetails>
                      {containerJson?.Mounts?.length ? containerJson?.Mounts?.map((m, i) => (
                        <Typography key={i}>{ m.Name }</Typography>
                      )) :
                      <Typography>
                        No items to show
                      </Typography>
                      }
                    </AccordionDetails>
                  </Accordion>
                  <Accordion>
                    <AccordionSummary
                      expandIcon={<ArrowDownward />}
                    >
                      <Typography>Inspect</Typography>
                    </AccordionSummary>
                    <AccordionDetails className="space-y-5">
                      <Button className="disabled:opacity-50 disabled:pointer-events-none" color="success" variant="outlined" onClick={inspect} disabled={inspecting}>Inspect</Button>
                      {inspecting ?
                        <p>loading</p> :
                        (containerJson && <JsonView value={containerJson} style={vscodeTheme} />)
                      }
                    </AccordionDetails>
                  </Accordion>
                </Box>
              </TabPanel>
              <TabPanel value="logs" className="h-full overflow-auto">Logs</TabPanel>
              <TabPanel value="stats" className="h-full overflow-auto">
                <div className="space-y-5">
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
                          <TableCell>{ statsJson?.cpu_stats.online_cpus }</TableCell>
                          <TableCell>{ statsJson?.cpu_stats.cpu_usage.total_usage }</TableCell>
                          <TableCell>{ statsJson?.cpu_stats.cpu_usage.usage_in_usermode }</TableCell>
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
                          <TableCell>{ statsJson?.memory_stats.usage }</TableCell>
                          <TableCell>{ statsJson?.memory_stats.limit }</TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </TableContainer>
                </div>
              </TabPanel>
              <TabPanel value="top" className="h-full overflow-auto">
                <Box sx={{ flexGrow: 1 }} className="h-full">
                  {container?.state === 'running' ? <TableContainer component={Paper}>
                    <Table sx={{ minWidth: 650 }} aria-label="top">
                      <TableHead>
                        <TableRow>
                          {topBody?.titles.map((t, i) => (
                            <TableCell key={i}>{ t }</TableCell>
                          ))}
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {topBody?.processes.map((p, i) => (
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
                  </TableContainer> :
                  <p>Container is not running</p>
                  }
                </Box>
              </TabPanel>
              <TabPanel value="term">Terminal</TabPanel>
            </TabContext>
          </CardContent>
          <CardActions></CardActions>
        </Card>
      </Grid>
    </Grid>
    {id &&
    <>
    {explorerVisible && <ContainerExplorerDialog cid={id} visible={explorerVisible} onClose={() => setExplorerVisible(false)} />}
    {renameVisible && <ContainerRenameDialog cid={id} name={containerName} visible={renameVisible} onClose={() => setRenameVisible(false)} />}
    {execVIsible && <ContainerExecDialog cid={id} visible={execVIsible} onClose={() => setExecVisible(false)} />}
    {diffVisible && <ContainerDiffDialog cid={id} name={containerName as string} diffs={[]} visible={diffVisible} onClose={() => setDiffVisible(false)} />}
    </>
    }
    </>
  );
}