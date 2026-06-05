<?php
header("Content-Type: application/json");
// 1. Panggil kunci gudang (koneksi)
require_once __DIR__ . '/koneksi.php';

// 2. Buat perintah SQL (Minta data ke gudang)
$query = "SELECT * FROM barang ORDER BY ID DESC";
$hasil = mysqli_query($koneksi, $query);

// 3. Siapkan keranjang kosong untuk menampung data
$data_barang = array();

// 4. Masukkan data dari gudang ke keranjang satu per satu
while ($baris = mysqli_fetch_assoc($hasil)) {
    $data_barang[] = $baris;
}

// 5. Buat format bungkusan paket (Response API)
$response = [
    "status"  => "success",
    "message" => "Berhasil mengambil data",
    "data"    => $data_barang
];

// 6. Olah dan tampilkan paket sebagai JSON!
echo json_encode($response);
?>
