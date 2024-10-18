import { invoke } from '@tauri-apps/api/core';
import { io, Socket } from 'socket.io-client';

let _socket: Socket | undefined

export const getSocket = async () => {
  const host: string = await invoke('get_ws_host')
  if (!_socket) {
    _socket = io(`${host}/sub`)
    console.log('socket active: ', _socket.connected, _socket.active);
  }
  return _socket as Socket
}