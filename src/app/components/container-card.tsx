import Card from '@mui/material/Card';
import CardHeader from '@mui/material/CardHeader';
import CardContent from '@mui/material/CardContent';
import CardActions from '@mui/material/CardActions';
import Avatar from '@mui/material/Avatar';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import { Apps, BookmarkBorder, Code, Dangerous, Delete, Difference, Edit, FolderOpen, FolderZip, History, Info, PlayCircleFilled, QueryStats, RestartAlt, Schedule, Source, Stop, Terminal } from '@mui/icons-material';
import { useCallback, useEffect, useState } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { ContainerStopResponse } from '../lib/bindings/ContainerStopResponse';
import InspectObjectDialog from './modals/inspect';
import { InspectObjectResponse } from '../lib/bindings/InspectObjectResponse';
import ContainerTopDialog from './modals/top';
import ContainerExplorerDialog from './modals/container-explorer';
import { Box, Tooltip } from '@mui/material';
import ContainerStatsDialog from './modals/container-stats';
import ContainerLogsDialog from './modals/container-logs';
import ContainerRenameDialog from './modals/container-rename';
import { save } from '@tauri-apps/plugin-dialog';
import { ContainerExportParams } from '@/bindings/ContainerExportParams';
import { listen } from '@tauri-apps/api/event';
import { ContainerDiffResponse } from '@/bindings/ContainerDiffResponse';
import ContainerExecDialog from './modals/container-exec';
import { Link } from 'react-router-dom';
import { ContainerStartResponse } from '@/bindings/ContainerStartResponse';
import { ContainerKillParams } from '@/bindings/ContainerKillParams';
import { ContainerRemoveParams } from '@/bindings/ContainerRemoveParams';
import { ContainerStatsParams } from '@/bindings/ContainerStatsParams';
import { ContainerStats } from '../lib/types';
import { ContainerDiffParams } from '@/bindings/ContainerDiffParams';
import { ContainerStatsResponse } from '@/bindings/ContainerStatsResponse';
import { ContainerTopParams } from '@/bindings/ContainerTopParams';
import { ContainerTopResponse } from '@/bindings/ContainerTopResponse';
import { ContainerTopBody } from '@/bindings/ContainerTopBody';
import { ContainerDiff } from '@/bindings/ContainerDiff';
import ContainerDiffDialog from './modals/container-diff';
import { ContainerRestartParams } from '@/bindings/ContainerRestartParams';

