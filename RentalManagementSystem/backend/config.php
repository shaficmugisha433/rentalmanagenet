<?php
session_start();
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: '.($_SERVER['HTTP_ORIGIN'] ?? '*')); header('Access-Control-Allow-Credentials: true');
$pdo = new PDO('mysql:host=localhost;dbname=rms;charset=utf8mb4', 'root', '', [PDO::ATTR_ERRMODE=>PDO::ERRMODE_EXCEPTION, PDO::ATTR_DEFAULT_FETCH_MODE=>PDO::FETCH_ASSOC]);
