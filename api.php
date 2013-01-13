<?php
ini_set('error_reporting', E_ALL);

// table structure
// CREATE TABLE chat_line (id INT(11) NOT NULL AUTO_INCREMENT, line TEXT, insert_time timestamp, PRIMARY KEY (id), KEY (insert_time));
require_once "./sitebase.php";

try {
  if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    get($_GET);
  }
  else if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    post($_POST);
  }
} catch (Exception $e) {
  echo json_encode(array('error'=>$e->message));
}
exit();

function get($args) {
  $since_id = null;

  // validate
  if (isset($args['since_id'])) {
    if (is_int($args['since_id'])) {
      throw new Exception('since_id must be int');
    }
    $since_id = $args['since_id'];
  }

  // sql
  $con = get_pdo();

  if (is_null($since_id)) {
    $sql = 'SELECT * FROM chat_line ORDER BY id LIMIT 30';
    $stmt = $con->prepare($sql);
  } else {
    $sql = 'SELECT * FROM chat_line id > ? ORDER BY id LIMIT 30';
    $stmt = $con->prepare($sql);
    $stmt->bindValue(1, $since_id, PDO::PARAM_INT);
  }

  $stmt->execute();
  $res = $stmt->fetchAll(PDO::FETCH_ASSOC);

  echo json_encode($res);
}

function post($args) {
  $line = $args['line'];

  // validate
  if (!isset($line)) {
    throw new Exception('missing parameter "line"');
  }

  // check encoding
  if (mb_convert_encoding($line, 'UTF-8', 'UTF-8') !== $line) {
    throw new Exception('invalid encoding for "line"');
  }

  // check length
  if (mb_substr($line, 0, 200) !== $line) {
    throw new Exception('too long "line"');
  }

  // sql
  $con = get_pdo();
  $sql = 'INSERT INTO chat_line (line) VALUES (?)';
  $stmt = $con->prepare($sql);
  $stmt->bindValue(1, $line, PDO::PARAM_STR);
  $stmt->execute();

  $id = $con->lastInsertId();

  $sql = 'SELECT * FROM chat_line WHERE id = ?';
  $stmt = $con->prepare($sql);
  $stmt->bindValue(1, $id, PDO::PARAM_STR);
  $stmt->execute();
  $res = $stmt->fetch(PDO::FETCH_ASSOC);

  echo json_encode($res);
}

function get_pdo() {
  return new PDO('mysql:host='.MYSQL_HOST.';dbname='.MYSQL_DBNAME, MYSQL_USER, MYSQL_PASS);
}
