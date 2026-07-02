<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
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
// HANYA TERIMA POST
// ==========================
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode([
        "status" => "error",
        "pesan"  => "Method tidak diizinkan"
    ]);
    exit();
}

// ==========================
// AMBIL DATA FORM
// ==========================
$nama  = trim($_POST['nama_barang'] ?? '');
$harga = trim($_POST['harga'] ?? '');

if ($nama === '' || $harga === '') {
    echo json_encode([
        "status" => "error",
        "pesan"  => "Data tidak lengkap"
    ]);
    exit();
}

$nama  = mysqli_real_escape_string($koneksi, $nama);
$harga = intval($harga);

// ==========================
// UPLOAD GAMBAR (OPSIONAL)
// ==========================
$namaFile = null;

if (isset($_FILES['gambar']) && $_FILES['gambar']['error'] === UPLOAD_ERR_OK) {

    $uploadDir = __DIR__ . '/uploads/';

    if (!is_dir($uploadDir)) {
        mkdir($uploadDir, 0755, true);
    }

    $ekstensiDiizinkan = ['jpg', 'jpeg', 'png', 'gif', 'webp'];
    $ekstensiFile      = strtolower(pathinfo($_FILES['gambar']['name'], PATHINFO_EXTENSION));

    if (!in_array($ekstensiFile, $ekstensiDiizinkan)) {
        echo json_encode([
            "status" => "error",
            "pesan"  => "Format gambar tidak diizinkan. Gunakan: jpg, jpeg, png, gif, webp"
        ]);
        exit();
    }

    $namaFile = uniqid('barang_', true) . '.' . $ekstensiFile;
    $tujuan   = $uploadDir . $namaFile;

    if (!move_uploaded_file($_FILES['gambar']['tmp_name'], $tujuan)) {
        echo json_encode([
            "status" => "error",
            "pesan"  => "Gagal mengupload gambar"
        ]);
        exit();
    }
}

// ==========================
// SIMPAN KE DATABASE
// ==========================
if ($namaFile !== null) {
    $namaFileSafe = mysqli_real_escape_string($koneksi, $namaFile);
    $query = "INSERT INTO barang (nama_barang, harga, gambar)
              VALUES ('$nama', '$harga', '$namaFileSafe')";
} else {
    $query = "INSERT INTO barang (nama_barang, harga)
              VALUES ('$nama', '$harga')";
}

$hasil = mysqli_query($koneksi, $query);

if ($hasil) {
    echo json_encode([
        "status"  => "success",
        "message" => "Barang berhasil ditambahkan"
    ]);
} else {
    echo json_encode([
        "status"  => "error",
        "message" => mysqli_error($koneksi)
    ]);
}
?>