use rocksdb::DB;

use crate::{
  common::{self, get_ws_host},
  config::{API_HOST, WS_HOST},
};

pub fn init_environment() {
  let conf = common::get_store_path();
  println!("[conf]: {0}", conf.clone());
  {
    let db = DB::open_default(conf.clone()).unwrap();
    db.put(b"default", API_HOST.as_bytes()).unwrap();
    db.put(b"active", b"default").unwrap();
    db.put(b"api_host", API_HOST.as_bytes()).unwrap();
    db.put(b"api_port", b"8080").unwrap();
    db.put(b"ws_host", WS_HOST.as_bytes()).unwrap();
    db.put(b"ws_port", b"8080").unwrap();
    db.put(b"auth_user", b"user").unwrap();
    db.put(b"auth_pass", b"pass").unwrap();
    db.put(b"auth_secret", b"secret").unwrap();
  }
}