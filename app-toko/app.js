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

      barisHTML += `
        <tr class="text-center hover:bg-gray-50 transition">
          <td class="px-6 py-3">${barang.ID}</td>
          <td class="px-6 py-3">
            <img src="${urlGambar}" class="w-12 h-12 object-cover rounded mx-auto border">
          </td>
          <td class="px-6 py-3">${barang.nama_barang}</td>
          <td class="px-6 py-3">Rp ${Number(barang.harga).toLocaleString("id-ID")}</td>
          <td class="px-6 py-3 flex justify-center gap-2">
            <button
              onclick="isiFormEdit('${barang.ID}', '${barang.nama_barang}', '${barang.harga}')"
              class="bg-yellow-400 hover:bg-yellow-500 text-white px-3 py-1 rounded-lg text-xs font-semibold transition"
            >
              ✏️ Edit
            </button>
            <button
              onclick="hapusBarang('${barang.ID}', '${barang.nama_barang}')"
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
      barang.nama_barang.toLowerCase().includes(kw)
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
        body: JSON.stringify({ id: id, nama_barang: nama, harga: parseInt(harga) }),
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
  window.isiFormEdit = function (id, nama, harga) {
    modeEdit = true;

    document.getElementById("input-id").value    = id;
    document.getElementById("input-nama").value  = nama;
    document.getElementById("input-harga").value = harga;

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

    const inputGambar = document.getElementById("input-gambar");
    if (inputGambar) inputGambar.value = "";

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

  window.logout = function () {
    localStorage.removeItem("token_toko");
    window.location.href = "login.html";
  };
});