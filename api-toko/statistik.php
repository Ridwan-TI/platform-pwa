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

// Ambil 5 barang paling mahal
// Fungsi LIMIT 5 mencegah grafik terlalu padat jika data ada ribuan
$query = "SELECT nama_barang, harga FROM barang ORDER BY harga DESC LIMIT 5";
$hasil = mysqli_query($koneksi, $query);

$labels_barang = []; // Wadah Sumbu X (Teks label bawah grafik)
$values_harga = [];  // Wadah Sumbu Y (Batang grafik)

while ($row = mysqli_fetch_assoc($hasil)) {
    $labels_barang[] = $row['nama_barang'];
    
    // (int) Sangat krusial agar Javascript mengenalinya sebagai Number
    $values_harga[] = (int) $row['harga']; 
}

// Susun respon JSON dengan struktur berlapis agar mudah dibaca Javascript
echo json_encode([
    "status" => "success",
    "pesan" => "Data statistik berhasil dimuat",
    "chart_data" => [
        "labels" => $labels_barang,
        "values" => $values_harga
    ]
]);
?>