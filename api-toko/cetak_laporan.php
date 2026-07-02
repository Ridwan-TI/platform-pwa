<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, OPTIONS");
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
        "status" => "error",
        "message"  => "Token tidak ditemukan"
    ]);
    exit();
}

$token_aman = mysqli_real_escape_string($koneksi, $token_dikirim);
$cek_token  = mysqli_query($koneksi, "SELECT id FROM users WHERE token='$token_aman' LIMIT 1");

if (mysqli_num_rows($cek_token) === 0) {
    echo json_encode([
        "status" => "error",
        "message"  => "Akses Ditolak! Token Invalid."
    ]);
    exit();
}

// ==========================
// AMBIL DATA BARANG
// ==========================
if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    echo json_encode([
        "status" => "error",
        "message"  => "Method tidak diizinkan"
    ]);
    exit();
}

// Murni mengambil SEMUA data barang, diurutkan berdasarkan abjad (A-Z)
$query  = mysqli_query($koneksi, "SELECT * FROM barang ORDER BY nama_barang ASC");
$data_laporan = [];
$total_aset = 0; 

while ($row = mysqli_fetch_assoc($query)) {
    $data_laporan[] = $row;
    $total_aset += (int)$row['harga'];
}

echo json_encode([
    "status" => "success",
    "data" => $data_laporan,
    "total_aset_rupiah" => $total_aset,
    "total_item" => count($data_laporan)
]);
?>