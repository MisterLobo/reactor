// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod common;
mod config;
mod init;
mod types;

use common::{get_api_host, get_auth_pass, get_auth_secret, get_auth_user, open_term_cmd, open_term_init};
use flate2::{write::GzEncoder, Compression};
use futures_util::FutureExt;
use init::init_environment;
use itertools::Itertools;
use reqwest::{multipart::Part, StatusCode};
use rust_socketio::{
  asynchronous::{Client, ClientBuilder},
  Payload as SocketIOPayload,
};
use serde_json::{json, Map, Value};
use tauri::{menu::{Menu, MenuItem}, plugin::PermissionState, tray::TrayIconBuilder};
use tauri_plugin_notification::NotificationExt;
use tauri_plugin_shell::ShellExt;
use std::{
  collections::HashMap, env, fs::File, io::{self, BufWriter, Read}, path::{Path, PathBuf}, process::Command, sync::{Arc, Mutex}
};
use tauri::{AppHandle, Emitter, Manager, Runtime, Window};
use tokio::fs;
use types::{
  ConnectionCreateParams, ConnectionCreateResponse, ConnectionDeleteParams, ConnectionDeleteResponse, ConnectionRequestParams, ConnectionRequestResponse, ConnectionTestParams, ConnectionTestResponse, ConnectionUpdateParams, ConnectionUpdateResponse, ContainerCommandParams, ContainerCommonParams, ContainerDiffParams, ContainerDiffResponse, ContainerExecCommandParams, ContainerExecParams, ContainerExportParams, ContainerGetArchiveParams, ContainerGetParams, ContainerGetResponse, ContainerHostInfo, ContainerHostInfoQueryParams, ContainerHostInfoResponse, ContainerKillParams, ContainerListParams, ContainerLogsParams, ContainerLogsResponse, ContainerLsParams, ContainerLsResponse, ContainerPruneReport, ContainerPruneResponse, ContainerRemoveParams, ContainerRenameParams, ContainerRestartParams, ContainerRunParams, ContainerRunResponse, ContainerStartParams, ContainerStartResponse, ContainerStatsParams, ContainerStatsResponse, ContainerStopParams, ContainerStopResponse, ContainerSummary, ContainerTopParams, ContainerTopResponse, DockerConnection, DockerConnectionListResponse, Error, ImageBuildParams, ImageListParams, ImagePruneReport, ImagePruneResponse, ImagePullParams, ImagePullProgress, ImagePullResponse, ImageSummary, InspectObjectParams, InspectObjectResponse, NetworkSummary, Payload, TermExecParams, VolumeSummary
};

fn main() {
  tauri::Builder::default()
    .plugin(tauri_plugin_fs::init())
    .plugin(tauri_plugin_notification::init())
    .plugin(tauri_plugin_process::init())
    .plugin(tauri_plugin_dialog::init())
    .plugin(tauri_plugin_shell::init())
    .plugin(tauri_plugin_os::init())
    .plugin(tauri_plugin_global_shortcut::Builder::new().build())
    .plugin(tauri_plugin_http::init())
    .plugin(tauri_plugin_clipboard_manager::init())
    // .plugin(tauri_plugin_store::Builder::new().build())
    // .plugin(tauri_plugin_stronghold::Builder::new(|password| password.as_bytes().to_vec()).build())
    .manage(AppState::default())
    .setup(|app| {
      let quit_i = MenuItem::with_id(app, "quit", "Quit", true, None::<&str>)?;
      let menu = Menu::with_items(app, &[&quit_i])?;
      TrayIconBuilder::new()
        .icon(app.default_window_icon().unwrap().clone())
        .menu(&menu)
        .menu_on_left_click(true)
        .on_menu_event(|app, event| match event.id.as_ref() {
          "quit" => {
            app.exit(0);
          }
          _ => ()
        })
        .build(app)?;
      let salt_path = app
        .path()
        .app_local_data_dir()
        .expect("could not resolve app local data path")
        .join("salt.txt");
      app.handle().plugin(tauri_plugin_stronghold::Builder::with_argon2(&salt_path).build())?;

      if app.notification().permission_state().unwrap() == PermissionState::Prompt {
        app.notification().request_permission().expect("Error requesting permission");
      }
      #[cfg(debug_assertions)]
      {
          let window = app.get_webview_window("main").unwrap();
          window.open_devtools();
      }
      init_environment();
      /* open_term_init(app, vec![
        "--hold",
        "-T", "Testing",
        "-e", env!("SHELL"),
        "-c", "ping google.com",
      ]); */
      Ok(())
    })
    .invoke_handler(tauri::generate_handler![
      connect_socket,
      connection_test,
      subscribe,
      subscribe_container,
      get_ws_host,
      container_list,
      image_list,
      network_list,
      volume_list,
      container_start,
      container_stop,
      container_run,
      pull_image,
      build_image,
      container_inspect,
      image_inspect,
      volume_inspect,
      network_inspect,
      container_get,
      container_logs,
      container_rename,
      container_top,
      container_stats,
      container_diff,
      container_export,
      container_kill,
      container_put_archive,
      container_get_archive,
      container_pause,
      container_unpause,
      container_restart,
      container_run_exec,
      container_exec_command,
      container_ls_files,
      container_ls_update,
      container_ls_shutdown,
      container_remove,
      containers_prune,
      images_prune,
      list_connections,
      new_connection,
      update_connection,
      delete_connection,
      set_default_connection,
      get_default_connection,
      get_connection,
      new_term_window,
      query_host,
    ])
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}

#[derive(Default)]
struct AppState {
  c: Mutex<u8>,
  s: std::sync::Mutex<String>,
  t: std::sync::Mutex<std::collections::HashMap<String, String>>,
  m: Arc<Mutex<HashMap<String, i32>>>,
  w: Arc<Mutex<HashMap<String, bool>>>,
}
// remember to call `.manage(MyState::default())`
#[tauri::command]
async fn command_name(state: tauri::State<'_, AppState>) -> Result<(), String> {
  *state.s.lock().unwrap() = "new string".into();
  state.t.lock().unwrap().insert("key".into(), "value".into());
  *state.c.lock().unwrap() = 1;
  Ok(())
}

// remember to call `.manage(MyState::default())`
#[tauri::command]
async fn get_ws_host() -> String {
  let ws_host = common::get_ws_host();
  ws_host
}

#[tauri::command]
async fn connect_socket<R: Runtime>(
  _app: AppHandle<R>,
  _window: Window<R>,
) -> Result<bool, Error> {
  let ws_host = common::get_ws_host();
  let cb = |payload: SocketIOPayload, socket: Client| {
    async move {
      match payload {
        SocketIOPayload::String(s) => (),
        SocketIOPayload::Text(str) => {
          str.iter().for_each(|f| println!("Received: {0}", f.to_string()));
        }
        SocketIOPayload::Binary(bin_data) => println!("Received bytes: {:#?}", bin_data),
      }
      /* socket
      .emit("test", json!({"got ack": true}))
      .await
      .expect("Server unreachable"); */
    }
    .boxed()
  };
  let is_ok = ClientBuilder::new(ws_host)
    .transport_type(rust_socketio::TransportType::Websocket)
    .namespace("/sub")
    // .on("test", cb)
    .on("inspect", |p, c| {
      async move {
        match p {
          SocketIOPayload::Text(v) => {
            let values: Vec<String> = v.iter().map(|v| v.to_string()).collect();
            println!("[inspect]: {values:?}")
          }
          SocketIOPayload::Binary(bin) => {}
          SocketIOPayload::String(_) => (),
        }
      }
      .boxed()
    })
    .on("error", |err, _| {
      async move { eprintln!("[connect_socket]: Error: {:#?}", err) }.boxed()
    })
    .connect()
    .await
    .is_ok();
  Ok(is_ok)
  // socket.disconnect().await.expect("Disconnect failed");
}

