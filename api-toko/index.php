<?php
error_reporting(E_ALL);
ini_set('display_errors', 1);

require_once __DIR__ . '/koneksi.php';

$query = mysqli_query($koneksi, "SELECT * FROM barang");

if (!$query) {
    die("Query gagal: " . mysqli_error($koneksi));
}

while ($data = mysqli_fetch_array($query)) {
    echo "ID: " . $data['ID'] . "<br>";
    echo "Nama Barang: " . $data['nama_barang'] . "<br>";
    echo "Harga: " . $data['harga'] . "<br><br>";
}
?>
