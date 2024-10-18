/* export type ContainerSummary = {
  Names: string[],
  State: string,
  Status: string,
  Created: number,
  Id: string,
  Image: string,
  ImageID: string,
  Command: string,
  [key:string]: any,
}

export type ImageSummary = {
  Id: string,
  Created: number,
  Size: number,
  RepoTags: string[],
  RepoDigests: string[],
  [key:string]: any,
}

export type VolumeSummary = {
  Id: string,
  [key:string]: string,
}

export type NetworkSummary = {
  Id: string,
  [key:string]: string,
} */

export type ContainerStats = {
  id: string,
  name: string,
  num_procs: number,
  preread: string,
  read: string,
  cpu_stats: {
    cpu_usage: {
      total_usage: number,
      usage_in_kernelmode: number,
      usage_in_usermode: number,
    },
    system_cpu_usage: number,
    online_cpus: number,
    throttling_data: {
      periods: number,
      throttled_periods: number,
      throttled_time: number,
    },
  },
  memory_stats: {
    usage: number,
    stats: any,
    limit: number,
  },
  pids_stats: {
    current: number,
    limit: number,
  },
  blkio_stats: {
    io_service_bytes_recursive?: any,
    io_serviced_recursive?: any,
    io_queue_recursive?: any,
    io_service_time_recursive?: any,
    io_wait_time_recursive?: any,
  },
  network: Record<string, any>,
  precpu_stats: {
    cpu_usage: {
      total_usage: number,
      usage_in_kernelmode: number,
      usage_in_usermode: number,
    },
    system_cpu_usage: number,
    online_cpus: number,
    throttling_data: {
      periods: number,
      throttled_periods: number,
      throttled_time: number,
    },
  },
  storage_stats: Record<string, any>,
}

export type DockerEvent = {
  Type: 'container' | 'image' | 'network' | 'volume',
  Action: 'start' | 'stop' | 'die' | 'restart' | 'kill' | 'top' | 'pause' | 'unpause' | 'update' | 'detach' | 'destroy' | 'exec_create' | 'exec_detach' | 'exec_die' | 'exec_start' | 'export' | 'copy' | 'create' | 'commit' | 'attach' | 'connect',
  Actor?: {
    Attrs: Record<string, any>,
  },
  status?: string,
  name?: string,
  id?: string,
  from?: string,
  scope?: string,
  time?: number,
  timeNano?: number,
}

export type PortBinding = { HostIp: string, HostPort: string };
export type PortBindings = Record<string, PortBinding[]>;
export type MountPoint = {
  Name: string,
  Type: string,
  Source: string,
  Destination: string,
  Driver: string,
  Mode: string,
  RW: boolean,
  Propagation: string,
}

export type ContainerJson = {
  Id: string,
  Name: string,
  Path?: string,
  Args?: string[],
  Image?: string,
  Created?: string,
  Mounts?: MountPoint[],
  State?: {
    Status: string,
    Running: boolean,
    Paused: boolean,
    Restarting: boolean,
    OOMKilled: boolean,
    Dead: boolean,
    Pid: number,
    ExitCode: number,
    Error: string,
    StartedAt: string,
    FinishedAt: string,
  },
  HostConfig?: {
    Binds?: string[],
    PortBindings?: PortBindings,
  } & Record<string, any>,
  Config?: {
    Hostname?: string,
    Domainname?: string,
    User?: string,
    AttachStdin?: boolean,
    AttachStdout?: boolean,
    AttachStderr?: boolean,
    Tty?: boolean,
    OpenStdin?: boolean,
    StdinOnce?: boolean,
    Env?: string[],
    Cmd?: string[],
    Image?: string,
    WorkingDir?: string,
    Entrypoint?: string,
    ExposedPorts?: Record<string, any>,
    Volumes?: Record<string, any>[],
  } & Record<string, any>,
  NetworkSettings?: {
    MacAddress?: string,
    IPAddress?: string,
  } & Record<string, any>,
  Platform?: string,
  ResolveConfPath?: string,
  HostnamePath?: string,
  HostsPath?: string,
  LogPath?: string,
  RestartCount?: number,
  ExecIDs?: string[],
} & {[key:string]: any}