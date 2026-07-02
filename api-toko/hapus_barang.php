<?php
// FIXED: Tambahkan CORS headers yang wajib ada
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Content-Type: application/json");

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once __DIR__ . '/koneksi.php';

// ==========================
// VALIDASI TOKEN (DENGAN FALLBACK UNTUK CGI/FASTCGI HOSTING)
// ==========================
$token_dikirim = '';

if (isset($_SERVER['HTTP_AUTHORIZATION'])) {
    $token_dikirim = trim($_SERVER['HTTP_AUTHORIZATION']);
} elseif (isset($_SERVER['REDIRECT_HTTP_AUTHORIZATION'])) {
    $token_dikirim = trim($_SERVER['REDIRECT_HTTP_AUTHORIZATION']);
} else {
    $headers = function_exists('getallheaders') ? getallheaders() : [];
    foreach ($headers as $key => $val) {
        if (strtolower($key) === 'authorization') {
            $token_dikirim = trim($val);
            break;
        }
    }
}

if ($token_dikirim === '') {
    echo json_encode([
        "status"  => "error",
        "pesan"   => "Token tidak ditemukan",
        "message" => "Token tidak ditemukan"
    ]);
    exit();
}

$token_aman = mysqli_real_escape_string($koneksi, $token_dikirim);
$cek_token  = mysqli_query($koneksi, "SELECT id FROM users WHERE token='$token_aman' LIMIT 1");

if (mysqli_num_rows($cek_token) === 0) {
    echo json_encode([
        "status"  => "error",
        "pesan"   => "Akses Ditolak! Token Invalid.",
        "message" => "Akses Ditolak! Token Invalid."
    ]);
    exit();
}

// Menangkap kiriman JSON
$json_data = file_get_contents("php://input");
$data = json_decode($json_data, true);

// Validasi keberadaan parameter ID
if (isset($data['id'])) {

    // Amankan parameter ID
    $id_barang = mysqli_real_escape_string($koneksi, $data['id']);

    // FIXED: nama kolom pakai ID (huruf besar) sesuai struktur tabel
    $query = "DELETE FROM barang WHERE ID = '$id_barang'";

    if (mysqli_query($koneksi, $query)) {
        // Cek apakah baris benar-benar terhapus
        if (mysqli_affected_rows($koneksi) > 0) {
            echo json_encode(["status" => "success", "pesan" => "Data barang berhasil dihapus!"]);
        } else {
            echo json_encode(["status" => "error", "pesan" => "ID tidak ditemukan di database"]);
        }
    } else {
        echo json_encode(["status" => "error", "pesan" => "Gagal menghapus data: " . mysqli_error($koneksi)]);
    }

} else {
    echo json_encode(["status" => "error", "pesan" => "ID Barang wajib dikirim!"]);
}
?>