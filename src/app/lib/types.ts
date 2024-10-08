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