#[tauri::command]
async fn connection_test<R: Runtime>(
  state: tauri::State<'_, AppState>,
  app: AppHandle<R>,
  window: Window<R>,
  params: ConnectionTestParams,
) -> Result<ConnectionTestResponse, Error> {
  println!("params: {params:?}");
  let client = reqwest::Client::new();
  let resp = client
    .post(format!("{0}/connections/test", get_api_host()))
    .header("x-secret", get_auth_secret().as_str())
    .basic_auth(get_auth_user().as_str(), Some(get_auth_pass().as_str()))
    .json(&params)
    .send()
    .await?
    .json::<ConnectionTestResponse>()
    .await?;
  Ok(resp)
}

#[tauri::command]
async fn subscribe<R: Runtime>(
  state: tauri::State<'_, AppState>,
  app: AppHandle<R>,
  window: Window<R>,
  params: ContainerCommandParams,
) -> Result<bool, Error> {
  let ws_host = common::get_ws_host();
  let p1 = params.clone();
  let p2 = params.clone();
  let p3 = params.clone();
  let p4 = params.clone();
  let p5 = params.clone();
  let w0 = window.clone();
  let w1 = window.clone();
  let w2 = window.clone();
  let w3 = window.clone();
  let w4 = window.clone();
  let w5 = window.clone();
  let werr = window.clone();
  let wping = window.clone();

  let id = params.id.clone();
  if let Ok(m) = &mut state.m.lock() {
    if let Some(n) = m.get("sub") {
      println!("[n]: {id} {n}");
      if *n == 1 {
        m.remove("sub").unwrap();
      }
    }
  }

  let cli = ClientBuilder::new(ws_host)
    .transport_type(rust_socketio::TransportType::Websocket)
    .namespace("/sub")
    .on("subbed", move |p, c| {
      let win = w1.clone();
      let params = p1.clone();
      async move {
        match p {
          SocketIOPayload::Text(v) => {
            let values: Vec<String> = v.iter().map(|v| v.to_string().replace("\"", "")).collect();
            // println!("[subbed]: {:?}", &values);
            win.emit("subbed", json!({"id": values.first(), "cid": params.id})).expect("error sending event");
            ()
          }
          SocketIOPayload::Binary(bin) => (),
          SocketIOPayload::String(_) => (),
        }
        c.emit("ping", json!({"exact": false})).await.unwrap();
      }
      .boxed()
    })
    .on("pong", move |p, c| {
      let win = wping.clone();
      async move {
        match p {
          SocketIOPayload::Text(mut v) => {
            let values: Vec<&mut Map<String, Value>> = v.iter_mut().map(|v| v.as_object_mut().unwrap()).collect();
            println!("[values]: {values:?}");
            let res = values.first().unwrap();
            let ok = res.get("ok").unwrap().as_bool().unwrap_or_default();
            let err = res.get("error").unwrap().to_string().replace("\"", "");
            println!("{ok:?} {err:?}");
            win.emit("ping", json!({"ok": ok, "error": err})).expect("error sending event");
          }
          SocketIOPayload::Binary(_) => (),
          SocketIOPayload::String(_) => (),
        }
      }
      .boxed()
    })
    .on("apierror", move |p, c| {
      let win = werr.clone();
      async move {
        match p {
          SocketIOPayload::Text(v) => {
            let values: Vec<String> = v.iter().map(|v| v.to_string().replace("\"", "")).collect();
            // println!("[start#values]: {:?}", &values);
            let error = values.first().unwrap();
            let status = values.last().unwrap();
            println!("[error]: {error} {status}");
            win.emit("apierror", json!({"error": error, "status": status})).expect("error sending event");
          }
          SocketIOPayload::Binary(bin) => {
            println!("[status] Received bytes: {:#?}", bin)
          }
          SocketIOPayload::String(_) => (),
        }
      }
      .boxed()
    })
    .on("status", move |p, c| {
      let win = w2.clone();
      let params = p2.clone();
      async move {
        match p {
          SocketIOPayload::Text(v) => {
            let values: Vec<String> = v.iter().map(|v| v.to_string().replace("\"", "")).collect();
            // println!("[start#values]: {:?}", &values);
            let id = values.first().unwrap();
            let status = values.last().unwrap();
            println!("[status]: {id} {status}");
            if id != "1" {
              win.emit("status", json!({"status": status, "id": params.id})).expect("error sending event");
            }
          }
          SocketIOPayload::Binary(bin) => {
            println!("[status] Received bytes: {:#?}", bin)
          }
          SocketIOPayload::String(_) => (),
        }
      }
      .boxed()
    })
    .on("started", move |p, c| {
      let win = w3.clone();
      let params = p3.clone();
      async move {
        match p {
          SocketIOPayload::Text(v) => {
            let values: Vec<String> = v.iter().map(|v| v.to_string().replace("\"", "")).collect();
            let name = values.first().unwrap();
            let name = name.replace("/", "");
            let id = values.last().unwrap();
            println!(
              "[sub#started]: {:?} {1} {2} {name}",
              params.id == *id,
              params.id,
              id.as_str()
            );
            if id == "sub" {
              win.emit("sub-started", json!({"name": name, "id": "sub"})).expect("error sending event");
            }
          }
          SocketIOPayload::Binary(bin) => {
            println!("[sub#started] Received bytes: {:#?}", bin)
          }
          SocketIOPayload::String(_) => (),
        }
      }
      .boxed()
    })
    .on("stopped", move |p, c| {
      let win = w4.clone();
      let params = p4.clone();
      async move {
        match p {
          SocketIOPayload::Text(v) => {
            let values: Vec<String> = v.iter().map(|v| v.to_string().replace("\"", "")).collect();
            let name = values.first().expect("no value for name");
            let name = name.replace("/", "");
            let id = values.last().expect("no value for id");
            println!("[sub#stopped]: {name} {id}");
            if id == "sub" {
              win.emit("sub-stopped", json!({"name": name, "id": "sub"})).expect("error sending event");
            }
          }
          SocketIOPayload::Binary(bin) => {
            println!("[sub:stopped] Received bytes: {:#?}", bin)
          }
          SocketIOPayload::String(_) => (),
        }
      }
      .boxed()
    })
    .on("restarted", move |p, c| {
      let win = window.clone();
      let params = p5.clone();
      async move {
        match p {
          SocketIOPayload::Text(v) => {
            let values: Vec<String> = v.iter().map(|v| v.to_string().replace("\"", "")).collect();
            let name = values.first().unwrap();
            let name = name.replace("/", "");
            let id = values.last().unwrap();
            if id == "sub" {
              println!("[sub:restarted]: {id} {name}");
              win.emit("sub-restarted", json!({"name": name, "id": "sub"})).expect("error sending event");
            }
          }
          SocketIOPayload::Binary(bin) => {
            println!("[restarted] Received bytes: {:#?}", bin)
          }
          SocketIOPayload::String(_) => (),
        }
      }
      .boxed()
    })
    .on("pulled", move |p, c| {
      let win = w5.clone();
      async move {
        match p {
          SocketIOPayload::Text(v) => {
            let values: Vec<String> = v.iter().map(|v| v.to_string().replace("\"", "")).collect();
            let pull_status = values.first().unwrap();
            println!("[pulled#values]: {pull_status}");
            win.emit("pulled", json!({"status": pull_status})).expect("error sending event");
          }
          SocketIOPayload::Binary(bin) => {
            println!("[pulled] Received bytes: {:#?}", bin)
          }
          SocketIOPayload::String(_) => (),
        }
      }
      .boxed()
    });
    /* .on("error", |err, _| {
      async move { eprintln!("[subscribe] Errors: {:#?}", err) }.boxed()
    }) */
    // expect("error connecting ws client");

    if let Ok(m) = &mut state.m.lock() {
        println!("[connection] /sub sub");
        m.insert(id, 1);
    } else {
        eprintln!("[error]: failed to lock mutex");
    }

  if let Ok(cli) = cli.connect().await {
    Ok(cli.emit("subscribe", json!(params)).await.is_ok())
  } else {
    let win = w0.clone();
    if win.notification().permission_state().unwrap() == PermissionState::Granted {
      win.notification()
        .builder()
        .body("Failed connecting to host")
        .show()
        .expect("");
    }
    Ok(false)
  }
  // let cli = cli.connect().await;
  // socket.disconnect().await.expect("Disconnect failed");
}

