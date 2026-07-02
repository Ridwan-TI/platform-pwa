// 1. Fungsi Bawaan JS untuk memformat angka jadi Rupiah (Rp 1.000.000,00)
const formatRupiah = (angka) => {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR'
    }).format(angka);
};

async function siapkanLaporan() {
    // Tulis tanggal saat ini di pojok laporan
    const now = new Date();
    document.getElementById('tanggal-cetak').innerText = `Dicetak pada: ${now.toLocaleString('id-ID').replace(/\./g, ':')}`;

    // Ambil Token Keamanan dari LocalStorage (Satu domain)
    const myToken = localStorage.getItem('token_toko');

    if (!myToken) {
        alert("Akses Ditolak: Anda belum login!");
        window.location.href = "login.html";
        return;
    }

    try {
        // Tarik data seluruhnya dari API, Sisipkan Token di Header!
        const response = await fetch('../api-toko/cetak_laporan.php', {
            method: 'GET',
            headers: {
                'Authorization': myToken
            }
        });
        const hasil = await response.json();

        if (hasil.status === 'success') {
            let barisHTML = '';

            // Render setiap baris dengan format Rupiah
            hasil.data.forEach((barang, index) => {
                barisHTML += `
                    <tr class="text-center">
                        <td class="border border-black p-2">${index + 1}</td>
                        <td class="border border-black p-2 text-left">${barang.nama_barang}</td>
                        <td class="border border-black p-2 text-right">${formatRupiah(barang.harga)}</td>
                    </tr>
                `;
            });

            // Suntikkan ke HTML
            document.getElementById('area-tabel-cetak').innerHTML = barisHTML;
            document.getElementById('area-total').innerHTML = formatRupiah(hasil.total_aset_rupiah);
            document.getElementById('jumlah-item').innerText = hasil.total_item;

            // Sembunyikan tulisan loading
            document.getElementById('loading-indicator').style.display = 'none';

            // ---- MAGIC MOMENT ----
            // Beri jeda 800ms agar browser sempat menggambar CSS dan tabel secara sempurna
            setTimeout(() => {
                window.print(); // Memanggil fungsi Print OS
            }, 800);

        } else {
            alert("Akses Ditolak: " + hasil.message);
            window.location.href = "login.html";
        }
    } catch (error) {
        alert("Gagal memuat data laporan!");
        console.error(error);
    }
}

// Langsung eksekusi saat file dibuka!
siapkanLaporan();

// EVENT LISTENER KHUSUS: 
// Ketika dialog Print ditutup (baik disave PDF maupun dicancel), tutup tab ini otomatis!
window.onafterprint = function () {
    window.close();
};