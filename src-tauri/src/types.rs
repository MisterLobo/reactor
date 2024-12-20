use std::{collections::HashMap, num::NonZeroU16};

use reqwest::StatusCode;
use serde::{Deserialize, Serialize};
use ts_rs::TS;

#[derive(Debug, thiserror::Error)]
pub enum Error {
  #[error(transparent)]
  Io(#[from] std::io::Error),
  #[error(transparent)]
  Req(#[from] reqwest::Error),
  #[error(transparent)]
  Zip(#[from] zip::result::ZipError),
  #[error(transparent)]
  Sock(#[from] rust_socketio::Error),
}

impl serde::Serialize for Error {
  fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
  where
    S: serde::Serializer,
  {
    serializer.serialize_str(self.to_string().as_ref())
  }
}

pub trait Convert<T> {
  fn convert_to_json(self: &'static Self) -> T;
}

pub trait Payload<T> {
  fn payload(&self) -> T;
}

#[derive(Debug, Deserialize, Serialize, TS, Clone)]
#[ts(export, export_to = "../../src/app/lib/bindings/")]
pub struct ContainerSummary {
  id: String,
  name: String,
  image: String,
  command: String,
  state: Option<String>,
  status: Option<String>,
  created: Option<String>,
}

#[derive(Debug, Deserialize, Serialize, TS, Clone)]
#[ts(export, export_to = "../../src/app/lib/bindings/")]
pub struct ImageSummary {
  id: String,
  repo: Option<String>,
  created: Option<String>,
  size: Option<String>,
}

#[derive(Debug, Deserialize, Serialize, TS, Clone)]
#[ts(export, export_to = "../../src/app/lib/bindings/")]
pub struct VolumeSummary {
  id: Option<String>,
  name: Option<String>,
  created: Option<String>,
  mount_point: Option<String>,
}

#[derive(Debug, Deserialize, Serialize, TS, Clone)]
#[ts(export, export_to = "../../src/app/lib/bindings/")]
pub struct NetworkSummary {
  id: Option<String>,
  name: Option<String>,
  created: Option<String>,
  ports: Option<Vec<String>>,
}

#[derive(Debug, Deserialize, Serialize, TS, Clone)]
#[ts(export, export_to = "../../src/app/lib/bindings/")]
pub struct ContainerListParams {
  pub all: bool,
}

#[derive(Debug, Deserialize, Serialize, TS, Clone)]
#[ts(export, export_to = "../../src/app/lib/bindings/")]
pub struct ImageListParams {
  pub all: bool,
}

#[derive(Debug, Deserialize, Serialize, TS, Clone)]
#[ts(export, export_to = "../../src/app/lib/bindings/")]
pub struct ContainerGetParams {
  pub id: String,
  pub name: Option<String>,
}

#[derive(Debug, Deserialize, Serialize, TS, Clone)]
#[ts(export, export_to = "../../src/app/lib/bindings/")]
pub struct ContainerGetResponse {
  pub data: Option<ContainerSummary>,
  pub error: Option<String>,
}

#[derive(Debug, Deserialize, Serialize, TS, Clone)]
#[ts(export, export_to = "../../src/app/lib/bindings/")]
pub struct ContainerStartParams {
  pub id: String,
}

#[derive(Debug, Deserialize, Serialize, TS, Clone)]
#[ts(export, export_to = "../../src/app/lib/bindings/")]
pub struct ContainerStopParams {
  pub id: String,
}

#[derive(Debug, Deserialize, Serialize, TS, Clone)]
#[ts(export, export_to = "../../src/app/lib/bindings/")]
pub struct ContainerLogsParams {
  pub id: String,
}

#[derive(Debug, Deserialize, Serialize, TS, Clone)]
#[ts(export, export_to = "../../src/app/lib/bindings/")]
pub struct ContainerTopParams {
  pub id: String,
  pub ps_args: Option<String>,
}

#[derive(Debug, Deserialize, Serialize, TS, Clone)]
#[ts(export, export_to = "../../src/app/lib/bindings/")]
pub struct InspectObjectParams {
  pub id: String,
}

#[derive(Debug, Deserialize, Serialize, TS, Clone)]
#[ts(export, export_to = "../../src/app/lib/bindings/")]
pub struct InspectObjectResponse {
  pub json: String,
}

#[derive(Debug, Deserialize, Serialize, TS, Clone)]
#[ts(export, export_to = "../../src/app/lib/bindings/")]
pub struct ContainerRunParams {
  pub image: String,
  pub name: Option<String>,
  pub cmd: Option<String>,
  pub tty: Option<bool>,
  pub stdin: Option<bool>,
  pub stdout: Option<bool>,
  pub stderr: Option<bool>,
  pub interactive: Option<bool>,
  pub detach: Option<bool>,
  pub expose_all_ports: Option<bool>,
  pub auto_remove: Option<bool>,
  pub user: Option<String>,
  pub env: Vec<String>,
  pub working_dir: Option<String>,
  pub shell: Option<String>,
  pub binds: Option<Vec<String>>,
  pub volumes: Option<HashMap<String, MountPoint>>,
  pub port_bindings: Option<HashMap<String, Vec<PortBinding>>>,
  pub exposed_ports: Option<HashMap<String, Struct>>,
  pub explorable: Option<bool>,
  pub ssh: Option<bool>,
}

#[derive(Debug, Deserialize, Serialize, TS, Clone)]
#[ts(export, export_to = "../../src/app/lib/bindings/")]
pub struct Struct {}

#[derive(Debug, Deserialize, Serialize, TS, Clone)]
#[ts(export, export_to = "../../src/app/lib/bindings/")]
pub struct ImagePullParams {
  pub repo: String,
  pub tag: Option<String>,
}

#[derive(Debug, Deserialize, Serialize, TS, Clone)]
#[ts(export, export_to = "../../src/app/lib/bindings/")]
pub struct ImageBuildParams {
  pub path: String,
  pub tag: Option<String>,
  pub quiet: Option<bool>,
}

#[derive(Debug, Deserialize, Serialize, TS, Clone)]
#[ts(export, export_to = "../../src/app/lib/bindings/")]
#[serde(rename_all = "snake_case")]
pub struct ContainerStartResponse {
  pub id: Option<String>,
  pub status: Option<String>,
  pub error: Option<String>,
  pub state: Option<String>,
}

#[derive(Debug, Deserialize, Serialize, TS, Clone)]
#[ts(export, export_to = "../../src/app/lib/bindings/")]
#[serde(rename_all = "snake_case")]
pub struct ContainerStopResponse {
  pub status: Option<String>,
  pub error: Option<String>,
  pub state: Option<String>,
}

#[derive(Debug, Deserialize, Serialize, TS, Clone)]
#[ts(export, export_to = "../../src/app/lib/bindings/")]
#[serde(rename_all = "snake_case")]
pub struct ContainerRunResponse {
  pub id: Option<String>,
  pub name: Option<String>,
  pub status: Option<String>,
  pub error: Option<String>,
}

#[derive(Debug, Deserialize, Serialize, TS, Clone)]
#[ts(export, export_to = "../../src/app/lib/bindings/")]
pub struct ContainerRestartParams {
  pub id: String,
}

#[derive(Debug, Deserialize, Serialize, TS, Clone)]
#[ts(export, export_to = "../../src/app/lib/bindings/")]
pub struct ContainerRestartResponse {
  pub id: Option<String>,
  pub status: Option<String>,
  pub error: Option<String>,
}

#[derive(Debug, Deserialize, Serialize, TS, Clone)]
#[ts(export, export_to = "../../src/app/lib/bindings/")]
pub struct ImagePullResponse {
  pub repo: Option<String>,
  pub error: Option<String>,
  pub status: Option<String>,
  pub logs: Option<String>,
}

#[derive(Debug, Deserialize, Serialize, TS, Clone)]
#[ts(export, export_to = "../../src/app/lib/bindings/")]
pub struct ProgressDetail {
  current: i64,
  total: i64,
}

pub enum ImagePullProgressStatus {
  Downloading,
}

#[derive(Debug, Deserialize, Serialize, TS, Clone)]
#[ts(export, export_to = "../../src/app/lib/bindings/")]
#[serde(rename_all = "camelCase")]
pub struct ImagePullProgress {
  id: Option<String>,
  status: String,
  progress_detail: Option<ProgressDetail>,
  progress: Option<String>,
}

#[derive(Debug, Deserialize, Serialize, TS, Clone)]
#[ts(export, export_to = "../../src/app/lib/bindings/")]
pub struct ImageBuildResponse {
  pub id: Option<String>,
  pub error: Option<String>,
}

#[derive(Debug, Deserialize, Serialize, TS, Clone)]
#[ts(export, export_to = "../../src/app/lib/bindings/")]
pub struct ContainerLogsResponse {
  pub logs: Option<String>,
  pub error: Option<String>,
}

#[derive(Debug, Deserialize, Serialize, TS, Clone)]
#[ts(export, export_to = "../../src/app/lib/bindings/")]
#[serde(rename_all = "snake_case")]
pub struct ContainerTopBody {
  titles: Vec<String>,
  processes: Vec<Vec<String>>,
}

#[derive(Debug, Deserialize, Serialize, TS, Clone)]
#[ts(export, export_to = "../../src/app/lib/bindings/")]
pub struct ContainerTopResponse {
  pub top: Option<ContainerTopBody>,
  pub error: Option<String>,
}

#[derive(Debug, Deserialize, Serialize, TS, Clone)]
#[ts(export, export_to = "../../src/app/lib/bindings/")]
pub struct ContainerDiffParams {
  pub id: String,
}

#[derive(Debug, Deserialize, Serialize, TS, Clone)]
#[ts(export, export_to = "../../src/app/lib/bindings/")]
pub struct ContainerStatsParams {
  pub id: String,
  pub decode: Option<bool>,
  pub stream: Option<bool>,
}

#[derive(Debug, Deserialize, Serialize, TS, Clone)]
#[ts(export, export_to = "../../src/app/lib/bindings/")]
pub struct ContainerExportParams {
  pub id: String,
  pub file_path: String,
}

#[derive(Debug, Deserialize, Serialize, TS, Clone)]
#[ts(export, export_to = "../../src/app/lib/bindings/")]
pub struct ContainerGetArchiveParams {
  pub id: String,
  pub src_path: String,
}

#[derive(Debug, Deserialize, Serialize, TS, Clone)]
#[ts(export, export_to = "../../src/app/lib/bindings/")]
pub struct ContainerArchiveParams {
  pub id: String,
  pub src: String,
  pub dest: String,
}

#[derive(Debug, Deserialize, Serialize, TS, Clone)]
#[ts(export, export_to = "../../src/app/lib/bindings/")]
pub struct ContainerRenameParams {
  pub id: String,
  pub new_name: String,
}

#[derive(Debug, Deserialize, Serialize, TS, Clone)]
#[ts(export, export_to = "../../src/app/lib/bindings/")]
pub struct ContainerKillParams {
  pub id: String,
}

#[derive(Debug, Clone, Deserialize, Serialize, TS)]
#[ts(export, export_to = "../../src/app/lib/bindings/")]
pub struct ContainerCommandParams {
  pub id: String,
  pub ns: String,
}

#[derive(Debug, Deserialize, Serialize, TS, Clone)]
#[ts(export, export_to = "../../src/app/lib/bindings/")]
pub struct ContainerCommandResponse {
  pub id: Option<String>,
  pub status: Option<String>,
}

#[derive(Debug, Deserialize, Serialize, TS, Clone)]
#[ts(export, export_to = "../../src/app/lib/bindings/")]
pub struct ContainerExecParams {
  pub id: Option<String>,
  pub cmd: String,
  pub tty: Option<bool>,
  pub stdout: Option<bool>,
  pub stdin: Option<bool>,
  pub stderr: Option<bool>,
  pub detach: Option<bool>,
  pub stream: Option<bool>,
  pub socket: Option<bool>,
  pub privileged: Option<bool>,
  pub demux: Option<bool>,
  pub environment: Option<String>,
  pub workdir: Option<String>,
  pub user: Option<String>,
}

#[derive(Debug, Deserialize, Serialize, TS, Default)]
#[ts(export, export_to = "../../src/app/lib/bindings/")]
pub struct ContainerExecBuilder {
  id: Option<String>,
  cmd: Option<String>,
  tty: Option<bool>,
  stdout: Option<bool>,
  stdin: Option<bool>,
  stderr: Option<bool>,
  detach: Option<bool>,
  stream: Option<bool>,
  socket: Option<bool>,
  privileged: Option<bool>,
  demux: Option<bool>,
  environment: Option<String>,
  workdir: Option<String>,
  user: Option<String>,
}

impl ContainerExecParams {
  pub fn builder() -> ContainerExecBuilder {
    ContainerExecBuilder::new()
  }
}

impl ContainerExecBuilder {
  pub fn new() -> ContainerExecBuilder {
    ContainerExecBuilder::default()
  }
  pub fn id(mut self, value: String) -> ContainerExecBuilder {
    self.id = Some(value);
    self
  }
  pub fn cmd(mut self, value: String) -> ContainerExecBuilder {
    self.cmd = Some(value);
    self
  }
  pub fn tty(mut self, value: bool) -> ContainerExecBuilder {
    self.tty = Some(value);
    self
  }
  pub fn stdout(mut self, value: bool) -> ContainerExecBuilder {
    self.stdout = Some(value);
    self
  }
  pub fn stdin(mut self, value: bool) -> ContainerExecBuilder {
    self.stdin = Some(value);
    self
  }
  pub fn stderr(mut self, value: bool) -> ContainerExecBuilder {
    self.stderr = Some(value);
    self
  }
  pub fn detach(mut self, value: bool) -> ContainerExecBuilder {
    self.detach = Some(value);
    self
  }
  pub fn stream(mut self, value: bool) -> ContainerExecBuilder {
    self.stream = Some(value);
    self
  }
  pub fn socket(mut self, value: bool) -> ContainerExecBuilder {
    self.socket = Some(value);
    self
  }
  pub fn privileged(mut self, value: bool) -> ContainerExecBuilder {
    self.privileged = Some(value);
    self
  }
  pub fn demux(mut self, value: bool) -> ContainerExecBuilder {
    self.demux = Some(value);
    self
  }
  pub fn environment(mut self, value: String) -> ContainerExecBuilder {
    self.environment = Some(value);
    self
  }
  pub fn workdir(mut self, value: String) -> ContainerExecBuilder {
    self.workdir = Some(value);
    self
  }
  pub fn user(mut self, value: String) -> ContainerExecBuilder {
    self.user = Some(value);
    self
  }
  pub fn build(self) -> ContainerExecParams {
    ContainerExecParams {
      id: self.id,
      cmd: self.cmd.unwrap(),
      tty: self.tty,
      stdout: self.stdout,
      stdin: self.stdin,
      stderr: self.stderr,
      detach: self.detach,
      stream: self.stream,
      socket: self.socket,
      privileged: self.privileged,
      demux: self.demux,
      environment: self.environment,
      workdir: self.workdir,
      user: self.user,
    }
  }
}

impl Payload<ContainerExecParams> for ContainerExecParams {
  fn payload(&self) -> ContainerExecParams {
    ContainerExecParams {
      id: None,
      cmd: self.cmd.clone(),
      stdout: self.stdout,
      stdin: self.stdin,
      stderr: self.stderr,
      tty: self.tty,
      detach: self.detach,
      stream: self.stream,
      socket: self.socket,
      demux: self.demux,
      environment: self.environment.clone(),
      user: self.user.clone(),
      workdir: self.workdir.clone(),
      privileged: self.privileged,
    }
  }
}

#[derive(Debug, Deserialize, Serialize, TS, Clone)]
#[ts(export, export_to = "../../src/app/lib/bindings/")]
pub struct ContainerExecCommandParams {
  pub cmd: String,
  pub working_dir: String,
}

#[derive(Debug, Deserialize, Serialize, TS, Clone)]
#[ts(export, export_to = "../../src/app/lib/bindings/")]
pub struct ContainerLsParams {
  pub id: String,
  pub path: Option<String>,
}

#[derive(Debug, Deserialize, Serialize, TS, Clone)]
#[ts(export, export_to = "../../src/app/lib/bindings/")]
pub struct ContainerCommonParams {
  pub id: String,
}

#[derive(Debug, Deserialize, Serialize, TS, Clone)]
#[ts(export, export_to = "../../src/app/lib/bindings/")]
pub struct ContainerFileInfo {
  name: Option<String>,
  file_type: Option<String>,
  owner: Option<String>,
  group: Option<String>,
  size: Option<i32>,
  created: Option<String>,
  modified: Option<String>,
  perm: Option<String>,
  is_dir: Option<bool>,
  path: Option<String>,
  parent: Option<String>,
  real_path: Option<String>,
  id: Option<String>,
}

#[derive(Debug, Deserialize, Serialize, TS, Clone)]
#[ts(export, export_to = "../../src/app/lib/bindings/")]
pub struct ContainerLsResponse {
  pub items: Vec<ContainerFileInfo>,
  count: Option<i32>,
  dirs: Option<i32>,
  files: Option<i32>,
}

#[derive(Debug, Deserialize, Serialize, TS, Clone)]
#[ts(export, export_to = "../../src/app/lib/bindings/")]
pub struct ContainerRenameResponse {
  pub id: Option<String>,
}

#[derive(Debug, Deserialize, Serialize, TS, Clone)]
#[ts(export, export_to = "../../src/app/lib/bindings/")]
pub struct ContainerRemoveParams {
  pub id: String,
  pub force: bool,
}

#[derive(Debug, Deserialize, Serialize, TS, Clone)]
#[ts(export, export_to = "../../src/app/lib/bindings/")]
pub struct ConnectionUpsertBody {
  name: String,
  socket_type: String,
  socket_address: Option<String>,
  is_default: Option<bool>,
}

#[derive(Debug, Deserialize, Serialize, TS, Clone)]
#[ts(export, export_to = "../../src/app/lib/bindings/")]
pub struct ConnectionCreateParams {
  pub name: String,
  pub socket_type: String,
  pub socket_address: Option<String>,
  pub is_default: Option<bool>,
}

#[derive(Debug, Deserialize, Serialize, TS, Clone)]
#[ts(export, export_to = "../../src/app/lib/bindings/")]
pub struct ConnectionUpdateParams {
  pub id: String,
  pub name: Option<String>,
  pub socket_type: Option<String>,
  pub socket_address: Option<String>,
  pub is_default: Option<bool>,
}

impl Payload<ConnectionUpsertBody> for ConnectionUpdateParams {
  fn payload(&self) -> ConnectionUpsertBody {
    ConnectionUpsertBody {
        name: self.name.clone().unwrap(),
        socket_type: self.socket_type.clone().unwrap(),
        socket_address: self.socket_address.clone(),
        is_default: self.is_default,
    }
  }
}

/* pub struct ConvertConnectionUpdateParams {
  pub id: Vec<u8>,
} */

/* impl Convert<ConvertConnectionUpdateParams> for ConnectionUpdateParams {
  fn convert_to_json(&'static self) -> ConvertConnectionUpdateParams {
    let clone = &self.id.clone();
    let box_id = Box::new(clone);
    ConvertConnectionUpdateParams { id: self.id.clone().into_bytes() }
  }
} */

#[derive(Debug, Deserialize, Serialize, TS, Clone)]
#[ts(export, export_to = "../../src/app/lib/bindings/")]
pub struct ConnectionDeleteParams {
  pub id: String,
}

#[derive(Debug, Deserialize, Serialize, TS, Clone)]
#[ts(export, export_to = "../../src/app/lib/bindings/")]
pub struct ConnectionCreateResponse {
  status: Option<String>,
  pub data: Option<DockerConnection>,
}

#[derive(Debug, Deserialize, Serialize, TS, Clone)]
#[ts(export, export_to = "../../src/app/lib/bindings/")]
pub struct ConnectionUpdateResponse {
  status: Option<String>,
  pub data: Option<DockerConnection>,
}

#[derive(Debug, Deserialize, Serialize, TS, Clone)]
#[ts(export, export_to = "../../src/app/lib/bindings/")]
pub struct ConnectionDeleteResponse {
  status: Option<String>,
  error: Option<String>,
}

#[derive(Debug, Deserialize, Serialize, TS, Clone)]
#[ts(export, export_to = "../../src/app/lib/bindings/")]
pub struct ConnectionRequestParams {
  pub id: String,
}

#[derive(Debug, Deserialize, Serialize, TS, Clone)]
#[ts(export, export_to = "../../src/app/lib/bindings/")]
pub struct ConnectionTestParams {
  pub connection: Option<String>,
  pub exact: bool,
}

#[derive(Debug, Deserialize, Serialize, TS, Clone)]
#[ts(export, export_to = "../../src/app/lib/bindings/")]
pub struct ConnectionRequestResponse {
  data: Option<DockerConnection>,
  error: Option<String>,
}

#[derive(Debug, Deserialize, Serialize, TS, Clone)]
#[ts(export, export_to = "../../src/app/lib/bindings/")]
#[serde(rename_all = "PascalCase")]
pub struct ContainerDiff {
  pub path: Option<String>,
  pub kind: Option<i32>,
}

#[derive(Debug, Deserialize, Serialize, TS, Clone)]
#[ts(export, export_to = "../../src/app/lib/bindings/")]
pub struct ContainerDiffResponse {
  pub diffs: Option<Vec<ContainerDiff>>,
  pub error: Option<String>,
}

#[derive(Debug, Deserialize, Serialize, TS, Clone)]
#[ts(export, export_to = "../../src/app/lib/bindings/")]
pub struct ContainerStatsResponse {
  pub stats: Option<String>,
  pub error: Option<String>,
}

#[derive(Debug, Deserialize, Serialize, TS, Clone)]
#[ts(export, export_to = "../../src/app/lib/bindings/")]
pub struct ContainerReloadParams {
  pub data: Option<ContainerSummary>,
  pub error: Option<String>,
}

#[derive(Debug, Deserialize, Serialize, TS, Clone)]
#[ts(export, export_to = "../../src/app/lib/bindings/")]
pub struct DockerConnection {
  pub id: String,
  pub name: String,
  pub socket_type: String,
  pub socket_address: Option<String>,
  pub is_default: bool,
}

#[derive(Debug, Deserialize, Serialize, TS, Clone)]
#[ts(export, export_to = "../../src/app/lib/bindings/")]
pub struct DockerConnectionListResponse {
  pub list: Vec<DockerConnection>,
}

#[derive(Debug, Deserialize, Serialize, TS, Clone)]
#[ts(export, export_to = "../../src/app/lib/bindings/")]
pub struct ContainerExportEventParams {
  pub status: String,
  pub id: String,
  pub name: String,
}

#[derive(Debug, Deserialize, Serialize, TS, Clone)]
#[ts(export, export_to = "../../src/app/lib/bindings/")]
pub struct ConnectionTestResponse {
  pub ok: Option<bool>,
  pub error: Option<String>,
}

#[derive(Debug, Deserialize, Serialize, TS, Clone)]
#[ts(export, export_to = "../../src/app/lib/bindings/")]
pub struct MountPoint {
  mount_type: Option<String>,
  source: String,
  destination: String,
}

#[derive(Debug, Deserialize, Serialize, TS, Clone)]
#[ts(export, export_to = "../../src/app/lib/bindings/")]
#[serde(rename_all = "PascalCase")]
pub struct PortBinding {
  host_ip: String,
  host_port: String,
}

#[derive(Debug, Deserialize, Serialize, TS, Clone)]
#[ts(export, export_to = "../../src/app/lib/bindings/")]
pub struct PortBindings {
  bindings: HashMap<String, PortBinding>,
}

#[derive(Debug, Deserialize, Serialize, TS, Clone)]
#[ts(export, export_to = "../../src/app/lib/bindings/")]
#[serde(rename_all = "PascalCase")]
pub struct DeleteResponse {
  deleted: String,
  tagged: String,
}

#[derive(Debug, Deserialize, Serialize, TS, Clone)]
#[ts(export, export_to = "../../src/app/lib/bindings/")]
#[serde(rename_all = "PascalCase")]
pub struct ImagePruneReport {
  images: Option<Vec<DeleteResponse>>,
  space_reclaimed: Option<i32>,
}

#[derive(Debug, Deserialize, Serialize, TS, Clone)]
#[ts(export, export_to = "../../src/app/lib/bindings/")]
pub struct ImagePruneResponse {
  pub report: Option<ImagePruneReport>,
  pub error: Option<String>,
}

#[derive(Debug, Deserialize, Serialize, TS, Clone)]
#[ts(export, export_to = "../../src/app/lib/bindings/")]
#[serde(rename_all = "PascalCase")]
pub struct ContainerPruneReport {
  containers_deleted: Option<Vec<String>>,
  space_reclaimed: Option<i32>,
}

#[derive(Debug, Deserialize, Serialize, TS, Clone)]
#[ts(export, export_to = "../../src/app/lib/bindings/")]
pub struct ContainerPruneResponse {
  pub report: Option<ContainerPruneReport>,
  pub error: Option<String>,
}

#[derive(Debug, Deserialize, Serialize, TS, Clone)]
#[ts(export, export_to = "../../src/app/lib/bindings/")]
pub struct TermExecParams {
  pub title: Option<String>,
  pub cwd: Option<String>,
  pub cmd: Option<String>,
  pub user: Option<String>,
  pub host: Option<String>,
  pub port: Option<String>,
}

#[derive(Debug, Deserialize, Serialize, TS, Clone)]
#[ts(export, export_to = "../../src/app/lib/bindings/")]
pub struct ContainerHostInfoQueryParams {
  pub id: String,
  pub hostname: Option<bool>,
  pub user: Option<bool>,
  pub ssh: Option<bool>,
  pub ip: Option<bool>,
  pub ls: Option<bool>,
}

#[derive(Debug, Deserialize, Serialize, TS, Clone)]
#[ts(export, export_to = "../../src/app/lib/bindings/")]
pub struct ContainerHostInfo {
  pub hostname: Option<String>,
  pub user: Option<String>,
  pub ssh: Option<PortBinding>,
  pub ip: Option<String>,
  pub ls: Option<String>,
}

#[derive(Debug, Deserialize, Serialize, TS, Clone)]
#[ts(export, export_to = "../../src/app/lib/bindings/")]
pub struct ContainerHostInfoResponse {
  pub host: Option<ContainerHostInfo>,
}