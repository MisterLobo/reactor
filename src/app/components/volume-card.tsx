'use client'

import { useState } from 'react';
import Card from '@mui/material/Card';
import CardHeader from '@mui/material/CardHeader';
import CardContent from '@mui/material/CardContent';
import CardActions from '@mui/material/CardActions';
import Avatar from '@mui/material/Avatar';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import { red } from '@mui/material/colors';
import FavoriteIcon from '@mui/icons-material/Favorite';
import ShareIcon from '@mui/icons-material/Share';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import { Info, Storage } from '@mui/icons-material';
import InspectObjectDialog from './modals/inspect';
import { InspectObjectResponse } from '../lib/bindings/InspectObjectResponse';
import { invoke } from '@tauri-apps/api/core';

export type VolumeCardProps = {
  id: string,
  name?: string,
  created?: string,
  mountPoint?: string,
}
export default function VolumeCard({ id, name, created, mountPoint }: VolumeCardProps) {
  const [inspectVisible, setInspectVisible] = useState(false);
  const [inspectJson, setInspectJson] = useState<Record<string, any>>({});

  const inspect = async () => {
    const resp: InspectObjectResponse = await invoke('volume_inspect', { params: { id } });

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
    <Card sx={{ width: 345 }} className="flex flex-col relative space-y-2">
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
        title={name}
        subheader={created}
        className="break-all h-max"
      />
      <CardContent className="h-32">
        <Typography variant="body2" color="text.secondary" className="break-all">
          <Storage className="mr-2" />
          {mountPoint}
        </Typography>
      </CardContent>
      <CardActions disableSpacing className="absolute bottom-0">
        <IconButton aria-label="add to favorites" disabled>
          <FavoriteIcon />
        </IconButton>
        <IconButton aria-label="share" disabled>
          <ShareIcon />
        </IconButton>
        <IconButton aria-label="inspect" onClick={inspect}>
          <Info />
        </IconButton>
      </CardActions>
    </Card>
    <InspectObjectDialog json={inspectJson} visible={inspectVisible} onClose={() => setInspectVisible(false)} />
    </>
  );
}
