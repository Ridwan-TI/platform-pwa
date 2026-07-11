<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Content-Type: application/json");

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
        "pesan"  => "Token tidak ditemukan"
    ]);
    exit();
}

$token_aman = mysqli_real_escape_string($koneksi, $token_dikirim);
$cek_token  = mysqli_query($koneksi, "SELECT id FROM users WHERE token='$token_aman' LIMIT 1");

if (mysqli_num_rows($cek_token) === 0) {
    echo json_encode([
        "status" => "error",
        "pesan"  => "Akses Ditolak! Token Invalid."
    ]);
    exit();
}

// ==========================
// AMBIL DATA BARANG
// ==========================
if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    echo json_encode([
        "status" => "error",
        "pesan"  => "Method tidak diizinkan"
    ]);
    exit();
}

if (isset($_GET['kode_qr'])) {
    $kode_qr = mysqli_real_escape_string($koneksi, trim($_GET['kode_qr']));
    $query = mysqli_query($koneksi, "SELECT * FROM barang WHERE kode_qr = '$kode_qr' LIMIT 1");
    if ($query && mysqli_num_rows($query) > 0) {
        $barang = mysqli_fetch_assoc($query);
        echo json_encode([
            "status"  => "success",
            "message" => "Barang ditemukan.",
            "data"    => $barang
        ]);
    } else {
        echo json_encode([
            "status"  => "not_found",
            "message" => "Belum ada di database.",
            "data"    => null
        ]);
    }
    exit();
}

$query  = mysqli_query($koneksi, "SELECT * FROM barang ORDER BY ID DESC");
$data   = [];

while ($baris = mysqli_fetch_assoc($query)) {
    $data[] = $baris;
}

echo json_encode([
    "status"  => "success",
    "message" => "Berhasil mengambil data",
    "data"    => $data
]);
?>