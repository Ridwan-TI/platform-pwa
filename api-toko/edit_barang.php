<?php
// File baru: edit_barang.php
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

$json_data = file_get_contents("php://input");
$data = json_decode($json_data, true);

// Validasi parameter wajib: id, nama_barang, harga
if (isset($data['id'], $data['nama_barang'], $data['harga'])) {

    $id          = mysqli_real_escape_string($koneksi, $data['id']);
    $nama_barang = mysqli_real_escape_string($koneksi, $data['nama_barang']);
    $harga       = (int) $data['harga'];
    $kode_qr     = isset($data['kode_qr']) && trim($data['kode_qr']) !== '' ? "'" . mysqli_real_escape_string($koneksi, trim($data['kode_qr'])) . "'" : "NULL";
    $latitude    = isset($data['latitude']) && trim($data['latitude']) !== '' ? "'" . mysqli_real_escape_string($koneksi, trim($data['latitude'])) . "'" : "NULL";
    $longitude   = isset($data['longitude']) && trim($data['longitude']) !== '' ? "'" . mysqli_real_escape_string($koneksi, trim($data['longitude'])) . "'" : "NULL";

    $query = "UPDATE barang SET 
                nama_barang = '$nama_barang', 
                harga = $harga, 
                kode_qr = $kode_qr,
                latitude = $latitude,
                longitude = $longitude
              WHERE ID = '$id'";
    $hasil = mysqli_query($koneksi, $query);

    if ($hasil) {
        if (mysqli_affected_rows($koneksi) > 0) {
            echo json_encode([
                "status"  => "success",
                "message" => "Data barang berhasil diperbarui!",
                "data"    => [
                    "ID"          => $id,
                    "nama_barang" => $nama_barang,
                    "harga"       => $harga
                ]
            ]);
        } else {
            // Query berhasil tapi tidak ada perubahan (data sama)
            echo json_encode([
                "status"  => "success",
                "message" => "Tidak ada perubahan pada data."
            ]);
        }
    } else {
        echo json_encode([
            "status"  => "error",
            "message" => "Gagal memperbarui data: " . mysqli_error($koneksi)
        ]);
    }

} else {
    echo json_encode([
        "status"  => "error",
        "message" => "Data tidak lengkap. Wajib kirim: id, nama_barang, harga"
    ]);
}
?>