#[tauri::command]
async fn new_term_window<R: Runtime>(
  app: AppHandle<R>,
  window: Window<R>,
  params: TermExecParams,
) -> Result<(), Error> {
  // open_term_cmd(app, vec!["--hold", "-T", "Testing", "-e", "$SHELL", "-i", "ping google.com"]);
  let title = params.title.unwrap_or(String::from("Terminal"));
  let user = params.user.unwrap_or(String::from("root"));
  let host = params.host.unwrap_or(String::from("localhost"));
  let port = params.port.unwrap_or(String::from("2222"));
  let mut cmd = format!("ssh -t {0}@{1} -p {2}", user, host, port);
  if let Some(cwd) = params.cwd {
    cmd = format!("ssh -t {0}@{1} -p {2} 'cd \"{3}\" ; exec \"$SHELL\"'", user, host, port, cwd);
  }
  // let cwd = params.cwd.unwrap_or(String::new());
  open_term_cmd(app, vec![
    "--hold",
    "-T", title.as_str(),
    "-e", env!("SHELL"),
    "-c", cmd.as_str(),
  ]);
  Ok(())
}

#[tauri::command]
async fn query_host<R: Runtime>(
  app: AppHandle<R>,
  window: Window<R>,
  params: ContainerHostInfoQueryParams,
) -> Result<ContainerHostInfo, Error> {
  let cli = reqwest::Client::new();
  let url = vec![
    get_api_host(),
    "container".to_string(),
    params.id,
    "hostinfo".to_string(),
  ].join("/");
  let req = cli.get(url);
  let mut query = HashMap::new();
  if let Some(host) = params.hostname {
    query.insert("hostname", host);
  }
  if let Some(user) = params.user {
    query.insert("user", user);
  }
  if let Some(ip) = params.ip {
    query.insert("ip", ip);
  }
  if let Some(ssh) = params.ssh {
    query.insert("ssh", ssh);
  }
  if let Some(ls) = params.ls {
    query.insert("ls", ls);
  }

  let resp = req
    .header("x-secret", get_auth_secret().as_str())
    .basic_auth(get_auth_user().as_str(), Some(get_auth_pass().as_str()))
    .query(&query)
    .send()
    .await?
    .json::<ContainerHostInfoResponse>()
    .await
    .expect("error");
  Ok(resp.host.expect("could not parse JSON response"))
}

