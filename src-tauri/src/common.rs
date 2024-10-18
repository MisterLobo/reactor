use rocksdb::{DBCommon, DBPath, Options, DB};
use std::{env, path::PathBuf};

use crate::config::{API_HOST, APP_NAME, WS_HOST};

static STORE_PATH: &'static str = "store/data";

pub fn get_api_host() -> String {
  let store_path = get_store_path();
  let mut api_host = String::new();
  let mut api_port = String::from("0");
  {
    let db = DB::open_for_read_only(&Options::default(), store_path, false)
      .expect("error connecting to database");
    match db.multi_get([b"api_host", b"api_port"]) {
      value => {
        let host = String::from_utf8(value.first().unwrap().clone().unwrap().unwrap()).unwrap();
        let port = String::from_utf8(value.last().unwrap().clone().unwrap().unwrap()).unwrap();
        // println!("[value]: {0}:{1}", host, port);
        api_host = host;
        api_port = port;
      }
      none => {
        api_host = String::from("http://localhost");
        api_port = String::from("8080");
      }
      err => {
        let e = String::from_utf8(err.first().unwrap().clone().unwrap().unwrap()).unwrap();
        panic!("operational problem encountered: {0}", e);
      }
    }
  }
  format!("{0}:{1}", api_host, api_port)
}

pub fn get_ws_host() -> String {
  let store_path = get_store_path();
  let mut ws_host = String::new();
  let mut ws_port = String::from("0");
  {
    let db = DB::open_for_read_only(&Options::default(), store_path, false).expect("error connecting to database");
    match db.multi_get([b"ws_host", b"ws_port"]) {
      value => {
        let host = String::from_utf8(value.first().unwrap().clone().unwrap().unwrap()).unwrap();
        let port = String::from_utf8(value.last().unwrap().clone().unwrap().unwrap()).unwrap();
        // println!("[value]: {0}:{1}", host, port);
        ws_host = host;
        ws_port = port;
      }
      none => {
        ws_host = String::from("ws://localhost");
        ws_port = String::from("8080");
      }
      err => {
        let e = String::from_utf8(err.first().unwrap().clone().unwrap().unwrap()).unwrap();
        panic!("operational problem encountered: {0}", e);
      }
    }
  }
  format!("{0}:{1}", ws_host, ws_port)
}

pub fn get_store_path() -> String {
  let config_dir = dirs::config_dir().unwrap_or_default();
  let config_str = config_dir.to_str().unwrap();
  assert_ne!(
    config_dir,
    PathBuf::default(),
    "failed to resolve config path",
  );
  let formatted = format!("{0}/{1}/{2}", config_str, APP_NAME, STORE_PATH);
  // println!("[config]: {0}", formatted);
  String::from(formatted)
}