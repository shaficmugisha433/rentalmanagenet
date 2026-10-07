<?php // Run ONCE in the browser to create the landlord account, then DELETE this file.
require 'config.php';
$pdo->prepare("INSERT IGNORE INTO users(name,email,password,role) VALUES('Landlord','admin@rms.ug',?,'admin')")->execute([password_hash('admin123', PASSWORD_DEFAULT)]);
echo json_encode(['ok'=>'Landlord created: admin@rms.ug / admin123 — change it and delete setup.php']);