#[tauri::command]
async fn subscribe_container<R: Runtime>(
  state: tauri::State<'_, AppState>,
  _app: AppHandle<R>,
  window: Window<R>,
  params: ContainerCommandParams,
) -> Result<bool, Error> {
  let ws_host = common::get_ws_host();
  let id = params.id.clone();
  let ns = params.ns.clone();
  let parc = Arc::new(params.clone());
  let iter = 1..6;
  let window = Arc::new(window.clone());
  // let mut v: Vec<Arc<ContainerCommandParams>> = iter.map(|f| { f }).collect_tuple();
  // v.fill(parc);
  // let parc = (1..6).map(|f| { parc.clone() }).collect_tuple().expect("");
  let (psubbed, pstatus, pstarted, pstopped, prestarted, pkilled) = (
    parc.clone(),
    parc.clone(),
    parc.clone(),
    parc.clone(),
    parc.clone(),
    parc.clone(),
  );
  let (wsubbed, wstatus, wstarted, wstopped, wrestarted, wkilled) = (
    window.clone(),
    window.clone(),
    window.clone(),
    window.clone(),
    window.clone(),
    window.clone(),
  );

  /* if let Ok(m) = &mut state.m.lock() {
    if let Some(n) = m.get(&params.id) {
      println!("[n]: {id} {n}");
      if *n == 1 {
        // m.remove(&id).unwrap();
        return Ok(true);
      }
    }
  } */

  let cli = ClientBuilder::new(ws_host)
    .transport_type(rust_socketio::TransportType::Websocket)
    .namespace("/container")
    .on("subbed", move |p, c| {
      let win = wsubbed.clone();
      let params = psubbed.clone();
      async move {
        match p {
          SocketIOPayload::Text(v) => {
            let values: Vec<String> = v.iter().map(|v| v.to_string().replace("\"", "")).collect();
            if win.notification().permission_state().unwrap() == PermissionState::Granted {
              win.notification()
                .builder()
                .body("Subbed")
                .show()
                .expect("");
            }
            // println!("[subbed]: {:?}", &values);
            win.emit("subbed", json!({"id": values.first(), "cid": params.id})).expect("error sending event");
            ()
          },
          SocketIOPayload::Binary(bin) => (),
          SocketIOPayload::String(_) => (),
        }
      }.boxed()
    })
    .on("status", move |p, c| {
      let win = wstatus.clone();
      let params = pstatus.clone();
      async move {
        match p {
          SocketIOPayload::Text(v) => {
            let values: Vec<String> = v.iter().map(|v| v.to_string().replace("\"", "")).collect();
            // println!("[start#values]: {:?}", &values);
            let id = values.first().unwrap();
            let status = values.last().unwrap();
            println!("[status]: {id} {status}");
            if id != "1" {
              win.emit("status", json!({"status": status, "id": params.id})).expect("error sending event");
            }
          },
          SocketIOPayload::Binary(bin) => {
            println!("[status] Received bytes: {:#?}", bin)
          },
          SocketIOPayload::String(_) => (),
        }
      }.boxed()
    })
    .on("started", move |p, c| {
      let win = wstarted.clone();
      let params: Arc<ContainerCommandParams> = pstarted.clone();
      async move {
        match p {
          SocketIOPayload::Text(v) => {
            let values: Vec<String> = v.iter().map(|v| v.to_string().replace("\"", "")).collect();
            let name = values.get(0).unwrap();
            let id = values.get(1).unwrap();
            let state = values.get(2).unwrap();
            let status = values.get(3).unwrap();
            if params.id == *id {
              println!("[started#values]: {:?} {1} {2} {name} {state} {status}", params.id == *id, params.id, id.as_str());
              win.emit("started", json!({"state": state, "name": name, "id": params.id, "status": status})).expect("error sending event");
            }
          },
          SocketIOPayload::Binary(bin) => {
            println!("[started] Received bytes: {:#?}", bin)
          },
          SocketIOPayload::String(_) => (),
        }
      }.boxed()
    })
    .on("stopped", move |p, c| {
      let win = wstopped.clone();
      let params = pstopped.clone();
      async move {
        match p {
          SocketIOPayload::Text(v) => {
            let values: Vec<String> = v.iter().map(|v| v.to_string().replace("\"", "")).collect();
            let name = values.get(0).unwrap();
            let id = values.get(1).unwrap();
            if params.id == *id {
              println!("[stopped#values]: {name} {id}");
              let state = values.get(2).unwrap();
              let status = values.get(3).unwrap();
              win.emit("stopped", json!({"state": state, "name": name, "id": params.id, "status": status})).expect("error sending event");
            }
          },
          SocketIOPayload::Binary(bin) => {
            println!("[stopped] Received bytes: {:#?}", bin)
          },
          SocketIOPayload::String(_) => (),
        }
      }.boxed()
    })
    .on("killed", move |p, c| {
      let win = wkilled.clone();
      let params = pkilled.clone();
      async move {
        match p {
          SocketIOPayload::Text(v) => {
            let values: Vec<String> = v.iter().map(|v| v.to_string().replace("\"", "")).collect();
            let name = values.get(0).unwrap();
            let id = values.get(1).unwrap();
            let status = values.get(2).unwrap();
            println!("[killed#values]: {id} {name} {status}");
            if params.id == *id {
              win.emit("killed", json!({"status": status, "name": name, "id": params.id})).expect("error sending event");
            }
          },
          SocketIOPayload::Binary(bin) => {
            println!("[killed] Received bytes: {:#?}", bin)
          },
          SocketIOPayload::String(_) => (),
        }
      }.boxed()
    })
    .on("restarted", move |p, c| {
      let win = wrestarted.clone();
      let params = prestarted.clone();
      async move {
        match p {
          SocketIOPayload::Text(v) => {
            let values: Vec<String> = v.iter().map(|v| v.to_string().replace("\"", "")).collect();
            let name = values.get(0).unwrap();
            let name = name.replace("/", "");
            let id = values.get(1).unwrap();
            println!("[restarted#values]: {id} {name}");
            if params.id == *id {
              win.emit("restarted", json!({"name": name, "id": params.id})).expect("error sending event");
            }
          },
          SocketIOPayload::Binary(bin) => {
            println!("[restarted] Received bytes: {:#?}", bin)
          },
          SocketIOPayload::String(_) => (),
        }
      }.boxed()
    })
    /* .on("sub_pulled", move |p, c| {
      let win = w5.clone();
      async move {
        match p {
          SocketIOPayload::Text(v) => {
            let values: Vec<String> = v.iter().map(|v| v.to_string().replace("\"", "")).collect();
            let pull_status = values.first().unwrap();
            println!("[pulled#values]: {pull_status}");
            win.emit("pulled", json!({"status": pull_status})).expect("error sending event");
          },
          SocketIOPayload::Binary(bin) => {
            println!("[pulled] Received bytes: {:#?}", bin)
          },
          SocketIOPayload::String(_) => (),
        }
      }.boxed()
    }) */
    /* .on("error", |err, _| {
      async move { eprintln!("[subscribe] Errors: {:#?}", err) }.boxed()
    }) */
    .connect()
    .await.expect("error connecting ws client");

  if let Ok(m) = &mut state.m.lock() {
    println!("[connection] /container {id}");
    m.insert(id, 1);
  } else {
    eprintln!("[error]: failed to lock mutex");
    /* *state.m.lock().unwrap() = HashMap::new();
    state.m.lock().unwrap().insert(id, 1); */
  }

  Ok(cli.emit("subscribe", json!(params)).await.is_ok())
  // socket.disconnect().await.expect("Disconnect failed");
}

// remember to call `.manage(MyState::default())`
#[tauri::command]
async fn container_list<R: Runtime>(
  _app: AppHandle<R>,
  _window: Window<R>,
  params: ContainerListParams,
) -> Result<Vec<ContainerSummary>, Error> {
  let cli = reqwest::Client::new();
  let req = cli.get(format!(
    "{0}/{1}?all={2}",
    get_api_host(),
    "containers",
    params.all
  ));
  let resp = req.header("x-secret", get_auth_secret().as_str())
    .basic_auth(get_auth_user().as_str(), Some(get_auth_pass().as_str()))
    .send()
    .await?
    .json::<Vec<ContainerSummary>>()
    .await
    .expect("error");

  Ok(resp)
}

#[tauri::command]
async fn container_get<R: Runtime>(
  _app: AppHandle<R>,
  _window: Window<R>,
  params: ContainerGetParams,
) -> Result<ContainerSummary, Error> {
  let cli = reqwest::Client::new();
  let req = cli.get(format!(
    "{0}/{1}/{2}",
    get_api_host(),
    "container",
    params.id
  ));
  let mut query = HashMap::new();
  if let Some(name) = params.name {
    query.insert("name", name);
  }

  let resp = req
    .header("x-secret", get_auth_secret().as_str())
    .basic_auth(get_auth_user().as_str(), Some(get_auth_pass().as_str()))
    .query(&query)
    .send()
    .await?
    .json::<ContainerGetResponse>()
    .await
    .expect("error");

  Ok(resp.data.unwrap())
}

#[tauri::command]
async fn container_start<R: Runtime>(
  _app: AppHandle<R>,
  _window: Window<R>,
  params: ContainerStartParams,
) -> Result<ContainerStartResponse, Error> {
  let id = params.id.clone();
  let client = reqwest::Client::new();
  let resp = client
    .post(format!(
      "{0}/{1}/{2}/{3}",
      get_api_host(),
      "container",
      id,
      "start"
    ))
    .header("x-secret", get_auth_secret().as_str())
    .basic_auth(get_auth_user().as_str(), Some(get_auth_pass().as_str()))
    .send()
    .await?
    .json::<ContainerStartResponse>()
    .await?;

  Ok(resp)
}

#[tauri::command]
async fn container_stop<R: Runtime>(
  _app: AppHandle<R>,
  _window: Window<R>,
  params: ContainerStopParams,
) -> Result<ContainerStopResponse, Error> {
  let id = params.id.clone();
  let client = reqwest::Client::new();
  let resp = client
    .put(format!(
      "{0}/{1}/{2}/{3}",
      get_api_host(),
      "container",
      id,
      "stop"
    ))
    .header("x-secret", get_auth_secret().as_str())
    .basic_auth(get_auth_user().as_str(), Some(get_auth_pass().as_str()))
    .send()
    .await?
    .json::<ContainerStopResponse>()
    .await?;

  Ok(resp)
}

