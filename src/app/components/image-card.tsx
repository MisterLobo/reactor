'use client'

import Card from '@mui/material/Card';
import CardHeader from '@mui/material/CardHeader';
import CardContent from '@mui/material/CardContent';
import CardActions from '@mui/material/CardActions';
import Avatar from '@mui/material/Avatar';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import { red } from '@mui/material/colors';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import { Info, PlayCircleFilled } from '@mui/icons-material';
import { ImageSummary } from '../lib/bindings/ImageSummary';
import { useEffect, useMemo, useState } from 'react';
import RunContainerDialog from './modals/run-container';
import { Chip } from '@mui/material';
import { InspectObjectResponse } from '../lib/bindings/InspectObjectResponse';
import { invoke } from '@tauri-apps/api/tauri';
import InspectObjectDialog from './modals/inspect';

export type ImageCardProps = Partial<ImageSummary> & {
}
export default function ImageCard({ id, repo, size, created }: ImageCardProps) {
  // const { enqueueSnackbar, closeSnackbar } = useSnackbar();
  const [dateCreated, _setDateCreated] = useState(new Date(created as string))
  const [name, tag] = useMemo(() => repo?.split(':') as string[], []);
  const [runContainerVisible, setRunContainerVisible] = useState(false);
  const [inspectVisible, setInspectVisible] = useState(false);
  const [inspectJson, setInspectJson] = useState<Record<string, any>>({});

  useEffect(() => {
    console.log('[image]:', repo, name, tag);
  }, [repo, name, tag])

  const inspect = async () => {
    const resp: InspectObjectResponse = await invoke('image_inspect', { params: { id } });

    try {
      const parsedJson = JSON.parse(resp.json);
      console.log('[resjson]:', parsedJson);
      setInspectJson(parsedJson);
      setInspectVisible(true);
    } catch {
      console.error('cannot parse json string');
    }
  }

  return (
    <>
    <Card sx={{ width: 345 }}>
      <CardHeader
        avatar={
          <Avatar sx={{ bgcolor: red[500] }} aria-label="recipe">
            R
          </Avatar>
        }
        action={
          <IconButton aria-label="settings">
            <MoreVertIcon />
          </IconButton>
        }
        title={<span>{name} <Chip sx={{ ml: 1 }} label={tag} size="small" variant="outlined" color="primary" /></span>}
        subheader={dateCreated.toISOString()}
        className="text-wrap break-all"
      />
      <CardContent>
      <Typography variant="body2" color="text.secondary" className="break-all">{size}</Typography>
        <Typography variant="body2" color="text.secondary" className="break-all">{id}</Typography>
      </CardContent>
      <CardActions disableSpacing>
        <IconButton aria-label="run" onClick={() => setRunContainerVisible(true)}>
          <PlayCircleFilled />
        </IconButton>
        <IconButton aria-label="inspect" onClick={inspect}>
          <Info />
        </IconButton>
      </CardActions>
    </Card>
    {runContainerVisible && <RunContainerDialog image={repo as string} name={name as string} visible={runContainerVisible} onClose={() => setRunContainerVisible(false)} />}
    {inspectVisible && <InspectObjectDialog json={inspectJson} visible={inspectVisible} onClose={() => setInspectVisible(false)} />}
    </>
  );
}
