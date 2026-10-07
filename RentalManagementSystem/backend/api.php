<?php
require 'config.php';
$a=$_GET['a']??''; $t=$_GET['t']??''; $in=json_decode(file_get_contents('php://input'),true)?:[]; $u=$_SESSION['u']??null;
$ALL=['properties','tenants','leases','bookings','payments','bank_accounts','mobile_money','maintenance','complaints'];
$OWN=['bookings','payments','complaints']; $admin=$u&&$u['role']==='admin'; $tenant=$u&&$u['role']==='tenant';
function out($d,$c=200){http_response_code($c);echo json_encode($d);exit;}
if($a==='login'){ $s=$pdo->prepare('SELECT * FROM users WHERE email=?');$s->execute([$in['email']??'']);$r=$s->fetch();
  if(!$r||!password_verify($in['password']??'',$r['password']))out(['error'=>'Wrong email or password.']);
  $_SESSION['u']=['id'=>$r['id'],'name'=>$r['name'],'role'=>$r['role']];out($_SESSION['u']);}
if($a==='register'){ // the ONLY sign-up route, and it can only ever create tenants
  $n=trim($in['name']??'');$e=trim($in['email']??'');$p=$in['password']??'';
  if(!$n||!filter_var($e,FILTER_VALIDATE_EMAIL)||strlen($p)<6)out(['error'=>'Enter a name, a valid email and a password of 6+ characters.']);
  $s=$pdo->prepare('SELECT 1 FROM users WHERE email=?');$s->execute([$e]);if($s->fetch())out(['error'=>'That email already has an account.']);
  $pdo->prepare("INSERT INTO users(name,email,password,role) VALUES(?,?,?, 'tenant')")->execute([$n,$e,password_hash($p,PASSWORD_DEFAULT)]);
  $id=$pdo->lastInsertId();$pdo->prepare("INSERT INTO tenants(user_id,name,phone,email) VALUES(?,?,?,?)")->execute([$id,$n,$in['phone']??'',$e]);
  $_SESSION['u']=['id'=>$id,'name'=>$n,'role'=>'tenant'];out($_SESSION['u']);}
if($a==='logout'){session_destroy();out(['ok'=>1]);}
if(!in_array($t,$ALL,true))out(['error'=>'Unknown table'],400);
if($a==='list'){
  if($t==='properties'&&!$admin){out($pdo->query("SELECT * FROM properties WHERE status='available'")->fetchAll());} // public listing
  if($admin)out($pdo->query("SELECT * FROM `$t`")->fetchAll());
  if($tenant&&in_array($t,$OWN)){$s=$pdo->prepare("SELECT * FROM `$t` WHERE user_id=?");$s->execute([$u['id']]);out($s->fetchAll());}
  out(['error'=>'Not allowed'],403);}
if($a==='save'){
  if(!$admin&&!($tenant&&in_array($t,$OWN)))out(['error'=>'Not allowed'],403);
  if($tenant&&$t==='bookings'){
    $propertyId=filter_var($in['property_id']??null,FILTER_VALIDATE_INT);
    if(!$propertyId)out(['error'=>'Choose a valid room.'],400);
    $s=$pdo->prepare("SELECT id FROM properties WHERE id=? AND status='available' AND room_number IS NOT NULL AND TRIM(room_number)<>'' AND location IS NOT NULL AND TRIM(location)<>''");
    $s->execute([$propertyId]);
    if(!$s->fetch())out(['error'=>'This room is unavailable or needs a room number and location before it can be requested.'],409);
  }
  if($tenant){$in['user_id']=$u['id'];$in['tenant_name']=$u['name'];unset($in['id']);if($t==='payments')$in['status']='pending';if($t==='bookings')$in['status']='pending';}
  $cols=array_column($pdo->query("SHOW COLUMNS FROM `$t`")->fetchAll(),'Field');$d=array_intersect_key($in,array_flip($cols));unset($d['id']);
  foreach($d as $k=>$v)if($v==='')$d[$k]=null;
  if(!empty($in['id'])){$set=implode(',',array_map(fn($k)=>"`$k`=?",array_keys($d)));$pdo->prepare("UPDATE `$t` SET $set WHERE id=?")->execute([...array_values($d),$in['id']]);out(['id'=>$in['id']]);}
  $pdo->prepare("INSERT INTO `$t`(".implode(',',array_map(fn($k)=>"`$k`",array_keys($d))).") VALUES(".implode(',',array_fill(0,count($d),'?')).")")->execute(array_values($d));out(['id'=>$pdo->lastInsertId()]);}
if($a==='del'){if(!$admin)out(['error'=>'Not allowed'],403);$pdo->prepare("DELETE FROM `$t` WHERE id=?")->execute([$_GET['id']??0]);out(['ok'=>1]);}
out(['error'=>'Unknown action'],400);