#[tauri::command]
async fn container_run<R: Runtime>(
  _app: AppHandle<R>,
  _window: Window<R>,
  params: ContainerRunParams,
) -> Result<ContainerRunResponse, Error> {
  println!("[run#params]: {:?}", params.binds);
  let client = reqwest::Client::new();
  let resp = client
    .post(format!("{0}/{1}/{2}", get_api_host(), "containers", "run"))
    .header("x-secret", get_auth_secret().as_str())
    .basic_auth(get_auth_user().as_str(), Some(get_auth_pass().as_str()))
    .json(&params)
    .send()
    .await?
    .json::<ContainerRunResponse>()
    .await?;
  Ok(resp)
}

#[tauri::command]
async fn container_logs<R: Runtime>(
  _app: AppHandle<R>,
  _window: Window<R>,
  params: ContainerLogsParams,
) -> Result<ContainerLogsResponse, Error> {
  let client = reqwest::Client::new();
  let mut query = HashMap::new();
  query.insert("stdout", true);
  let resp = client
    .get(format!("{0}/container/{1}/logs", get_api_host(), params.id))
    .header("x-secret", get_auth_secret().as_str())
    .basic_auth(get_auth_user().as_str(), Some(get_auth_pass().as_str()))
    .query(&query)
    .send()
    .await?
    .json::<ContainerLogsResponse>()
    .await
    .expect("error requesting logs");
  Ok(resp)
}

#[tauri::command]
async fn container_rename<R: Runtime>(
  _app: AppHandle<R>,
  window: Window<R>,
  params: ContainerRenameParams,
) -> Result<bool, Error> {
  let id = params.id.clone();
  let new_name = params.new_name.clone();
  let ws_host = common::get_ws_host();
  let cli = ClientBuilder::new(ws_host)
    .transport_type(rust_socketio::TransportType::Websocket)
    .namespace("/container")
    .on("renamed", move |p, c| {
      let win = window.clone();
      let params = params.clone();
      async move {
        match p {
          SocketIOPayload::Text(v) => {
            let values: Vec<String> = v.iter().map(|v| v.to_string().replace("\"", "")).collect();
            let name = values.first().unwrap();
            let name = name.replace("/", "");
            let id = values.last().unwrap();
            println!("[renamed#values]: {id} {name} {0}", params.id == *id);
            if params.id == *id {
              win.emit("renamed", json!({"name": name, "id": params.id})).expect("error sending event");
            }
          }
          SocketIOPayload::Binary(bin) => {
            println!("[renamed] Received bytes: {:#?}", bin)
          }
          SocketIOPayload::String(_) => (),
        }
      }
      .boxed()
    })
    .on("error", |err, _| {
        async move { eprintln!("[container_rename]: Errors: {:#?}", err) }.boxed()
    })
    .connect()
    .await?;
  let mut body: HashMap<String, String> = HashMap::new();
  body.insert("new_name".into(), new_name);
  let client = reqwest::Client::new();
  let status = client
    .patch(format!("{0}/container/{1}/rename", get_api_host(), id))
    .header("x-secret", get_auth_secret().as_str())
    .basic_auth(get_auth_user().as_str(), Some(get_auth_pass().as_str()))
    .json(&body)
    .send()
    .await?
    .status();
  Ok(status == StatusCode::OK)
}

#[tauri::command]
async fn container_top<R: Runtime>(
  _app: AppHandle<R>,
  _window: Window<R>,
  params: ContainerTopParams,
) -> Result<ContainerTopResponse, Error> {
  let client = reqwest::Client::new();
  let resp = client.get(format!("{0}/container/{1}/top", get_api_host(), params.id))
    .header("x-secret", get_auth_secret().as_str())
    .basic_auth(get_auth_user().as_str(), Some(get_auth_pass().as_str()))
    .send()
    .await?
    .json::<ContainerTopResponse>()
    .await?;
  Ok(resp)
}

#[tauri::command]
async fn container_stats<R: Runtime>(
  _app: AppHandle<R>,
  _window: Window<R>,
  params: ContainerStatsParams,
) -> Result<ContainerStatsResponse, Error> {
  let client = reqwest::Client::new();
  let resp = client.get(format!(
    "{0}/container/{1}/stats",
    get_api_host(),
    params.id
  ))
    .header("x-secret", get_auth_secret().as_str())
    .basic_auth(get_auth_user().as_str(), Some(get_auth_pass().as_str()))
    .send()
    .await?
    .json::<ContainerStatsResponse>()
    .await
    .expect("stats error");
  Ok(resp)
}

#[tauri::command]
async fn container_diff<R: Runtime>(
  _app: AppHandle<R>,
  _window: Window<R>,
  params: ContainerDiffParams,
) -> Result<ContainerDiffResponse, Error> {
  let client = reqwest::Client::new();
  let resp = client.get(format!("{0}/container/{1}/diff", get_api_host(), params.id))
    .header("x-secret", get_auth_secret().as_str())
    .basic_auth(get_auth_user().as_str(), Some(get_auth_pass().as_str()))
    .send()
    .await?
    .json::<ContainerDiffResponse>()
    .await
    .expect("error parsing json");
  println!("[diffs]: {0:?}", resp.diffs);
  Ok(resp)
}

#[tauri::command]
async fn container_export<R: Runtime>(
  _app: AppHandle<R>,
  window: Window<R>,
  params: ContainerExportParams,
) -> Result<bool, Error> {
  window
    .emit("export:status", "in_progress")
    .expect("error sending event");
  let mut body: HashMap<&str, String> = HashMap::new();
  body.insert("file_path", params.file_path.clone());
  {
    let client = reqwest::Client::new();
    let resp = client
      .post(format!(
          "{0}/container/{1}/export",
          get_api_host(),
          params.id
      ))
      .header("x-secret", get_auth_secret().as_str())
      .basic_auth(get_auth_user().as_str(), Some(get_auth_pass().as_str()))
      .json(&body)
      .send()
      .await?
      .bytes()
      .await?;
    let file_path = params.file_path.clone();
    {
      let mut out_file = File::create(file_path).expect("error reading output file");
      let mut slice = resp.iter().as_slice();
      io::copy(&mut slice, &mut out_file).expect("failed to copy file contents");
    }
  }
  window
    .emit("export:status", "complete")
    .expect("error sending event");
  Ok(true)
}

#[tauri::command]
async fn container_get_archive<R: Runtime>(
  _app: AppHandle<R>,
  window: Window<R>,
  params: ContainerGetArchiveParams,
) -> Result<bool, Error> {
  let mut body: HashMap<&str, String> = HashMap::new();
  body.insert("src_path", params.src_path.clone());
  {
    let client = reqwest::Client::new();
    let resp = client
      .post(format!(
          "{0}/container/{1}/get_archive",
          get_api_host(),
          params.id
      ))
      .header("x-secret", get_auth_secret().as_str())
      .basic_auth(get_auth_user().as_str(), Some(get_auth_pass().as_str()))
      .json(&body)
      .send()
      .await?
      .bytes()
      .await?;
    let file_path = params.src_path.clone();
    {
      let mut out_file = File::create(file_path).expect("error reading output file");
      let mut slice = resp.iter().as_slice();
      io::copy(&mut slice, &mut out_file).expect("failed to copy file contents");
    }
  }
  window
    .emit("export:status", "complete")
    .expect("error sending event");
  Ok(true)
}

