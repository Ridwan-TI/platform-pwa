<?php
// FIXED: Tambahkan CORS headers yang wajib ada
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json");

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once __DIR__ . '/koneksi.php';

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