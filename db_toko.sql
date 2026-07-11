-- Skema Database untuk Toko PWA
-- Impor file ini di phpMyAdmin (http://localhost/phpmyadmin) setelah membuat database `db_toko`

CREATE DATABASE IF NOT EXISTS `db_toko`;
USE `db_toko`;

-- --------------------------------------------------------
-- Struktur dari tabel `users`
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS `users` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `username` varchar(255) NOT NULL,
  `password` varchar(255) NOT NULL,
  `token` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `username` (`username`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Seed data untuk `users` (Akun default untuk masuk)
-- Username: admin, Password: admin123
INSERT INTO `users` (`id`, `username`, `password`, `token`) VALUES
(1, 'admin', 'admin123', NULL)
ON DUPLICATE KEY UPDATE `username`='admin';

-- --------------------------------------------------------
-- Struktur dari tabel `barang`
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS `barang` (
  `ID` int(11) NOT NULL AUTO_INCREMENT,
  `nama_barang` varchar(255) NOT NULL,
  `harga` int(11) NOT NULL,
  `gambar` varchar(255) DEFAULT NULL,
  `kode_qr` varchar(255) DEFAULT NULL,
  `latitude` varchar(50) DEFAULT NULL,
  `longitude` varchar(50) DEFAULT NULL,
  PRIMARY KEY (`ID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Seed data opsional untuk `barang`
INSERT INTO `barang` (`ID`, `nama_barang`, `harga`, `gambar`) VALUES
(1, 'Kopi Susu Gula Aren', 15000, NULL),
(2, 'Roti Bakar Cokelat', 12000, NULL),
(3, 'Teh Tarik Klasik', 10000, NULL)
ON DUPLICATE KEY UPDATE `nama_barang`=VALUES(`nama_barang`);