#[tauri::command]
async fn container_put_archive<R: Runtime>(
  _app: AppHandle<R>,
  _window: Window<R>,
) -> Result<(), Error> {
  Ok(())
}

#[tauri::command]
async fn container_kill<R: Runtime>(
  _app: AppHandle<R>,
  _window: Window<R>,
  params: ContainerKillParams,
) -> Result<bool, Error> {
  let id = params.id.clone();
  let client = reqwest::Client::new();
  let status = client
    .put(format!("{0}/container/{1}/kill", get_api_host(), id))
    .header("x-secret", get_auth_secret().as_str())
    .basic_auth(get_auth_user().as_str(), Some(get_auth_pass().as_str()))
    .send()
    .await?
    .status();
  Ok(status == StatusCode::OK)
}

#[tauri::command]
async fn container_pause<R: Runtime>(
  _app: AppHandle<R>,
  window: Window<R>,
  params: ContainerCommandParams,
) -> Result<bool, Error> {
  let id = params.id.clone();
  let ws_host = common::get_ws_host();
  ClientBuilder::new(ws_host)
    .transport_type(rust_socketio::TransportType::Websocket)
    .namespace("/container")
    .on("paused", move |p, c| {
      let win = window.clone();
      let params = params.clone();
      async move {
        match p {
          SocketIOPayload::Text(v) => {
            let values: Vec<String> = v.iter().map(|v| v.to_string().replace("\"", "")).collect();
            let name = values.get(0).unwrap();
            let id = values.get(1).unwrap();
            let status = values.get(2).unwrap();
            println!("[paused#values]: {id} {name} {status}");
            if params.id == *id {
              win.emit(
                "paused",
                json!({"status": status, "name": name, "id": params.id}),
              )
              .expect("error sending event");
            }
          }
          SocketIOPayload::Binary(bin) => {
            println!("[paused] Received bytes: {:#?}", bin)
          }
          SocketIOPayload::String(_) => (),
        }
      }
      .boxed()
    })
    .on("error", |err, _| {
        async move { eprintln!("[container_pause]: Errors: {:#?}", err) }.boxed()
    })
    .connect()
    .await?;

  let client = reqwest::Client::new();
  let status = client
    .put(format!("{0}/container/{1}/pause", get_api_host(), id))
    .header("x-secret", get_auth_secret().as_str())
    .basic_auth(get_auth_user().as_str(), Some(get_auth_pass().as_str()))
    .send()
    .await?
    .status();
  Ok(status == StatusCode::OK)
}

#[tauri::command]
async fn container_unpause<R: Runtime>(
  _app: AppHandle<R>,
  window: Window<R>,
  params: ContainerCommandParams,
) -> Result<bool, Error> {
  let id = params.id.clone();
  let ws_host = common::get_ws_host();
  ClientBuilder::new(ws_host)
    .transport_type(rust_socketio::TransportType::Websocket)
    .namespace("/container")
    .on("unpaused", move |p, c| {
      let win = window.clone();
      let params = params.clone();
      async move {
        match p {
          SocketIOPayload::Text(v) => {
            let values: Vec<String> = v.iter().map(|v| v.to_string().replace("\"", "")).collect();
            let name = values.get(0).unwrap();
            let id = values.get(1).unwrap();
            let status = values.get(2).unwrap();
            println!("[unpaused#values]: {id} {name} {status}");
            if params.id == *id {
              win.emit(
                "unpaused",
                json!({"status": status, "name": name, "id": params.id}),
              )
              .expect("error sending event");
            }
          }
          SocketIOPayload::Binary(bin) => {
              println!("[unpaused] Received bytes: {:#?}", bin)
          }
          SocketIOPayload::String(_) => (),
        }
      }
      .boxed()
    })
    .on("error", |err, _| {
      async move { eprintln!("[container_unpause]: Errors: {:#?}", err) }.boxed()
    })
    .connect()
    .await?;

  let client = reqwest::Client::new();
  let status = client
    .put(format!("{0}/container/{1}/unpause", get_api_host(), id))
    .header("x-secret", get_auth_secret().as_str())
    .basic_auth(get_auth_user().as_str(), Some(get_auth_pass().as_str()))
    .send()
    .await?
    .status();
  Ok(status == StatusCode::OK)
}

#[tauri::command]
async fn container_restart<R: Runtime>(
  _app: AppHandle<R>,
  _window: Window<R>,
  params: ContainerRestartParams,
) -> Result<bool, Error> {
  let id = params.id.clone();
  let client = reqwest::Client::new();
  let status = client
    .post(format!("{0}/container/{1}/restart", get_api_host(), id))
    .header("x-secret", get_auth_secret().as_str())
    .basic_auth(get_auth_user().as_str(), Some(get_auth_pass().as_str()))
    .send()
    .await?
    .status();
  Ok(status == StatusCode::OK)
}

#[tauri::command]
async fn container_remove<R: Runtime>(
    _app: AppHandle<R>,
    window: Window<R>,
    params: ContainerRemoveParams,
) -> Result<bool, Error> {
  let id = params.id.clone();
  let ws_host = common::get_ws_host();
  let params1 = params.clone();
  ClientBuilder::new(ws_host)
    .transport_type(rust_socketio::TransportType::Websocket)
    .namespace("/container")
    .on("removed", move |p, c| {
      let win = window.clone();
      let params = params1.clone();
      async move {
        match p {
          SocketIOPayload::Text(v) => {
            let values: Vec<String> = v.iter().map(|v| v.to_string().replace("\"", "")).collect();
            let id = values.first().unwrap();
            let name = values.last().unwrap();
            if params.id == *id {
              println!(
                "[removed#values]: {id} {name} {0} {1}",
                params.id,
                params.id == *id
              );
              win.emit("removed", json!({"name": name, "id": id}))
                .expect("error sending event");
            }
          }
          SocketIOPayload::Binary(bin) => {
            println!("[removed] Received bytes: {:#?}", bin)
          }
          SocketIOPayload::String(_) => (),
        }
      }
      .boxed()
    })
    .on("error", |err, _| {
      async move { eprintln!("[container_remove]: Errors: {:#?}", err) }.boxed()
    })
    .connect()
    .await
    .expect("error ws client: ");

  let client = reqwest::Client::new();
  let status = client
    .delete(format!("{0}/container/{1}", get_api_host(), id))
    .header("x-secret", get_auth_secret().as_str())
    .basic_auth(get_auth_user().as_str(), Some(get_auth_pass().as_str()))
    .json(&params)
    .send()
    .await?
    .status();
  Ok(status == StatusCode::OK)
}

#[tauri::command]
async fn container_ls_files<R: Runtime>(
  app: AppHandle<R>,
  window: Window<R>,
  params: ContainerLsParams,
) -> Result<ContainerLsResponse, Error> {
  println!("[params]: {:?}", params);
  let client = reqwest::Client::new();
  let res = client
    .post(format!(
      "{0}/container/{1}/ls",
      get_api_host(),
      params.id,
    ))
    .header("x-secret", get_auth_secret().as_str())
    .basic_auth(get_auth_user().as_str(), Some(get_auth_pass().as_str()))
    .json(&params)
    .send()
    .await?
    .json()
    // .json::<ContainerLsResponse>()
    .await?;
  Ok(res)
}

