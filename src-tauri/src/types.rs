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
  S: serde::Serializer {
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
  #[serde(skip_serializing_if = "Option::is_none")]
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
}

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
  current: Option<i64>,
  total: Option<i64>,
}

#[derive(Debug, Deserialize, Serialize, TS, Clone)]
#[ts(export, export_to = "../../src/app/lib/bindings/")]
pub struct ImagePullProgress {
  id: Option<String>,
  status: Option<String>,
  progress_detail: ProgressDetail,
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