// CEK LOGIN
const myToken = localStorage.getItem("token_toko");

if (!myToken) {
  alert("Anda harus login terlebih dahulu!");
  window.location.href = "login.html";
}

document.addEventListener("DOMContentLoaded", function () {
  let semuaData = [];
  let dataFiltered = []; // data setelah filter pencarian
  let modeEdit = false;

  // =========================
  // PAGINATION
  // =========================
  let halamanSaatIni = 1;
  const itemPerHalaman = 5;

  function totalHalaman() {
    return Math.ceil(dataFiltered.length / itemPerHalaman) || 1;
  }

  function updateInfoHalaman() {
    const total = dataFiltered.length;
    const halaman = totalHalaman();
    document.getElementById("info-halaman").textContent =
      `Halaman ${halamanSaatIni} dari ${halaman} (Total: ${total} Data)`;

    const btnPrev = document.getElementById("btn-prev");
    const btnNext = document.getElementById("btn-next");

    btnPrev.disabled = halamanSaatIni <= 1;
    btnNext.disabled = halamanSaatIni >= halaman;
  }

  window.gantiHalaman = function (arah) {
    const halaman = totalHalaman();
    halamanSaatIni += arah;
    if (halamanSaatIni < 1) halamanSaatIni = 1;
    if (halamanSaatIni > halaman) halamanSaatIni = halaman;
    renderHalaman();
  };

  function renderHalaman() {
    const mulai = (halamanSaatIni - 1) * itemPerHalaman;
    const akhir = mulai + itemPerHalaman;
    const dataPaginate = dataFiltered.slice(mulai, akhir);
    renderTabel(dataPaginate);
    updateInfoHalaman();
  }

  const getApiBaseUrl = () => {
    const path = window.location.pathname;
    if (path.includes("/app-toko/")) {
      return "../api-toko/";
    } else {
      return "api-toko/";
    }
  };
  const API_BASE   = getApiBaseUrl();
  const URL_GET    = API_BASE + "get-barang.php";
  const URL_TAMBAH = API_BASE + "tambah_barang.php";
  const URL_HAPUS  = API_BASE + "hapus_barang.php";
  const URL_EDIT   = API_BASE + "edit_barang.php";

  // =========================
  // AMBIL DATA (GET)
  // =========================
  async function ambilDataBarang() {
    try {
      const response = await fetch(URL_GET, {
        method: "GET",
        headers: {
          Authorization: myToken,
        },
      });

      const text = await response.text();
      console.log("GET Response:", text);

      const hasil = text ? JSON.parse(text) : {};

      if (hasil.status === "success") {
        semuaData = hasil.data || [];
        dataFiltered = [...semuaData];
        halamanSaatIni = 1;
        renderHalaman();
        document.getElementById("total-barang").textContent = semuaData.length;
        renderDashboard();
      } else {
        console.error("Response tidak sesuai:", hasil);
      }
    } catch (error) {
      console.error("Gagal mengambil data:", error);
    }
  }

  // =========================
  // RENDER TABEL (tanpa pagination logic)
  // =========================
  function renderTabel(data) {
    let barisHTML = "";

    data.forEach((barang) => {
      let urlGambar = barang.gambar
        ? `${API_BASE}uploads/${barang.gambar}`
        : `https://via.placeholder.com/50?text=No+Img`;

      // Badge kode QR
      const badgeQr = barang.kode_qr
        ? `<div class="mt-1"><span class="font-mono text-[10px] bg-purple-100 text-purple-800 px-1.5 py-0.5 rounded border border-purple-200">
             ${barang.kode_qr}
           </span></div>`
        : '';

      // Google Maps Link
      let linkMaps = '<span class="text-gray-400 text-xs">-</span>';
      if (barang.latitude && barang.longitude) {
        const url = `https://maps.google.com/?q=${barang.latitude},${barang.longitude}`;
        linkMaps = `
          <div class="text-[11px] text-gray-500 leading-tight">
            ${parseFloat(barang.latitude).toFixed(4)}, ${parseFloat(barang.longitude).toFixed(4)}
          </div>
          <a href="${url}" target="_blank" class="text-blue-600 hover:text-blue-800 text-xs font-semibold underline flex items-center justify-center gap-0.5 mt-0.5">
            🗺️ Buka Map
          </a>
        `;
      }

      barisHTML += `
        <tr id="row-${barang.ID}" class="text-center hover:bg-gray-50 transition duration-300">
          <td class="px-6 py-3">${barang.ID}</td>
          <td class="px-6 py-3">
            <img src="${urlGambar}" class="w-12 h-12 object-cover rounded mx-auto border">
          </td>
          <td class="px-6 py-3">
            <div class="font-medium">${barang.nama_barang}</div>
            ${badgeQr}
          </td>
          <td class="px-6 py-3 font-semibold text-gray-900">Rp ${Number(barang.harga).toLocaleString("id-ID")}</td>
          <td class="px-6 py-3">${linkMaps}</td>
          <td class="px-6 py-3 flex justify-center items-center gap-2">
            <button
              onclick="isiFormEdit('${barang.ID}', '${barang.nama_barang.replace(/'/g, "\\'")}', '${barang.harga}', '${barang.kode_qr || ''}', '${barang.latitude || ''}', '${barang.longitude || ''}')"
              class="bg-yellow-400 hover:bg-yellow-500 text-white px-3 py-1 rounded-lg text-xs font-semibold transition"
            >
              ✏️ Edit
            </button>
            <button
              onclick="hapusBarang('${barang.ID}', '${barang.nama_barang.replace(/'/g, "\\'")}')"
              class="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded-lg text-xs font-semibold transition"
            >
              🗑️ Hapus
            </button>
          </td>
        </tr>
      `;
    });

    document.getElementById("tabel-barang").innerHTML = barisHTML;
  }

  // fungsi lama tampilkanData tetap ada agar tidak merusak referensi lain
  function tampilkanData(data) {
    dataFiltered = data;
    halamanSaatIni = 1;
    renderHalaman();
    document.getElementById("total-barang").textContent = semuaData.length;
  }

  // =========================
  // SEARCH — input #search (sidebar/utama)
  // =========================
  document.getElementById("search").addEventListener("input", function () {
    jalankanFilter(this.value);
    // sinkronkan input-cari juga
    const inputCari = document.getElementById("input-cari");
    if (inputCari) inputCari.value = this.value;
  });

  // =========================
  // SEARCH — input #input-cari (dari HTML tambahan)
  // =========================
  window.jalankanPencarian = function () {
    const keyword = document.getElementById("input-cari").value;
    jalankanFilter(keyword);
    // sinkronkan input search utama juga
    const inputSearch = document.getElementById("search");
    if (inputSearch) inputSearch.value = keyword;
  };

  function jalankanFilter(keyword) {
    const kw = keyword.toLowerCase();
    const hasilFilter = semuaData.filter((barang) =>
      barang.nama_barang.toLowerCase().includes(kw) ||
      (barang.kode_qr && barang.kode_qr.toLowerCase().includes(kw))
    );
    tampilkanData(hasilFilter);
  }

  // =========================
  // TAMBAH / UPDATE BARANG
  // =========================
  document.getElementById("btn-simpan").addEventListener("click", async function () {
    const id    = document.getElementById("input-id").value.trim();
    const nama  = document.getElementById("input-nama").value.trim();
    const harga = document.getElementById("input-harga").value.trim();

    if (!nama || !harga) {
      alert("⚠️ Nama barang dan harga tidak boleh kosong!");
      return;
    }

    if (modeEdit && id) {
      await updateBarang(id, nama, harga);
    } else {
      await tambahBarang(nama, harga);
    }
  });

  // -- TAMBAH BARU --
  async function tambahBarang(nama, harga) {
    try {
      const formData = new FormData();
      formData.append("nama_barang", nama);
      formData.append("harga", harga);
      formData.append("kode_qr", document.getElementById("form-kode-qr").value.trim());
      formData.append("latitude", document.getElementById("form-latitude").value.trim());
      formData.append("longitude", document.getElementById("form-longitude").value.trim());

      const gambar = document.getElementById("input-gambar")?.files[0];
      if (gambar) {
        formData.append("gambar", gambar);
      }

      const response = await fetch(URL_TAMBAH, {
        method: "POST",
        headers: {
          Authorization: myToken,
        },
        body: formData,
      });

      const text  = await response.text();
      const hasil = text ? JSON.parse(text) : {};

      console.log("POST Response:", hasil);

      if (hasil.status === "success") {
        alert("✅ " + hasil.message);
        resetForm();
        ambilDataBarang();
      } else {
        alert("❌ " + (hasil.message || hasil.pesan || "Response tidak valid"));
      }
    } catch (error) {
      console.error("Gagal mengirim data:", error);
      alert("❌ Terjadi kesalahan koneksi ke server.");
    }
  }

  // -- UPDATE (EDIT) --
  async function updateBarang(id, nama, harga) {
    try {
      const response = await fetch(URL_EDIT, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: myToken,
        },
        body: JSON.stringify({ 
          id: id, 
          nama_barang: nama, 
          harga: parseInt(harga),
          kode_qr: document.getElementById("form-kode-qr").value.trim(),
          latitude: document.getElementById("form-latitude").value.trim(),
          longitude: document.getElementById("form-longitude").value.trim()
        }),
      });

      const text  = await response.text();
      const hasil = text ? JSON.parse(text) : {};

      console.log("UPDATE Response:", hasil);

      if (hasil.status === "success") {
        alert("✅ " + (hasil.message || "Data berhasil diperbarui!"));
        resetForm();
        ambilDataBarang();
      } else {
        alert("❌ " + (hasil.message || "Gagal memperbarui data"));
      }
    } catch (error) {
      console.error("Gagal update data:", error);
      alert("❌ Terjadi kesalahan koneksi ke server.");
    }
  }


  async function renderDashboard() {
    try {
        // Ambil data JSON dari backend dengan relative path & header Authorization
        const response = await fetch(API_BASE + 'statistik.php', {
            method: 'GET',
            headers: {
                'Authorization': myToken
            }
        });
        const json = await response.json();

        if (json.status === 'success') {
            const ctx = document.getElementById('myChart');

            // --- BUG FIX: GHOSTING EFFECT ---
            // Jika kanvas sudah pernah digambar, kita harus menghancurkannya dulu.
            // Jika tidak, grafik lama dan baru akan bertumpuk, menyebabkan kedipan 
            // aneh (glitch) saat Anda menggeser mouse di atas grafik.
            let chartStatus = Chart.getChart("myChart");
            if (chartStatus != undefined) {
                chartStatus.destroy();
            }

            // Mulai melukis grafik baru
            new Chart(ctx, {
                type: 'bar', // Tipe grafik batang
                data: {
                    labels: json.chart_data.labels, // Data Sumbu X (Array Nama)
                    datasets: [{
                        label: 'Harga Barang (Rp)',
                        data: json.chart_data.values, // Data Sumbu Y (Array Harga)
                        // Kustomisasi Warna
                        backgroundColor: [
                            'rgba(234, 88, 12, 0.6)',  // Orange utama
                            'rgba(59, 130, 246, 0.6)', // Biru
                            'rgba(16, 185, 129, 0.6)', // Hijau
                            'rgba(236, 72, 153, 0.6)', // Pink
                            'rgba(139, 92, 246, 0.6)'  // Ungu
                        ],
                        borderColor: 'rgba(234, 88, 12, 1)',
                        borderWidth: 1,
                        borderRadius: 6 // Ujung batang dibuat agak membulat
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false, // Wajib false agar mengikuti tinggi container
                    scales: {
                        y: { 
                            beginAtZero: true // Sumbu Y wajib dimulai dari 0 agar proporsional
                        } 
                    }
                }
            });
        }
    } catch (error) {
        console.error('Gagal memuat grafik:', error);
    }
}

// Panggil fungsi ini agar grafik muncul saat web pertama kali di-load
renderDashboard();

  // =========================
  // ISI FORM EDIT
  // =========================
  window.isiFormEdit = function (id, nama, harga, kodeQr, latitude, longitude) {
    modeEdit = true;

    document.getElementById("input-id").value    = id;
    document.getElementById("input-nama").value  = nama;
    document.getElementById("input-harga").value = harga;
    document.getElementById("form-kode-qr").value = kodeQr || "";
    document.getElementById("form-latitude").value = latitude || "";
    document.getElementById("form-longitude").value = longitude || "";

    document.getElementById("form-title").textContent = "✏️ Edit Barang (ID: " + id + ")";
    document.getElementById("btn-simpan").textContent = "💾 Update";
    document.getElementById("btn-simpan").classList.replace("bg-emerald-500", "bg-yellow-500");
    document.getElementById("btn-simpan").classList.replace("hover:bg-emerald-600", "hover:bg-yellow-600");
    document.getElementById("btn-batal").classList.remove("hidden");

    document.getElementById("input-nama").focus();
  };

  // =========================
  // BATAL EDIT
  // =========================
  document.getElementById("btn-batal").addEventListener("click", function () {
    resetForm();
  });

  function resetForm() {
    modeEdit = false;

    document.getElementById("input-id").value    = "";
    document.getElementById("input-nama").value  = "";
    document.getElementById("input-harga").value = "";
    document.getElementById("form-kode-qr").value = "";
    document.getElementById("form-latitude").value = "";
    document.getElementById("form-longitude").value = "";

    const inputGambar = document.getElementById("input-gambar");
    if (inputGambar) inputGambar.value = "";

    const btnGps = document.getElementById('btn-lacak-gps');
    if (btnGps) {
      btnGps.innerHTML = '📍 Lacak GPS';
      btnGps.style.background = '';
      btnGps.style.color = '';
      btnGps.disabled = false;
    }

    document.getElementById("form-title").textContent = "➕ Tambah Barang Baru";
    document.getElementById("btn-simpan").textContent = "💾 Simpan";
    document.getElementById("btn-simpan").classList.replace("bg-yellow-500", "bg-emerald-500");
    document.getElementById("btn-simpan").classList.replace("hover:bg-yellow-600", "hover:bg-emerald-600");
    document.getElementById("btn-batal").classList.add("hidden");
  }

  // =========================
  // HAPUS BARANG
  // =========================
  window.hapusBarang = async function (id, nama) {
    const konfirmasi = confirm(
      `⚠️ Apakah kamu yakin ingin menghapus barang:\n"${nama}" (ID: ${id})?\n\nTindakan ini tidak dapat dibatalkan!`
    );

    if (!konfirmasi) return;

    try {
      const response = await fetch(URL_HAPUS, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: myToken,
        },
        body: JSON.stringify({ id: id }),
      });

      const text  = await response.text();
      const hasil = text ? JSON.parse(text) : {};

      console.log("DELETE Response:", hasil);

      if (hasil.status === "success") {
        alert("🗑️ " + (hasil.pesan || "Barang berhasil dihapus!"));
        ambilDataBarang();
      } else {
        alert("❌ " + (hasil.pesan || "Gagal menghapus data"));
      }
    } catch (error) {
      console.error("Gagal menghapus data:", error);
      alert("❌ Terjadi kesalahan koneksi ke server.");
    }
  };

  // =========================
  // LOAD AWAL
  // =========================
  ambilDataBarang();

  // =========================
  // SERVICE WORKER (PWA)
  // =========================
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker
      .register("./sw.js")
      .then((reg) => console.log("Service Worker berhasil:", reg.scope))
      .catch((err) => console.log("Gagal:", err));
  }

  // ============================================================
  // SMART QR GATEWAY & HARDWARE INTEGRATION (P14)
  // ============================================================
  
  // -- STATE GLOBAL --
  let _mainQrScanner = null;   // Instance scanner di modal utama
  let _formQrScanner = null;   // Instance scanner di modal form
  let _qrLastResult  = null;   // Simpan hasil lookup: { kodeQr, barang }
  
  // -- 1. SHOW TOAST UTILITY --
  window.showToast = function(pesan, tipe = 'info') {
    let container = document.getElementById('toast-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'toast-container';
      container.className = 'fixed bottom-20 right-4 z-[9999] flex flex-col gap-2 pointer-events-none max-w-sm';
      document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.className = `p-3 rounded-lg shadow-lg text-white font-medium text-xs pointer-events-auto transition-all duration-300 transform translate-y-2 opacity-0 flex items-center gap-2`;
    
    if (tipe === 'success') {
      toast.className += ' bg-emerald-600 border border-emerald-500';
    } else if (tipe === 'error') {
      toast.className += ' bg-red-600 border border-red-500';
    } else {
      toast.className += ' bg-blue-600 border border-blue-500';
    }

    toast.innerHTML = pesan;
    container.appendChild(toast);

    setTimeout(() => {
      toast.classList.remove('translate-y-2', 'opacity-0');
    }, 10);

    setTimeout(() => {
      toast.classList.add('translate-y-2', 'opacity-0');
      setTimeout(() => {
        toast.remove();
      }, 300);
    }, 4000);
  };

  // -- 2. BUKA MODAL SCANNER --
  window.bukaModalQrScan = function(mode) {
    _qrLastResult = null;
    window.qrScanMode = mode;

    document.getElementById('qr-modal-title').textContent =
        mode === 'tambah' ? 'Scan QR ➜ Tambah Barang' : 'Scan QR ➜ Cari Barang';
    document.getElementById('qr-modal-hint').textContent =
        mode === 'tambah'
            ? 'Jika belum ada, form tambah akan terbuka otomatis.'
            : 'Jika ada di database, barang langsung ditampilkan di tabel.';

    document.getElementById('modal-qr-scan').classList.add('active');
    window.initMainQrScanner();
  };

  // -- 3. INIT SCANNER KAMERA --
  window.initMainQrScanner = function() {
    if (_mainQrScanner) return; // Jangan dobel
    _mainQrScanner = new Html5QrcodeScanner(
        'qr-reader-main',
        { fps: 10, qrbox: { width: 240, height: 240 } },
        false
    );
    _mainQrScanner.render(
        async function(decodedText) {
            _mainQrScanner.pause(true);
            window.tampilQrStatus(decodedText, 'loading');

            try {
                const response = await fetch(API_BASE + `get-barang.php?kode_qr=${encodeURIComponent(decodedText)}`, {
                  method: 'GET',
                  headers: {
                    'Authorization': myToken
                  }
                });
                const hasil = await response.json();
                if (hasil.status === 'success' && hasil.data) {
                    _qrLastResult = { kodeQr: decodedText, barang: hasil.data };
                    window.tampilQrStatus(decodedText, 'found', hasil.data);
                } else {
                    _qrLastResult = { kodeQr: decodedText, barang: null };
                    window.tampilQrStatus(decodedText, 'notfound');
                }
            } catch (err) {
                console.error("API lookup error:", err);
                _qrLastResult = { kodeQr: decodedText, barang: null };
                window.tampilQrStatus(decodedText, 'notfound');
            }
        },
        function(err) {}
    );
  };

  // -- 4. TAMPILKAN STATUS HASIL SCAN --
  window.tampilQrStatus = function(kode, state, barang) {
    document.getElementById('qr-status-box').style.display = 'block';
    document.getElementById('qr-scanned-text').textContent = kode;

    ['qr-state-loading','qr-state-found','qr-state-notfound']
        .forEach(id => document.getElementById(id).style.display = 'none');

    if (state === 'loading') {
        document.getElementById('qr-state-loading').style.display = 'flex';
    } else if (state === 'found') {
        document.getElementById('qr-found-nama').textContent  = barang.nama_barang;
        document.getElementById('qr-found-harga').textContent = 'Rp ' + Number(barang.harga).toLocaleString('id-ID');
        document.getElementById('qr-state-found').style.display = 'block';
    } else {
        document.getElementById('qr-state-notfound').style.display = 'block';
    }
  };

  // -- 5. AKSI: Barang DITEMUKAN -> tampilkan di tabel --
  window.eksekusiQrFound = function() {
    const kode = _qrLastResult.kodeQr;
    const searchInput = document.getElementById('search');
    searchInput.value = kode;
    searchInput.dispatchEvent(new Event('input', { bubbles: true }));

    window.tutupModalQrScan();
    window.showToast('🔍 Menampilkan barang: ' + kode, 'info');

    // Highlight baris setelah data dimuat
    setTimeout(() => {
        const barang = _qrLastResult.barang;
        if (barang?.ID) {
            const row = document.getElementById(`row-${barang.ID}`);
            if (row) {
                row.scrollIntoView({ behavior: 'smooth', block: 'center' });
                row.style.background = '#d1fae5';
                setTimeout(() => row.style.background = '', 2500);
            }
        }
    }, 600);
  };

  // -- 6. AKSI: Barang BARU -> buka form tambah + prefill --
  window.eksekusiQrTambah = function() {
    const kode = _qrLastResult.kodeQr;
    window.tutupModalQrScan();
    setTimeout(() => {
        const formSec = document.querySelector('.form-section');
        if (formSec) {
            formSec.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
        const inputQr = document.getElementById('form-kode-qr');
        if (inputQr) {
            inputQr.value = kode;
            inputQr.style.borderColor = '#059669';
            setTimeout(() => inputQr.style.borderColor = '', 2000);
        }
        setTimeout(() => document.getElementById('input-nama')?.focus(), 150);
        window.showToast(`📦 Kode "${kode}" terisi. Lengkapi nama & harga.`, 'info');
    }, 300);
  };

  // -- 7. RESET & SCAN ULANG --
  window.resetQrScanner = function() {
    if (_mainQrScanner) { _mainQrScanner.clear().catch(()=>{}); _mainQrScanner = null; }
    document.getElementById('qr-reader-main').innerHTML = '';
    document.getElementById('qr-status-box').style.display = 'none';
    setTimeout(window.initMainQrScanner, 100);
  };

  // -- 8. TUTUP MODAL --
  window.tutupModalQrScan = function() {
    if (_mainQrScanner) { _mainQrScanner.clear().catch(()=>{}); _mainQrScanner = null; }
    document.getElementById('qr-reader-main').innerHTML = '';
    document.getElementById('qr-status-box').style.display = 'none';
    document.getElementById('modal-qr-scan').classList.remove('active');
  };

  // -- 9. INLINE FORM SCANNER --
  window.toggleFormScanner = function() {
    const formReaderDiv = document.getElementById('form-reader');
    if (formReaderDiv.classList.contains('hidden') || formReaderDiv.style.display === 'none') {
        formReaderDiv.classList.remove('hidden');
        formReaderDiv.style.display = 'block';
        
        if (_formQrScanner) return; // already running
        
        _formQrScanner = new Html5QrcodeScanner(
            'form-reader',
            { fps: 10, qrbox: { width: 200, height: 200 } },
            false
        );
        _formQrScanner.render(
            function(decodedText) {
                document.getElementById('form-kode-qr').value = decodedText;
                window.showToast(`📷 QR Code scanned: ${decodedText}`, 'success');
                if (_formQrScanner) {
                    _formQrScanner.clear().catch(()=>{});
                    _formQrScanner = null;
                }
                formReaderDiv.classList.add('hidden');
                formReaderDiv.style.display = 'none';
            },
            function(err) {}
        );
    } else {
        if (_formQrScanner) {
            _formQrScanner.clear().catch(()=>{});
            _formQrScanner = null;
        }
        formReaderDiv.classList.add('hidden');
        formReaderDiv.style.display = 'none';
    }
  };

  // -- 10. GEOLOKASI GPS --
  window.dapatkanLokasi = function() {
    const btnGps   = document.getElementById('btn-lacak-gps');
    const inputLat = document.getElementById('form-latitude');
    const inputLng = document.getElementById('form-longitude');

    if (!navigator.geolocation) {
        window.showToast('Browser tidak mendukung Geolocation.', 'error');
        return;
    }

    btnGps.disabled = true;
    btnGps.innerHTML = '⌛ Melacak...';

    navigator.geolocation.getCurrentPosition(
        function(position) {
            inputLat.value = position.coords.latitude.toFixed(7);
            inputLng.value = position.coords.longitude.toFixed(7);
            window.showToast('📍 Lokasi GPS berhasil dikunci!', 'success');
            btnGps.disabled = false;
            btnGps.innerHTML = '✓ Lokasi Terkunci';
            btnGps.style.background = '#059669';
            btnGps.style.color = '#ffffff';
        },
        function() {
            window.showToast('Gagal. Pastikan GPS aktif dan izin diberikan.', 'error');
            btnGps.disabled = false;
            btnGps.innerHTML = '📍 Lacak GPS';
            btnGps.style.background = '';
            btnGps.style.color = '';
        }
    );
  };

  window.logout = function () {
    localStorage.removeItem("token_toko");
    window.location.href = "login.html";
  };
});