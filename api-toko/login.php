<?php

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Access-Control-Allow-Methods: POST, GET, OPTIONS");
header("Content-Type: application/json; charset=UTF-8");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once __DIR__ . '/koneksi.php';

$json_data = file_get_contents("php://input");
$data = json_decode($json_data, true);

if (isset($data['username']) && isset($data['password'])) {

    $username = mysqli_real_escape_string($koneksi, $data['username']);
    $password = mysqli_real_escape_string($koneksi, $data['password']);

    $query = "SELECT * FROM users 
              WHERE username='$username' 
              AND password='$password'";

    $result = mysqli_query($koneksi, $query);

    if (mysqli_num_rows($result) > 0) {

        $user = mysqli_fetch_assoc($result);

        $token = md5(uniqid(rand(), true));
        $user_id = $user['id'];

        mysqli_query(
            $koneksi,
            "UPDATE users SET token='$token' WHERE id='$user_id'"
        );

        echo json_encode([
            "status" => "success",
            "pesan"  => "Login Berhasil",
            "token"  => $token
        ]);

    } else {

        echo json_encode([
            "status" => "error",
            "pesan"  => "Username atau Password Salah!"
        ]);

    }

} else {

    echo json_encode([
        "status" => "error",
        "pesan"  => "Akses Ditolak"
    ]);

}
?>