export type ContainerCardProps = {
  name: string,
  command: string,
  created?: string,
  id: string,
  image?: string,
  imageId?: string,
  status?: string,
  state?: string,
}
export default function ContainerCard({ name, id, created, command, state, status, image }: ContainerCardProps) {
  const [containerName, setContainerName] = useState(name);
  const [containerState, setContainerState] = useState(state);
  const [containerStatus, setContainerStatus] = useState(status);
  const [actionInProgress, setActionInProgress] = useState(false);
  const [inspectVisible, setInspectVisible] = useState(false);
  const [topVisible, setTopVisible] = useState(false);
  const [explorerVisible, setExplorerVisible] = useState(false);
  const [statsVisible, setStatsVisible] = useState(false);
  const [logsVisible, setLogsVisible] = useState(false);
  const [renameVisible, setRenameVisible] = useState(false);
  const [execVIsible, setExecVisible] = useState(false);
  const [diffVisible, setDiffVisible] = useState(false);
  const [_filePath, setFilePath] = useState<string>();
  const [_subscribed, setSubscribed] = useState(false);

  const [inspectJson, setInspectJson] = useState<Record<string, any>>({});
  const [statsJson, setStatsJson] = useState<ContainerStats>();
  const [topBody, setTopBody] = useState<ContainerTopBody>();
  const [diffs, setDiffs] = useState<ContainerDiff[]>([]);

  const start = useCallback(async () => {
    const res: ContainerStartResponse = await invoke('container_start', { params: { id } });
    console.log('[start#res]:', res);
    // setContainerState(res.status as string)
    // setActionInProgress(false)
  }, [id])
  const stop = useCallback(async () => {
    const res: ContainerStopResponse = await invoke('container_stop', { params: { id }});
    console.log('[stop#res]:', res);
    // setContainerState(res.status as string)
    // setActionInProgress(false);
  }, [id])
  const restart = useCallback(async () => {
    const params: ContainerRestartParams = {
      id,
    };
    await invoke('container_restart', { params });
  }, [])
  const kill = useCallback(async () => {
    const params: ContainerKillParams = {
      id,
    };
    await invoke('container_kill', { params });
    /* if (res) {
      setActionInProgress(true);
    } */
  }, [id]);
  const remove = useCallback(async () => {
    const params: ContainerRemoveParams = {
      id,
      force: false,
    };
    await invoke('container_remove', { params });
  }, [id])
  const stats = useCallback(async () => {
    const params = {
      id,
    } as ContainerStatsParams;
    const { stats = '{}' } = await invoke('container_stats', { params }) as ContainerStatsResponse;
    const sjson = JSON.parse(stats ?? '{}') as ContainerStats;
    console.log('[stats]:', sjson);
    setStatsJson(sjson);
    setActionInProgress(false);
  }, [id])
  const top = useCallback(async () => {
    const params = {
      id,
    } as ContainerTopParams;
    const { top } = await invoke('container_top', { params }) as ContainerTopResponse;
    console.log('[top]:', top);
    setTopBody(top as ContainerTopBody);
    setActionInProgress(false);
    setTopVisible(true);
  }, [id])
  const diff = useCallback(async () => {
    const params = {
      id,
    } as ContainerDiffParams;
    const { diffs } = await invoke('container_diff', { params }) as ContainerDiffResponse;
    console.log('[diffs]:', diffs);
    setDiffs(diffs as ContainerDiff[]);
    setActionInProgress(false);
    setDiffVisible(true);
  }, [id])
  const logs = useCallback(async () => {
    await invoke('container_logs', { params: { id } });
  }, [id])

  useEffect(() => {
    // console.log('[cid]:', id);
    const listeners = async () => {
      await listen<{ id: string, cid: string }>('subbed', ({ payload }) => {
        if (payload.cid === id) {
          console.log('[subbed#backend]:', payload);
        }
      });
      await listen<{ id: string, state: string, status: string }>('started', ({ payload }) => {
        if (payload.id === id) {
          console.log('[started]:', payload);
          setContainerState(payload.state);
          setContainerStatus(payload.status)
          setActionInProgress(false);
        }
      });
      await listen<{id: string, state: string, status: string }>('stopped', ({ payload }) => {
        // console.log('[stopped]:', payload);
        if (payload.id === id) {
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
      const subbed = await invoke('subscribe_container', { params: { id, ns: '/container' } }) as boolean;
      setSubscribed(subbed);
  
      return subbed;
    }
    listeners();
    subscribe()
      .then(subbed => {
        console.log('[subbed#api]:', subbed);
      })
      .catch(console.error)
    const setupEventListeners = async () => {
      const unlisten = await listen('export:status', status => {
        console.log('[status]:', status);
      });
      return unlisten;
    }
    const unlisten = setupEventListeners(); //.catch(console.error)
    return () => {
      unlisten.then(fn => fn());
    }
  }, [id]);

  const startOnClicked = async () => {
    setActionInProgress(true);
    start().catch(console.error);
  }

  const stopOnClicked = async () => {
    setActionInProgress(true);
    stop().catch(console.error);
  }

  const statsOnClicked = async () => {
    setActionInProgress(true)
    stats()
      .then(_ => {
        setStatsVisible(true);
      })
      .catch(console.error)
  }

  const inspect = useCallback(async () => {
    const resp: InspectObjectResponse = await invoke('container_inspect', { params: { id } });

    try {
      const parsedJson = JSON.parse(resp.json);
      // console.log('[resjson]:', parsedJson);
      setInspectJson(parsedJson);
      setInspectVisible(true);
    } catch {
      console.error('cannot parse json string');
    }
  }, [id]);

  const containerRename = async () => {
    setRenameVisible(true);
  }

  const containerLogs = async () => {
    logs().catch(console.error)
    setLogsVisible(true);
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

  const diffOnClicked = async () => {
    setActionInProgress(true);
    diff().catch(console.error);
  }
  const topOnClicked = async () => {
    setActionInProgress(true);
    top().catch(console.error);
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
    console.log('[filepath]:', filePath);

    setFilePath(filePath as string);
    if (filePath) {
      const params: ContainerExportParams = {
        id,
        file_path: filePath,
      };
      invoke('container_export', { params });
    }
  }, [id])

  return (
    <>
    <Card sx={{ width: 345 }}>
      <CardHeader
        avatar={
          <Avatar aria-label="recipe">
            { containerName[0].toUpperCase() }
          </Avatar>
        }
        action={
          <IconButton aria-label="settings">
            <MoreVertIcon />
          </IconButton>
        }
        title={<Link to={{
          pathname: '/containers/details',
          search: `?cid=${id}`,
        }}>{ containerName }</Link>}
        subheader={created}
        className="break-all"
      />
      <CardContent className="space-y-2 h-48">
        <Typography variant="body2" color="text.secondary" className="break-all">
          <Info className="mr-2" />
          {id}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          <Schedule className="mr-2" />
          {containerState} ({containerStatus})
        </Typography>
        <Typography variant="body2" color="text.secondary">
          <Code className="mr-2" />
          {command}
        </Typography>
        <Typography variant="body2" color="text.secondary" className="break-all">
          <Source className="mr-2" />
          {image}
        </Typography>
      </CardContent>
      <CardActions disableSpacing>
        <Box component="div">
          {containerState === 'running' ?
            <>
            <Tooltip title="stop">
              <IconButton aria-label="stop" onClick={stopOnClicked} color="error" disabled={actionInProgress}>
                <Stop />
              </IconButton>
            </Tooltip>
            <Tooltip title="kill">
              <IconButton aria-label="kill" onClick={killOnClicked} color="error" disabled={actionInProgress}>
                <Dangerous />
              </IconButton>
            </Tooltip>
            <Tooltip title="restart">
              <IconButton aria-label="restart" onClick={restartOnClicked} color="success" disabled={actionInProgress}>
                <RestartAlt />
              </IconButton>
            </Tooltip>
            <Tooltip title="exec">
              <IconButton aria-label="exec" onClick={() => setExecVisible(true)} disabled={actionInProgress}>
                <Terminal />
              </IconButton>
            </Tooltip>
            <Tooltip title="stats">
              <IconButton aria-label="stats" onClick={statsOnClicked} disabled={actionInProgress}>
                <QueryStats />
              </IconButton>
            </Tooltip>
            <Tooltip title="top">
              <IconButton aria-label="top" onClick={topOnClicked} disabled={actionInProgress}>
                <Apps />
              </IconButton>
            </Tooltip>
            <Tooltip title="diff">
              <IconButton aria-label="diff" onClick={diffOnClicked} disabled={actionInProgress}>
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
          <Tooltip title="inspect">
            <IconButton aria-label="inspect" onClick={inspect} disabled={actionInProgress}>
              <Info />
            </IconButton>
          </Tooltip>
          <Tooltip title="logs">
            <IconButton aria-label="logs" onClick={containerLogs} disabled={actionInProgress}>
              <History />
            </IconButton>
          </Tooltip>
          <Tooltip title="bookmark">
            <IconButton aria-label="bookmark">
              <BookmarkBorder />
            </IconButton>
          </Tooltip>
          <Tooltip title="explorer">
            <IconButton aria-label="explorer" onClick={() => setExplorerVisible(true)} disabled={actionInProgress}>
              <FolderOpen />
            </IconButton>
          </Tooltip>
          <Tooltip title="export">
            <IconButton aria-label="export" onClick={containerExport} disabled={actionInProgress}>
              <FolderZip />
            </IconButton>
          </Tooltip>
          <Tooltip title="rename">
            <IconButton aria-label="rename" onClick={containerRename} disabled={actionInProgress}>
              <Edit />
            </IconButton>
          </Tooltip>
        </Box>
      </CardActions>
    </Card>
    {id &&
    <>
    {inspectVisible && <InspectObjectDialog json={inspectJson} visible={inspectVisible} onClose={() => setInspectVisible(false)} />}
    {topVisible && <ContainerTopDialog cid={id} name={name} top={topBody as ContainerTopBody} visible={topVisible} onClose={() => setTopVisible(false)} />}
    {explorerVisible && <ContainerExplorerDialog cid={id} visible={explorerVisible} onClose={() => setExplorerVisible(false)} />}
    {renameVisible && <ContainerRenameDialog cid={id} name={name} visible={renameVisible} onClose={() => setRenameVisible(false)} />}
    {statsVisible && <ContainerStatsDialog cid={id} name={name} stats={statsJson as ContainerStats} visible={statsVisible} onClose={() => setStatsVisible(false)} />}
    {logsVisible && <ContainerLogsDialog cid={id} visible={logsVisible} onClose={() => setLogsVisible(false)} />}
    {execVIsible && <ContainerExecDialog cid={id} visible={execVIsible} onClose={() => setExecVisible(false)} />}
    {diffVisible && <ContainerDiffDialog cid={id} name={name} diffs={diffs as ContainerDiff[]} visible={diffVisible} onClose={() => setDiffVisible(false)} />}
    </>
    }
    </>
  );
}