#[tauri::command]
async fn container_ls_update<R: Runtime>(
  app: AppHandle<R>,
  window: Window<R>,
  params: ContainerCommonParams,
) -> Result<bool, Error> {
  let client = reqwest::Client::new();
  let res = client
    .patch(format!(
      "{0}/container/{1}/updatels",
      get_api_host(),
      params.id,
    ))
    .header("x-secret", get_auth_secret().as_str())
    .basic_auth(get_auth_user().as_str(), Some(get_auth_pass().as_str()))
    .send()
    .await?;
  Ok(res.status() == StatusCode::OK)
}

#[tauri::command]
async fn container_ls_shutdown<R: Runtime>(
  app: AppHandle<R>,
  window: Window<R>,
  params: ContainerLsParams,
) -> Result<bool, Error> {
  let client = reqwest::Client::new();
  let res = client
    .put(format!(
      "{0}/container/{1}/stopls",
      get_api_host(),
      params.id,
    ))
    .header("x-secret", get_auth_secret().as_str())
    .basic_auth(get_auth_user().as_str(), Some(get_auth_pass().as_str()))
    .send()
    .await?;
  Ok(res.status() == StatusCode::OK)
}

#[tauri::command]
async fn container_run_exec<R: Runtime>(
  _app: AppHandle<R>,
  _window: Window<R>,
  params: ContainerExecParams,
) -> Result<bool, Error> {
  println!("[exec#params]: {params:?}");
  let client = reqwest::Client::new();
  let status = client
    .post(format!(
      "{0}/container/{1}/exec",
      get_api_host(),
      params.id.clone().unwrap()
    ))
    .header("x-secret", get_auth_secret().as_str())
    .basic_auth(get_auth_user().as_str(), Some(get_auth_pass().as_str()))
    .json(&params)
    .send()
    .await?
    .status();
  Ok(status == StatusCode::OK)
}

#[tauri::command]
async fn container_exec_command<R: Runtime>(
  app: AppHandle<R>,
  window: Window<R>,
) -> Result<bool, Error> {
  Ok(true)
}

#[tauri::command]
async fn pull_image<R: Runtime>(
  _app: AppHandle<R>,
  _window: Window<R>,
  params: ImagePullParams,
) -> Result<Vec<String>, Error> {
  /* let mut body = HashMap::new();
  body.insert("repo", "params.repository");
  if let Some(tag) = params.tag {
    body.insert("tag", tag);
  } */
  let client = reqwest::Client::new();
  let res = client
    .post(format!("{0}/{1}/{2}", get_api_host(), "images", "pull"))
    .header("x-secret", get_auth_secret().as_str())
    .basic_auth(get_auth_user().as_str(), Some(get_auth_pass().as_str()))
    .json(&params)
    .send()
    .await?;
  let resjson = res.json::<ImagePullResponse>().await?;
  let rson = resjson.clone();
  let resjson = resjson.logs.unwrap();
  let reslogs = resjson.split("\n").collect_vec();
  let logs: Vec<String> = reslogs.iter().map(|item| item.replace("\\\"", "\"").replace("\"{", "{").replace("}\"", "}")).collect();
  Ok(logs)
}

#[tauri::command]
async fn build_image<R: Runtime>(
  _app: AppHandle<R>,
  _window: Window<R>,
  params: ImageBuildParams,
) -> Result<bool, Error> {
  let tarfilename = "./.tmp/build.tar.gz";
  let tarf = Path::new("./.tmp");
  if !tarf.exists() {
    fs::create_dir_all(tarf).await?;
  }
  let tarfile = Path::new(tarfilename);

  let mut dockerfile = PathBuf::new();
  dockerfile.push(params.path.clone());
  let basedir = dockerfile.parent().unwrap();
  println!("[parent]: {:?}", basedir.file_name());
  {
    let tar_gz = File::create(tarfile)?;
    let bufw = BufWriter::new(tar_gz);
    let enc = GzEncoder::new(bufw, Compression::default());
    let mut tar = tar::Builder::new(enc);
    tar.append_dir_all(".", basedir)?;
    tar.finish()?;
  }
  let mut filehandle = File::open(tarfile)?;
  let mut buffcopy = Vec::new();
  filehandle.read_to_end(&mut buffcopy)?;

  let part = Part::stream(buffcopy).file_name("build.tar.gz");
  println!("[tag]: {:?}", params.tag.clone());
  let tag = Part::text(params.tag.unwrap_or_default());
  let form: reqwest::multipart::Form = reqwest::multipart::Form::new()
    .part("file", part)
    .part("tag", tag);

  let client = reqwest::Client::new();
  let res = client
    .post(format!("{0}/{1}/{2}", get_api_host(), "images", "build"))
    .header("x-secret", get_auth_secret().as_str())
    .basic_auth(get_auth_user().as_str(), Some(get_auth_pass().as_str()))
    .multipart(form)
    .send()
    .await?;

  fs::remove_file(tarfile)
    .await
    .expect("cannot remove file: build.tar.gz");

  Ok(res.status() == StatusCode::OK)
}

#[tauri::command]
async fn image_list<R: Runtime>(
  _app: AppHandle<R>,
  _window: Window<R>,
  params: ImageListParams,
) -> Result<Vec<ImageSummary>, Error> {
  let client = reqwest::Client::new();
  let resp = client.get(format!(
    "{0}/{1}?all={2}",
    get_api_host(),
    "images",
    params.all
  ))
    .header("x-secret", get_auth_secret().as_str())
    .basic_auth(get_auth_user().as_str(), Some(get_auth_pass().as_str()))
    .send()
    .await?
    .json::<Vec<ImageSummary>>()
    .await?;

  Ok(resp)
}

#[tauri::command]
async fn volume_list<R: Runtime>(
  _app: AppHandle<R>,
  _window: Window<R>,
) -> Result<Vec<VolumeSummary>, Error> {
  let client = reqwest::Client::new();
  let resp = client.get(format!("{0}/{1}", get_api_host(), "volumes"))
    .header("x-secret", get_auth_secret().as_str())
    .basic_auth(get_auth_user().as_str(), Some(get_auth_pass().as_str()))
    .send()
    .await?
    .json::<Vec<VolumeSummary>>()
    .await?;
  Ok(resp)
}

#[tauri::command]
async fn network_list<R: Runtime>(
  _app: AppHandle<R>,
  _window: Window<R>,
) -> Result<Vec<NetworkSummary>, Error> {
  let client = reqwest::Client::new();
  let resp = client.get(format!("{0}/{1}", get_api_host(), "networks"))
    .header("x-secret", get_auth_secret().as_str())
    .basic_auth(get_auth_user().as_str(), Some(get_auth_pass().as_str()))
    .send()
    .await?
    .json::<Vec<NetworkSummary>>()
    .await?;
  Ok(resp)
}

#[tauri::command]
async fn container_inspect<R: Runtime>(
  _app: AppHandle<R>,
  _window: Window<R>,
  params: InspectObjectParams,
) -> Result<InspectObjectResponse, Error> {
  let id = params.id.clone();
  let client = reqwest::Client::new();
  let resp = client.get(format!("{0}/container/{1}/inspect", get_api_host(), id))
    .header("x-secret", get_auth_secret().as_str())
    .basic_auth(get_auth_user().as_str(), Some(get_auth_pass().as_str()))
    .send()
    .await?
    .text()
    .await?;

  Ok(InspectObjectResponse { json: resp })
}

