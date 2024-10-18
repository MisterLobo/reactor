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
import { Info } from '@mui/icons-material';
import { invoke } from '@tauri-apps/api/core';
import InspectObjectDialog from './modals/inspect';
import { InspectObjectResponse } from '../lib/bindings/InspectObjectResponse';
import { useState } from 'react';

export type NetworkCardProps = {
  id: string,
  name?: string,
  created?: string,
  ports?: string[],
}
export default function NetworkCard({ id, name, created, ports }: NetworkCardProps) {
  const [inspectVisible, setInspectVisible] = useState(false);
  const [inspectJson, setInspectJson] = useState<Record<string, any>>({});
  const inspect = async () => {
    const resp: InspectObjectResponse = await invoke('network_inspect', { params: { id } });

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
        title={name}
        subheader={created}
        className="text-wrap break-all"
      />
      <CardContent>
        <Typography component="p" className="w-full break-all">{id}</Typography>
        {ports?.map((p, i) => (
          <Typography key={i}>{p}</Typography>
        ))}
      </CardContent>
      <CardActions disableSpacing>
        {/* <IconButton aria-label="inspect" onClick={inspect}>
          <PlayCircleFilled />
        </IconButton> */}
        <IconButton aria-label="inspect" onClick={inspect}>
          <Info />
        </IconButton>
      </CardActions>
    </Card>
    <InspectObjectDialog json={inspectJson} visible={inspectVisible} onClose={() => setInspectVisible(false)} />
    </>
  );
}
