<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");

// Deteksi environment (Local vs Hosting)
$is_local = in_array($_SERVER['HTTP_HOST'], ['localhost', '127.0.0.1', '[::1]']);

if ($is_local) {
    // --------------------------------------
    // Konfigurasi Database Local (XAMPP)
    // --------------------------------------
    $host = "localhost";
    $user = "root";
    $pass = "";
    $db   = "db_toko";
} else {
    // --------------------------------------
    // Konfigurasi Database Hosting (InfinityFree)
    // Silakan sesuaikan detail ini dengan data dari Client Area InfinityFree Anda
    // --------------------------------------
    $host = "sql311.infinityfree.com";          // <-- GANTI dengan MySQL Hostname dari Client Area
    $user = "if0_41816596";                     // Username database cPanel Anda
    $pass = "MASUKKAN_PASSWORD_AKUN_DISINI";    // <-- GANTI dengan Password Akun Hosting (bisa disalin dari cPanel)
    $db   = "if0_41816596_db_toko";             // <-- GANTI dengan nama database yang Anda buat di cPanel
}

// Nonaktifkan error exception mode mysqli agar tidak crash (PHP 8.1+)
mysqli_report(MYSQLI_REPORT_OFF);

// Koneksi ke database dengan supresi warning (@) agar tidak merusak output JSON
$koneksi = @mysqli_connect($host, $user, $pass, $db);

if (!$koneksi) {
    die(json_encode([
        "status" => "error",
        "pesan" => "Koneksi Database Gagal: " . mysqli_connect_error()
    ]));
}
?>