#[tauri::command]
async fn image_inspect<R: Runtime>(
  _app: AppHandle<R>,
  _window: Window<R>,
  params: InspectObjectParams,
) -> Result<InspectObjectResponse, Error> {
  let client = reqwest::Client::new();
  let resp = client.get(format!("{0}/image/{1}/inspect", get_api_host(), params.id))
    .header("x-secret", get_auth_secret().as_str())
    .basic_auth(get_auth_user().as_str(), Some(get_auth_pass().as_str()))
    .send()
    .await?
    .text()
    .await?;

  Ok(InspectObjectResponse { json: resp })
}

#[tauri::command]
async fn volume_inspect<R: Runtime>(
  _app: AppHandle<R>,
  _window: Window<R>,
  params: InspectObjectParams,
) -> Result<InspectObjectResponse, Error> {
  let client = reqwest::Client::new();
  let resp = client.get(format!("{0}/volume/{1}/inspect", get_api_host(), params.id))
    .header("x-secret", get_auth_secret().as_str())
    .basic_auth(get_auth_user().as_str(), Some(get_auth_pass().as_str()))
    .send()
    .await?
    .text()
    .await?;

  Ok(InspectObjectResponse { json: resp })
}

#[tauri::command]
async fn network_inspect<R: Runtime>(
  _app: AppHandle<R>,
  _window: Window<R>,
  params: InspectObjectParams,
) -> Result<InspectObjectResponse, Error> {
  let client = reqwest::Client::new();
  let resp = client.get(format!(
    "{0}/network/{1}/inspect",
    get_api_host(),
    params.id
  ))
    .header("x-secret", get_auth_secret().as_str())
    .basic_auth(get_auth_user().as_str(), Some(get_auth_pass().as_str()))
    .send()
    .await?
    .text()
    .await?;

  Ok(InspectObjectResponse { json: resp })
}

#[tauri::command]
async fn containers_prune<R: Runtime>(app: AppHandle<R>, window: Window<R>) -> Result<ContainerPruneResponse, Error> {
  let client = reqwest::Client::new();
  let resp = client
    .post(format!("{0}/containers/prune", get_api_host()))
    .header("x-secret", get_auth_secret().as_str())
    .basic_auth(get_auth_user().as_str(), Some(get_auth_pass().as_str()))
    .send()
    .await?
    .json::<ContainerPruneResponse>()
    .await?;
  Ok(resp)
}

#[tauri::command]
async fn images_prune<R: Runtime>(app: AppHandle<R>, window: Window<R>) -> Result<ImagePruneResponse, Error> {
  let client = reqwest::Client::new();
  let resp = client
    .post(format!("{0}/images/prune", get_api_host()))
    .header("x-secret", get_auth_secret().as_str())
    .basic_auth(get_auth_user().as_str(), Some(get_auth_pass().as_str()))
    .send()
    .await?
    .json::<ImagePruneResponse>()
    .await?;
  Ok(resp)
}

#[tauri::command]
async fn list_connections<R: Runtime>(
  _app: AppHandle<R>,
  _window: Window<R>,
) -> Result<DockerConnectionListResponse, Error> {
  let client = reqwest::Client::new();
  let resp = client.get(format!("{0}/connections", get_api_host()))
    .header("x-secret", get_auth_secret().as_str())
    .basic_auth(get_auth_user().as_str(), Some(get_auth_pass().as_str()))
    .send()
    .await?
    .json::<DockerConnectionListResponse>()
    .await?;
  Ok(resp)
}

#[tauri::command]
async fn new_connection<R: Runtime>(
  _app: AppHandle<R>,
  _window: Window<R>,
  params: ConnectionCreateParams,
) -> Result<Option<DockerConnection>, Error> {
  let client = reqwest::Client::new();
  let resp = client
    .post(format!("{0}/{1}", get_api_host(), "connections"))
    .header("x-secret", get_auth_secret().as_str())
    .basic_auth(get_auth_user().as_str(), Some(get_auth_pass().as_str()))
    .json(&params)
    .send()
    .await?
    .json::<ConnectionCreateResponse>()
    .await?;
  Ok(resp.data)
}

#[tauri::command]
async fn update_connection<R: Runtime>(
  _app: AppHandle<R>,
  _window: Window<R>,
  params: ConnectionUpdateParams,
) -> Result<Option<DockerConnection>, Error> {
  let client = reqwest::Client::new();
  let id = params.id.clone();
  let resp = client
    .put(format!("{0}/{1}/{2}", get_api_host(), "connections", id))
    .header("x-secret", get_auth_secret().as_str())
    .basic_auth(get_auth_user().as_str(), Some(get_auth_pass().as_str()))
    .json(&params.payload())
    .send()
    .await?
    .json::<ConnectionUpdateResponse>()
    .await?;
  Ok(resp.data)
}

#[tauri::command]
async fn delete_connection<R: Runtime>(
  _app: AppHandle<R>,
  _window: Window<R>,
  params: ConnectionDeleteParams,
) -> Result<(), Error> {
  let client = reqwest::Client::new();
  let resp = client
    .put(format!(
      "{0}/{1}/{2}",
      get_api_host(),
      "connections",
      params.id
    ))
    .header("x-secret", get_auth_secret().as_str())
    .basic_auth(get_auth_user().as_str(), Some(get_auth_pass().as_str()))
    .json(&params)
    .send()
    .await?
    .json::<ConnectionDeleteResponse>()
    .await?;
  Ok(())
}

#[tauri::command]
async fn set_default_connection<R: Runtime>(
  _app: AppHandle<R>,
  _window: Window<R>,
  params: ConnectionUpdateParams,
) -> Result<String, Error> {
  let client = reqwest::Client::new();
  let resp = client
    .patch(format!(
      "{0}/connections/{1}/default",
      get_api_host(),
      params.id
    ))
    .header("x-secret", get_auth_secret().as_str())
    .basic_auth(get_auth_user().as_str(), Some(get_auth_pass().as_str()))
    .send()
    .await?
    .json::<ConnectionUpdateResponse>()
    .await?;
  Ok(params.id)
}

#[tauri::command]
async fn get_default_connection<R: Runtime>(
  _app: AppHandle<R>,
  _window: Window<R>,
) -> Result<Option<DockerConnection>, Error> {
  let client = reqwest::Client::new();
  let resp = client.get(format!("{0}/connections/default", get_api_host()))
    .header("x-secret", get_auth_secret().as_str())
    .basic_auth(get_auth_user().as_str(), Some(get_auth_pass().as_str()))
    .send()
    .await?
    .json::<DockerConnection>()
    .await?;
  Ok(Some(resp))
}

#[tauri::command]
async fn get_connection<R: Runtime>(
  _app: AppHandle<R>,
  _window: Window<R>,
  params: ConnectionRequestParams,
) -> Result<ConnectionRequestResponse, Error> {
  let client = reqwest::Client::new();
  let resp = client.get(format!("{0}/connections/{1}", get_api_host(), params.id))
    .header("x-secret", get_auth_secret().as_str())
    .basic_auth(get_auth_user().as_str(), Some(get_auth_pass().as_str()))
    .send()
    .await?
    .json::<ConnectionRequestResponse>()
    .await?;
  Ok(resp)
}
