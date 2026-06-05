<?php
// File baru: edit_barang.php
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

$json_data = file_get_contents("php://input");
$data = json_decode($json_data, true);

// Validasi parameter wajib: id, nama_barang, harga
if (isset($data['id'], $data['nama_barang'], $data['harga'])) {

    $id          = mysqli_real_escape_string($koneksi, $data['id']);
    $nama_barang = mysqli_real_escape_string($koneksi, $data['nama_barang']);
    $harga       = (int) $data['harga'];

    $query = "UPDATE barang SET nama_barang = '$nama_barang', harga = $harga WHERE ID = '$id'";
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